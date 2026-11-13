import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { buildFigmaCssArchive, parseFigmaCss } from '../figma-css.js';
import { readZip } from '../scripts/lib.mjs';
import { parseVersion } from '../scripts/versioning.mjs';

const directory = new URL('../', import.meta.url);
const read = (name) => readFile(new URL(name, directory), 'utf8');
const manifest = JSON.parse(await read('manifest.json'));
const packageJson = JSON.parse(await read('package.json'));
const offlineModuleSource = await read('offline-static.js');
assert.equal(manifest.manifest_version, 3);
assert.doesNotThrow(() => parseVersion(manifest.version, 'manifest.json version'));
assert.equal(packageJson.version, manifest.version, 'package.json version matches the authoritative manifest version');
assert(manifest.permissions.includes('storage'));
assert(manifest.permissions.includes('offscreen'));
assert(!manifest.permissions.includes('unlimitedStorage'));
const popupHtml = await read('popup.html');
assert.match(popupHtml, /<progress[^>]+aria-label="Export progress"/);
assert.match(popupHtml, /aria-live="polite"/);
assert.match(popupHtml, /Idle · ready to export/);
assert.match(popupHtml, /role="tablist"/);
assert.match(popupHtml, /role="tab"[^>]+aria-selected="true"/);
assert.match(popupHtml, /role="tabpanel"[^>]+hidden/);
assert.match(popupHtml, /id="close-window"[^>]+aria-label="Close extension window"/);
assert.equal((popupHtml.match(/\bid="storybook-message"/g) || []).length, 1);
assert.equal((popupHtml.match(/\bid="figma-message"/g) || []).length, 1);
assert(!popupHtml.includes('id="message"'), 'mode-specific messages do not share a result node');
assert(!popupHtml.includes('id="concurrency"'), 'popup does not expose concurrency above the approved serial default');
const popupJs = await read('popup.js');
for (const state of ['discovering', 'crawling', 'processing', 'compressing', 'completed', 'paused', 'cancelled', 'failed']) assert(popupJs.includes(`${state}:`));
assert(!popupJs.includes('tabs.query({ active: true, currentWindow: true })'), 'Current Docs does not query the extension window as source');
assert.match(popupJs, /event\.key === 'Home'.*event\.key === 'End'.*mode === 'storybook'/);
assert(!popupJs.includes('beforeunload'));
assert(!popupJs.includes('onblur') && !popupJs.includes('onfocusout'), 'window focus changes are not suppressed or used to close the tool');
assert.match(popupJs, /chrome\.windows\.getCurrent\(\)/, 'Close resolves the extension window from its page context');
assert.match(popupJs, /const windowId = currentWindow\?\.id;[\s\S]{0,100}Number\.isInteger\(windowId\) \|\| windowId < 0/, 'Close rejects missing and negative window IDs');
assert.match(popupJs, /chrome\.windows\.remove\(windowId\)/, 'Close removes the concrete current extension window');
assert(!popupJs.includes('WINDOW_ID_CURRENT'), 'Close does not pass the -2 sentinel to windows.remove');
assert(!/close-window[\s\S]{0,500}chrome\.tabs\.remove/.test(popupJs), 'Close does not remove browser tabs');
assert.match((await read('background.js')), /chrome\.windows\.create\([\s\S]{0,150}type: 'popup'/);

async function makeHarness({ entries = defaultEntries(), delay = 4, readinessFrames = null, realZip = false, offlineFixture = null } = {}) {
  const messages = new Set();
  const tabListeners = new Set();
  const downloadListeners = new Set();
  const tabs = new Map();
  const extensionWindows = new Map();
  const windowFocusCalls = [];
  const actionClicks = new Set();
  const removedWindowListeners = new Set();
  let windowSequence = 77;
  let sourceTab = { id: 1, url: 'https://storybook.test/storybook/?path=/docs/guide--docs', status: 'complete' };
  const downloadItems = new Map();
  const downloadRequests = [];
  const filesByZip = [];
  const zipArchives = [];
  const offscreenListeners = [];
  const objectUrls = new Map();
  let objectUrlSequence = 0;
  const navigationUrls = [];
  const navigationCompletionOrder = [];
  const failedIds = new Set();
  const attempts = new Map();
  const state = {};
  let tabSequence = 10;
  let downloadSequence = 1;
  let activeNavigations = 0;
  let peakNavigations = 0;
  let mainContext;
  const probeCounts = new Map();
  const captureCalls = [];
  const extractionFrames = [];
  const offlineAssetCalls = new Map();
  const offlineRequestedUrls = [];
  let offlineAssetActive = 0;
  let offlineAssetPeak = 0;
  const indexedDbRecords = new Map();
  const indexedDB = {
    open: () => {
      const request = {};
      queueMicrotask(() => {
        request.result = {
          createObjectStore: () => {}, close: () => {},
          transaction: (_storeName, _mode) => {
            const tx = { objectStore: () => ({
              put: (record) => { indexedDbRecords.set(record.key, record); const result = { result: record }; setTimeout(() => tx.oncomplete?.(), 0); return result; },
              delete: (key) => { indexedDbRecords.delete(key); setTimeout(() => tx.oncomplete?.(), 0); },
              get: (key) => { const result = {}; setTimeout(() => { result.result = indexedDbRecords.get(key); result.onsuccess?.(); tx.oncomplete?.(); }, 0); return result; },
              openCursor: () => { const cursorRequest = {}; setTimeout(() => { const records = [...indexedDbRecords.entries()]; let cursorIndex = 0; const advance = () => { const pair = records[cursorIndex]; cursorRequest.result = pair ? { value: pair[1], delete: () => indexedDbRecords.delete(pair[0]), continue: () => { cursorIndex++; setTimeout(advance, 0); } } : null; cursorRequest.onsuccess?.(); if (!pair) tx.oncomplete?.(); }; advance(); }, 0); return cursorRequest; },
            }) };
            return tx;
          },
        };
        request.onupgradeneeded?.(); request.onsuccess?.();
      });
      return request;
    },
  };
  if (realZip) {
    const offscreenContext = vm.createContext({
      chrome: { runtime: { onMessage: { addListener: (listener) => offscreenListeners.push(listener) } } },
      URL: { createObjectURL: (blob) => { const url = `blob:offline-test-${++objectUrlSequence}`; objectUrls.set(url, blob); return url; }, revokeObjectURL: (url) => objectUrls.delete(url) },
      TextEncoder, Uint8Array, Uint32Array, DataView, Blob, ArrayBuffer, Set, indexedDB,
    });
    vm.runInContext(await read('offscreen.js'), offscreenContext, { filename: 'offline-test-offscreen.js' });
  }

  const event = (listeners) => ({ addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn), emit: (...args) => [...listeners].forEach((fn) => fn(...args)) });
  const docsRoot = () => {
    const title = { textContent: currentId() };
    const heading = { tagName: 'H2', textContent: currentId(), previousElementSibling: null, parentElement: null };
    const cells = (values) => ({ querySelectorAll: () => values.map((value) => ({ textContent: value })) });
    const rows = [cells(['Name', 'Type', 'Default']), cells(['label', 'string', '—'])];
    const table = { tagName: 'TABLE', className: 'docblock-argstable', querySelectorAll: () => rows };
    let root;
    root = {
      innerText: `${currentId()} documentation text with stable rendered content`,
      textContent: `${currentId()} documentation text with stable rendered content`,
      matches: () => false,
      querySelector: (selector) => selector === 'h1, h2' ? title : null,
      querySelectorAll: (selector) => {
        if (selector === 'p') return [{ textContent: 'A rendered description.' }];
        if (selector === 'h2,h3,h4') return [heading];
        if (selector === 'table, [role="table"], [role="grid"]') return [table];
        if (selector === 'pre') return [{ innerText: 'const example = true;', textContent: 'const example = true;', classList: [] }];
        if (selector === 'blockquote, ul, ol') return [{ textContent: 'Keep labels visible.', tagName: 'UL', parentElement: null, closest: () => root }];
        if (selector === '[style], [class*="token"], [class*="swatch"]') return [{ className: 'token-swatch', id: '', getAttribute: (name) => name === 'aria-label' ? 'Primary' : null, hasAttribute: (name) => name === 'style', textContent: 'Primary' }];
        return [];
      },
    };
    return root;
  };
  function currentId() {
    const route = new URL(mainContext.location.href).searchParams.get('path') || '';
    return route.replace('/docs/', '') || 'Current';
  }
  const document = {
    title: 'Storybook Docs',
    documentElement: { getAttribute: (name) => name === 'data-theme' && currentId() === 'dark--docs' ? 'dark' : null },
    querySelector: () => docsRoot(),
  };
  const chrome = {
    runtime: {
      onMessage: event(messages),
      onStartup: event(new Set()),
      getManifest: () => structuredClone(manifest),
      sendMessage: async (message) => {
        if (message.action === 'MAKE_ZIP') {
          assert.match(message.archiveKey, /^zip:/);
          assert(JSON.stringify(message).length < 256, 'ZIP runtime message contains only the staging key');
          const { files } = indexedDbRecords.get(message.archiveKey);
          filesByZip.push(files);
          if (!realZip) return { ok: true, url: `blob:mock-${filesByZip.length}` };
          const response = await new Promise((resolve) => offscreenListeners[0](structuredClone(message), {}, resolve));
          if (response?.ok) zipArchives.push({ files, blob: objectUrls.get(response.url) });
          return response;
        }
        if (message.action === 'REVOKE_URL' && realZip) { let response; offscreenListeners[0](message, {}, (value) => { response = value; }); return response; }
        return { ok: true };
      },
      getContexts: async () => [],
      getURL: (path) => `chrome-extension://mock/${path}`,
    },
    storage: {
      session: {
        get: async (key) => ({ [key]: state[key] || { sourceTabId: 1, sourceUrl: sourceTab.url, windowId: null } }),
        set: async (value) => Object.assign(state, structuredClone(value)),
      },
      local: {
        get: async (key) => ({ [key]: state[key] }),
        set: async (value) => Object.assign(state, structuredClone(value)),
      },
    },
    tabs: {
      onUpdated: event(tabListeners),
      create: async () => { const id = tabSequence++; tabs.set(id, { id, url: 'about:blank', status: 'complete' }); return tabs.get(id); },
      get: async (id) => { if (id === 1) return sourceTab; const tab = tabs.get(id); if (!tab) throw new Error('No such tab'); return tab; },
      update: async (id, update) => {
        const tab = tabs.get(id);
        tab.url = update.url;
        navigationUrls.push(update.url);
        tab.status = 'loading';
        activeNavigations++;
        peakNavigations = Math.max(peakNavigations, activeNavigations);
        const navigationDelay = typeof delay === 'function' ? delay(update.url) : delay;
        setTimeout(() => {
          activeNavigations--;
          tab.status = 'complete';
          mainContext.location = new URL(tab.url);
          navigationCompletionOrder.push(new URL(tab.url).searchParams.get('path')?.replace('/docs/', '') || '');
          chrome.tabs.onUpdated.emit(id, { status: 'complete' }, { ...tab });
        }, navigationDelay);
        return { ...tab };
      },
      remove: async (id) => tabs.delete(id),
    },
    action: { onClicked: event(actionClicks) },
    windows: {
      onRemoved: event(removedWindowListeners),
      get: async (id) => { if (!extensionWindows.has(id)) throw new Error('No such window'); return extensionWindows.get(id); },
      update: async (id, options) => { windowFocusCalls.push({ id, ...options }); return Object.assign(extensionWindows.get(id), options); },
      create: async (options) => { const win = { id: windowSequence++, ...options }; extensionWindows.set(win.id, win); return win; },
      remove: async (id) => { extensionWindows.delete(id); chrome.windows.onRemoved.emit(id); },
    },
    scripting: {
      executeScript: async ({ target, func, args = [] }) => {
        if (func.name === 'readCachedPreviewScript') {
          const tab = tabs.get(target.tabId) || sourceTab;
          const context = vm.createContext({
            URL, AbortSignal, Uint8Array, btoa, location: new URL(tab.url),
            fetch: async (url, options) => {
              assert.equal(options.cache, 'only-if-cached');
              assert.equal(options.mode, 'same-origin');
              assert.equal(options.credentials, 'omit');
              const script = offlineFixture?.cachedScripts?.get(url);
              return script ? new Response(script, { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 504 });
            },
          });
          return [{ frameId: 0, result: await vm.runInContext(`(${func.toString()})(...${JSON.stringify(args)})`, context) }];
        }
        if (typeof args[0] === 'string' && args[0].startsWith('http')) return [{ frameId: 0, result: await func(...args) }];
        if (func.name === 'captureOfflinePage') {
          const id = args[0];
          captureCalls.push({ id, target });
          if (offlineFixture?.capture) return offlineFixture.capture({ func, args, target, attempt: captureCalls.length });
          const tab = target.tabId === 1 ? sourceTab : tabs.get(target.tabId);
          const managerUrl = tab?.url || mainContext.location.href;
          const frameUrl = managerUrl;
          mainContext.location = new URL(frameUrl);
          const html = offlineFixture?.html ? offlineFixture.html(id) : `<!doctype html><html><head><meta charset="utf-8"></head><body><main class="sbdocs-wrapper"><h1>${id}</h1><p>Rendered fixture Docs content for ${id}.</p></main></body></html>`;
          return [{ frameId: target.frameIds?.[0] ?? 0, result: { id, title: id, url: frameUrl, html, frameUrl, frameTitle: 'Storybook Docs', rootSelector: args[2], performanceResources: [], scriptUrls: offlineFixture?.scriptUrls || [] } }];
        }
        const tab = tabs.get(target.tabId);
        if (tab?.url && tab.url !== 'about:blank') mainContext.location = new URL(tab.url);
        if (typeof args[0] === 'string') {
          const id = args[0];
          attempts.set(id, (attempts.get(id) || 0) + 1);
          if (failedIds.has(id)) throw new Error('Synthetic frame access failure.');
          const story = args[1] === 'story';
          const direct = args[2] === true;
          const frames = readinessFrames || (direct
            ? [{ frameId: 0, routeType: 'iframe', root: true, rootSelector: story ? '#storybook-root' : '#storybook-docs', text: story ? '' : undefined }]
            : story
            ? [{ frameId: 0, routeType: 'main', root: true }, { frameId: 3, routeType: 'iframe', root: true, rootSelector: '#storybook-root', text: '' }]
            : [{ frameId: 0, routeType: 'main', root: true, text: `${id} documentation text with stable rendered content` }]);
          return frames.filter((frame) => target.allFrames || target.frameIds.includes(frame.frameId)).map((frame) => {
            const frameId = frame.frameId;
            const sampleKey = `${id}:${frameId}`;
            const count = probeCounts.get(sampleKey) || 0;
            probeCounts.set(sampleKey, count + 1);
            const resolvedId = frame.id === '$expected' || !frame.id ? id : frame.id;
            const url = direct && frame.routeType === 'iframe' && resolvedId === id
              ? tab.url
              : frame.routeType === 'iframe'
              ? `https://storybook.test/storybook/iframe.html?id=${encodeURIComponent(resolvedId)}&viewMode=${story ? 'story' : 'docs'}`
              : `https://storybook.test/storybook/?path=/${story ? 'story' : 'docs'}/${encodeURIComponent(resolvedId)}`;
            const samples = frame.textSamples || [];
            const value = samples[Math.min(count, Math.max(samples.length - 1, 0))] ?? frame.text ?? `${id} documentation text with stable rendered content`;
            const root = frame.root ? {
              childElementCount: 1, innerHTML: story ? '<svg></svg>' : value,
              innerText: value,
              textContent: value,
              matches: (selector) => selector === '[aria-busy="true"]' && Boolean(frame.rootBusy),
              querySelector: (selector) => frame.busySelectors?.includes(selector) ? {} : null,
            } : null;
            const frameContext = vm.createContext({
              URLSearchParams,
              location: new URL(url),
              document: { title: 'Storybook Docs', querySelector: (selector) => frame.root && selector === (frame.rootSelector || '.sbdocs-wrapper') ? root : null },
            });
            const result = vm.runInContext(`(${func.toString()})(...${JSON.stringify(args)})`, frameContext);
            return { frameId, documentId: frame.documentId, result };
          });
        }
        const frameId = target.frameIds?.[0];
        extractionFrames.push(frameId ?? 0);
        const frame = readinessFrames?.find((candidate) => candidate.frameId === frameId) || null;
        if (frame) {
          const resolvedId = frame.id === '$expected' || !frame.id ? currentId() : frame.id;
          mainContext.location = new URL(frame.routeType === 'iframe'
            ? `https://storybook.test/storybook/iframe.html?id=${encodeURIComponent(resolvedId)}&viewMode=docs`
            : `https://storybook.test/storybook/?path=/docs/${encodeURIComponent(resolvedId)}`);
        }
        return [{ frameId: frameId ?? 0, result: func(args[0]) }];
      },
    },
    offscreen: { createDocument: async () => {}, closeDocument: async () => {} },
    downloads: {
      onChanged: event(downloadListeners),
      download: async (options) => {
        downloadRequests.push(options);
        const { url } = options;
        const id = downloadSequence++;
        downloadItems.set(id, { id, url, state: 'in_progress' });
        setTimeout(() => {
          const item = downloadItems.get(id);
          item.state = 'complete';
          chrome.downloads.onChanged.emit({ id, state: { current: 'complete' } });
        }, 5);
        return id;
      },
      search: async ({ url }) => [...downloadItems.values()].filter((item) => item.url === url),
      cancel: async (id) => {
        const item = downloadItems.get(id);
        if (item) { item.state = 'interrupted'; chrome.downloads.onChanged.emit({ id, state: { current: 'interrupted' } }); }
      },
    },
  };
  const context = vm.createContext({
    chrome, URL, URLSearchParams, TextEncoder, TextDecoder, Uint8Array, Uint32Array, DataView, Blob, structuredClone, AbortController, Response, atob,
    setTimeout, clearTimeout, console, document,
    getComputedStyle: (element) => ({
      length: element === document.documentElement ? 1 : 0,
      item: () => '--color-primary',
      getPropertyValue: () => currentId() === 'form--docs' ? '#654321' : '#123456',
      colorScheme: 'light',
      color: '#222222', backgroundColor: 'rgb(255, 255, 255)', fontFamily: 'Arial', fontSize: '16px', borderRadius: '0px',
    }),
    indexedDB, crypto: webcrypto,
    fetch: async (input, options = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url || input.href);
      if (!/(?:^|\/)(?:index|stories)\.json$/.test(url.pathname)) offlineRequestedUrls.push(url.href);
      const resource = offlineFixture?.assets?.get(url.pathname);
      if (resource) {
        offlineAssetCalls.set(url.pathname, (offlineAssetCalls.get(url.pathname) || 0) + 1);
        offlineAssetActive++; offlineAssetPeak = Math.max(offlineAssetPeak, offlineAssetActive);
        try {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, resource.delay || 12);
            const abort = () => { clearTimeout(timer); reject(options.signal.reason || new Error('Request aborted.')); };
            if (options.signal?.aborted) abort(); else options.signal?.addEventListener('abort', abort, { once: true });
          });
        } finally { offlineAssetActive--; }
        return new Response(resource.body instanceof Uint8Array ? resource.body : new TextEncoder().encode(resource.body), { status: resource.status || 200, headers: { 'Content-Type': resource.mime } });
      }
      return { ok: true, json: async () => ({ entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])) }) };
    },
    importScripts: (...files) => { if (files.includes('offline-static.js')) vm.runInContext(offlineModuleSource, mainContext, { filename: 'offline-static.js' }); },
  });
  mainContext = context;
  context.location = new URL('https://storybook.test/?path=/docs/current');
  const background = (await read('background.js')).replace("importScripts('extractor.js');", '').replace('const READINESS_TIMEOUT_MS = 16000;', 'const READINESS_TIMEOUT_MS = 80;').replace('const READINESS_POLL_MS = 250;', 'const READINESS_POLL_MS = 2;').replace(".then(sendResponse).catch((error) => sendResponse({ ok: false, error: errorText(error) }));", ".then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.stack || error.message }));");
  const source = `${await read('extractor.js')}\n${background}`;
  vm.runInContext(source, context, { filename: 'background.js' });

  async function send(message) {
    const listener = messages.values().next().value;
    return new Promise((resolve) => listener(message, {}, resolve));
  }
  async function waitFor(predicate, timeout = 5000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const result = await send({ action: 'GET_JOB' });
      if (predicate(result.job)) return result.job;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error(`Timed out waiting for export state. Last state: ${state.storybookExportJob?.state}`);
  }
  async function waitOfflineFor(predicate, timeout = 5000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const response = await send({ action: 'GET_OFFLINE_JOB' });
      if (predicate(response.job)) return response.job;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error(`Timed out waiting for Offline Static state. Last state: ${state.storybookOfflineExportJob?.state}`);
  }
  return { send, waitFor, waitOfflineFor, state, tabs, extensionWindows, windowFocusCalls, actionClicks, clickAction: (tab) => [...actionClicks][0](tab), closeWindow: (id) => chrome.windows.remove(id), setSourceTab: (tab) => { sourceTab = tab; }, getSourceTab: () => sourceTab, filesByZip, zipArchives, downloadRequests, navigationUrls, navigationCompletionOrder, failedIds, attempts, captureCalls, extractionFrames, offlineAssetCalls, offlineRequestedUrls, get indexedDbRecordCount() { return [...indexedDbRecords.values()].filter((record) => record.kind !== 'page-snapshot' && record.key !== 'zip:offline-completed').length; }, get cachedPageCount() { return [...indexedDbRecords.values()].filter((record) => record.kind === 'page-snapshot').length; }, get offlineAssetPeak() { return offlineAssetPeak; }, get peakNavigations() { return peakNavigations; } };
}

function defaultEntries() {
  return [
    { id: 'guide--docs', type: 'docs', title: 'Guides/Overview', name: 'Overview', tags: [] },
    { id: 'button--docs', type: 'docs', title: 'Components/Button', name: 'Button', tags: ['components'] },
    { id: 'form--docs', type: 'docs', title: 'Forms/Control', name: 'Control', tags: [] },
    { id: 'undesignated--docs', type: 'docs', name: 'No category', tags: [] },
    { id: 'dark--docs', type: 'docs', title: 'Components/Dark', name: 'Dark', tags: ['components'] },
  ];
}

const harness = await makeHarness({ delay: 3 });
const sourceUrl = 'https://storybook.test/storybook/?path=/docs/guide--docs';
const options = { props: true, tokens: true, examples: true };

await harness.clickAction({ id: 1, url: sourceUrl });
assert.equal(harness.extensionWindows.size, 1, 'toolbar action opens one extension window');
await harness.clickAction({ id: 1, url: sourceUrl });
assert.equal(harness.extensionWindows.size, 1, 'second toolbar click reuses the existing extension window');
assert.equal(harness.windowFocusCalls.at(-1).focused, true, 'second toolbar click focuses the existing window');
await harness.clickAction({ id: 88, url: 'chrome-extension://mock/popup.html' });
assert.equal((await harness.send({ action: 'GET_SOURCE_TAB' })).tabId, 1, 'toolbar clicks from the extension window preserve the Storybook source context');
await harness.closeWindow(77);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(harness.extensionWindows.size, 0, 'native window close removes only the extension window');
assert.equal(harness.state.storybookToolWindowContext.windowId, null, 'native close invalidates the saved extension-window ID');
assert.equal(harness.getSourceTab().id, 1, 'closing the extension window leaves the originating Storybook tab open');
await harness.clickAction({ id: 1, url: sourceUrl });
assert.equal(harness.extensionWindows.size, 1, 'toolbar action recovers after native window closure');
assert(harness.extensionWindows.has(78), 'reopening creates a fresh concrete tool window');
assert.equal((await harness.send({ action: 'GET_SOURCE_TAB' })).tabId, 1, 'source tab is the toolbar click origin');
await harness.setSourceTab({ id: 1, url: 'https://storybook.test/storybook/?path=/docs/other--docs', status: 'complete' });
assert.match((await harness.send({ action: 'GET_SOURCE_TAB' })).error, /navigated/i, 'navigated source tab is rejected');
await harness.setSourceTab({ id: 1, url: sourceUrl, status: 'complete' });
await harness.clickAction({ id: 1, url: sourceUrl });
await harness.setSourceTab({ id: 1, url: 'https://example.test/', status: 'complete' });
await harness.clickAction({ id: 1, url: 'https://example.test/' });
assert.match((await harness.send({ action: 'EXPORT_CURRENT', options })).error, /not on a Storybook Docs page/i, 'non-Storybook toolbar source is rejected for Current Docs');
await harness.setSourceTab(null);
assert.match((await harness.send({ action: 'GET_SOURCE_TAB' })).error, /source tab/i, 'closed source tab produces a recoverable error');
await harness.setSourceTab({ id: 1, url: sourceUrl, status: 'complete' });
await harness.clickAction({ id: 1, url: sourceUrl });

const closingHarness = await makeHarness({ delay: 100 });
await closingHarness.clickAction({ id: 1, url: sourceUrl });
await closingHarness.send({ action: 'START_ALL', options });
await closingHarness.closeWindow(77);
assert(closingHarness.state.storybookExportJob, 'crawler checkpoint remains persisted after tool window close');
assert.notEqual(closingHarness.state.storybookExportJob.state, 'cancelled', 'closing the tool window does not cancel the crawler');
await closingHarness.clickAction({ id: 1, url: sourceUrl });
assert.equal(closingHarness.extensionWindows.size, 1, 'window can reopen while crawler state remains available');

const current = await harness.send({ action: 'EXPORT_CURRENT', tabId: 999, tabUrl: 'https://unrelated.test/', options });
assert(current.ok, current.error);
assert.match(current.filename, /\.md$/);
assert.match(current.filename, /storybook\.test/, 'Current Docs uses the toolbar action source rather than caller-provided tab data');
assert.match(current.preview, /Storybook Design System/);
assert.equal(harness.downloadRequests.length, 1, 'Current Docs creates exactly one download');
assert.equal(harness.downloadRequests[0].saveAs, true);
assert.match(decodeURIComponent(harness.downloadRequests[0].url.split(',').slice(1).join(',')), /^# Storybook Design System/);

const start = await harness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
assert(start.ok);
assert.equal(start.job.concurrency, 1, 'All Docs defaults to one tab');
assert.equal((await harness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options })).duplicate, true);
let completed = await harness.waitFor((job) => job.state === 'completed');
assert.equal(completed.total, 5);
assert.equal(completed.succeeded, 5);
assert.equal(harness.tabs.size, 0, 'temporary tabs are closed after export');
assert.equal(harness.downloadRequests.length, 2, 'Current Docs and All Docs each trigger one download');
assert.match(harness.downloadRequests.at(-1).filename, /\.zip$/);
let archiveFiles = harness.filesByZip.at(-1);
for (const file of ['README.md', 'INDEX.md', 'manifest.json', 'EXTRACTION_REPORT.md', 'guides/', 'components/', 'form/', 'tokens/', 'tokens/design-tokens.md']) assert(archiveFiles.some((entry) => entry.path === file), `${file} exists in archive`);
assert(!archiveFiles.some((entry) => entry.path.startsWith('unclassified/')), 'unknown category has no unclassified destination');
assert(archiveFiles.some((entry) => entry.path.startsWith('guides/')));
assert(archiveFiles.some((entry) => entry.path.startsWith('components/')));
assert(archiveFiles.some((entry) => entry.path.startsWith('form/')));
const pageFiles = archiveFiles.filter((entry) => /^(guides|components|form)\/.+\.md$/.test(entry.path));
assert.equal(pageFiles.length, 5, 'one Markdown document exists for each Docs entry');
assert(pageFiles.every((entry) => entry.content.startsWith('# ') && entry.content.includes('Storybook ID:')));
const archiveManifest = JSON.parse(archiveFiles.find((entry) => entry.path === 'manifest.json').content);
assert.equal(archiveManifest.exporterVersion, manifest.version, 'All Docs archive records the current extension version');
assert.deepEqual(archiveManifest.entries.map((entry) => entry.id), defaultEntries().map((entry) => entry.id));
assert.equal(new Set(archiveManifest.entries.map((entry) => entry.path)).size, archiveManifest.entries.length);
assert(archiveManifest.entries.every((entry) => !entry.path.split('/').includes('..')));
assert(archiveManifest.entries.every((entry) => entry.readiness?.entryId === entry.id && entry.readiness.stabilizationSamples.length === 3));
assert.deepEqual(archiveManifest.categoryFolders, ['guides', 'components', 'form']);
const fallbackEntry = archiveManifest.entries.find((entry) => entry.id === 'undesignated--docs');
assert.equal(fallbackEntry.category, 'components');
assert(fallbackEntry.path.startsWith('components/'));
assert.equal(fallbackEntry.categoryConfidence, 'low');
assert.match(fallbackEntry.categoryEvidence, /No recognized category metadata/);
assert.equal(fallbackEntry.categorySource, 'fallback');
assert.equal(archiveManifest.unknownCategoryFallback.folder, 'components');
const tokenRows = archiveManifest.tokenObservations.filter((token) => token.identity === 'css-custom-property:--color-primary');
assert.equal(tokenRows.length, 3, 'same token identity remains separate by theme context and observed value');
assert.equal(tokenRows.find((token) => token.context.theme === 'unknown' && token.value === '#123456').sources.length, 3);
assert(tokenRows.find((token) => token.context.theme === 'unknown' && token.value === '#123456').conflict);
assert(!tokenRows.find((token) => token.context.theme === 'dark').conflict, 'different themes are not treated as value conflicts');
const computedRows = archiveManifest.tokenObservations.filter((token) => token.identity === 'computed-style:token-swatch:Primary');
assert.equal(computedRows.length, 2, 'computed observations deduplicate within context but remain separate across themes');
assert.equal(computedRows.find((token) => token.context.theme === 'unknown').sources.length, 4);
assert(archiveFiles.some((entry) => entry.content.includes('Props and variants')));
assert(harness.state.storybookExportJob.entries.every((entry) => !Object.hasOwn(entry, 'page')), 'successful export deletes extracted page checkpoints');

const figmaCssText = '/* Panel */\nwidth: calc(100% - 16px);\n/* Auto layout */\nbackground: linear-gradient(90deg, #fff, rgba(0,0,0,.1));';
const figmaArchive = buildFigmaCssArchive(parseFigmaCss(figmaCssText), figmaCssText, 'Local design');
const navigationCountBeforeFigma = harness.navigationUrls.length;
const figmaResult = await harness.send({ action: 'EXPORT_FIGMA_CSS', files: figmaArchive.files, filename: figmaArchive.filename });
assert(figmaResult.ok, figmaResult.error);
assert.equal(figmaResult.filename, 'figma-css-local-design.zip');
assert.equal(harness.downloadRequests.length, 3, 'Figma CSS import creates one independent ZIP download');
assert.equal(harness.downloadRequests.at(-1).filename, 'figma-css-local-design.zip');
assert.equal(harness.navigationUrls.length, navigationCountBeforeFigma, 'Figma CSS import does not navigate Storybook tabs');
assert(harness.filesByZip.at(-1).some((file) => file.path === 'source/original.css'));
assert.equal(harness.state.storybookExportJob.state, 'completed', 'Figma CSS import does not alter Storybook crawl state');
const unsafeFigmaExport = await harness.send({ action: 'EXPORT_FIGMA_CSS', files: [...figmaArchive.files, { path: '../outside.md', content: 'unsafe' }], filename: figmaArchive.filename });
assert.equal(unsafeFigmaExport.ok, false, 'background rejects unsafe archive paths before packaging');
assert.equal(harness.downloadRequests.length, 3, 'rejected Figma archive does not create a download');

const docsEntry = [{ id: 'guides-getting-started--docs', type: 'docs', title: 'Guides/Getting Started', name: 'Getting Started', tags: ['guide'] }];
const manifestFor = (files) => JSON.parse(files.find((file) => file.path === 'manifest.json').content);
const onePageArchive = (testHarness) => testHarness.filesByZip.at(-1);

// Docs rendered in the top-level manager route.
const mainFrameHarness = await makeHarness({ entries: docsEntry, readinessFrames: [
  { frameId: 0, routeType: 'main', id: '$expected', root: true, text: 'Getting Started guide main-frame content.' },
] });
await mainFrameHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
completed = await mainFrameHarness.waitFor((job) => job.state === 'completed');
assert(mainFrameHarness.navigationUrls.includes('https://storybook.test/storybook/?path=/docs/guides-getting-started--docs'));
assert.equal(completed.succeeded, 1);
let docsManifestEntry = manifestFor(onePageArchive(mainFrameHarness)).entries[0];
assert.equal(docsManifestEntry.readiness.frameId, 0);
assert.equal(docsManifestEntry.readiness.rootSelector, '.sbdocs-wrapper');
assert.equal(docsManifestEntry.readiness.textLength, 'Getting Started guide main-frame content.'.length);
assert.equal(docsManifestEntry.readiness.stabilizationSamples.length, 3);
assert.equal(docsManifestEntry.readiness.entryId, 'guides-getting-started--docs');
assert.match(onePageArchive(mainFrameHarness).find((file) => file.path === docsManifestEntry.path).content, /Storybook ID: `guides-getting-started--docs`/);

// The manager frame has the Docs path, while the actual Docs root is in Storybook's iframe route.
const iframeHarness = await makeHarness({ entries: docsEntry, readinessFrames: [
  { frameId: 0, routeType: 'main', id: '$expected', root: false },
  { frameId: 31, routeType: 'iframe', id: '$expected', root: true, text: 'Getting Started guide iframe content.' },
] });
await iframeHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
completed = await iframeHarness.waitFor((job) => job.state === 'completed');
assert.equal(completed.succeeded, 1);
docsManifestEntry = manifestFor(onePageArchive(iframeHarness)).entries[0];
assert.equal(docsManifestEntry.readiness.frameId, 31);
assert.equal(docsManifestEntry.readiness.entryId, docsEntry[0].id);
assert.deepEqual(iframeHarness.extractionFrames, [31], 'extract only the frame that passed matching-ID readiness');
assert.match(docsManifestEntry.sourceUrl, /iframe\.html\?id=guides-getting-started--docs&viewMode=docs/);

// Delayed Docs rendering must yield three stable, non-placeholder text samples.
const delayedHarness = await makeHarness({ entries: docsEntry, readinessFrames: [
  { frameId: 0, routeType: 'main', id: '$expected', root: true, textSamples: ['Loading Docs…', 'Initial Docs skeleton text.', 'Getting Started delayed Docs content.', 'Getting Started delayed Docs content.', 'Getting Started delayed Docs content.'] },
] });
await delayedHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
completed = await delayedHarness.waitFor((job) => job.state === 'completed');
assert.equal(completed.succeeded, 1);
docsManifestEntry = manifestFor(onePageArchive(delayedHarness)).entries[0];
assert.equal(docsManifestEntry.readiness.stabilizationSamples.length, 3);
assert(docsManifestEntry.readiness.stabilizationSamples.every((sample) => sample.textLength === 'Getting Started delayed Docs content.'.length));
assert((delayedHarness.attempts.get(docsEntry[0].id) || 0) >= 5, 'readiness waited through delayed and changing text before three stable probes');

// A persistent busy marker is recorded but does not veto stable, substantive, ID-matched Docs text.
const persistentBusyHarness = await makeHarness({ entries: docsEntry, readinessFrames: [
  { frameId: 0, routeType: 'main', id: '$expected', root: true, rootBusy: true, busySelectors: ['.sb-preparing-story', '[data-testid*="loading"]'], text: 'Getting Started content is fully visible.' },
] });
await persistentBusyHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
completed = await persistentBusyHarness.waitFor((job) => job.state === 'completed');
assert.equal(completed.succeeded, 1);
docsManifestEntry = manifestFor(onePageArchive(persistentBusyHarness)).entries[0];
assert.deepEqual(docsManifestEntry.readiness.busySelectors, ['[aria-busy="true"] (root)', '.sb-preparing-story', '[data-testid*="loading"]']);

// A matching manager URL cannot make a different iframe's Docs content acceptable.
const incorrectIdHarness = await makeHarness({ entries: docsEntry, readinessFrames: [
  { frameId: 0, routeType: 'main', id: '$expected', root: false },
  { frameId: 9, routeType: 'iframe', id: 'unrelated-story--docs', root: true, text: 'Unrelated Story Docs content.' },
] });
await incorrectIdHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
completed = await incorrectIdHarness.waitFor((job) => job.state === 'completed');
assert.equal(completed.failed, 1);
assert.match(completed.entries[0].error, /expected ID: guides-getting-started--docs/);
assert.match(completed.entries[0].error, /frame 9: id=unrelated-story--docs/);
assert.deepEqual(incorrectIdHarness.extractionFrames, [], 'unrelated Docs content is never extracted');

const longStoryId = `long-${'a'.repeat(180)}--docs`;
const filenameEntries = [
  { id: 'guides-getting-started--docs', type: 'docs', title: 'Guides/Getting Started', name: 'Docs', tags: ['guides'] },
  { id: 'components-button--docs', type: 'docs', title: 'Components/Button', name: 'Docs', tags: ['components'] },
  { id: 'components-checkbox--docs', type: 'docs', title: 'Components/Checkbox', name: 'Docs', tags: ['components'] },
  { id: 'forms-input--docs', type: 'docs', title: 'Forms/Input', name: 'Docs', tags: ['forms'] },
  { id: 'unmapped-sample--docs', type: 'docs', title: 'Samples/Unknown', name: 'Docs', tags: [] },
  { id: 'components-shared-alpha--docs', type: 'docs', title: 'Components/Shared', name: 'Docs', tags: ['components'] },
  { id: 'components-shared-beta--docs', type: 'docs', title: 'Components/Shared', name: 'Docs', tags: ['components'] },
  { id: 'collision/a--docs', type: 'docs', title: 'Components/Collision', name: 'Docs', tags: ['components'] },
  { id: 'collision\\a--docs', type: 'docs', title: 'Components/Collision', name: 'Docs', tags: ['components'] },
  { id: 'Ｆｏｏ--Ｄｏｃｓ', type: 'docs', title: 'Components/Foo', name: 'Docs', tags: ['components'] },
  { id: '../../evil--docs', type: 'docs', title: 'Components/Evil', name: 'Docs', tags: ['components'] },
  { id: 'CON', type: 'docs', title: 'Forms/Reserved', name: 'Docs', tags: ['forms'] },
  { id: 'CON.txt', type: 'docs', title: 'Forms/Reserved with extension', name: 'Docs', tags: ['forms'] },
  { id: 'PRN', type: 'docs', title: 'Forms/Reserved PRN', name: 'Docs', tags: ['forms'] },
  { id: 'AUX', type: 'docs', title: 'Forms/Reserved AUX', name: 'Docs', tags: ['forms'] },
  { id: 'NUL', type: 'docs', title: 'Forms/Reserved NUL', name: 'Docs', tags: ['forms'] },
  { id: 'COM1', type: 'docs', title: 'Forms/Reserved COM1', name: 'Docs', tags: ['forms'] },
  { id: 'LPT9', type: 'docs', title: 'Forms/Reserved LPT9', name: 'Docs', tags: ['forms'] },
  { id: longStoryId, type: 'docs', title: 'Components/Long', name: 'Docs', tags: ['components'] },
];
async function exportFilenameFixture(entries, concurrency = 1, delay = 3) {
  const testHarness = await makeHarness({ entries, delay });
  await testHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency });
  const result = await testHarness.waitFor((job) => job.state === 'completed');
  assert.equal(result.failed, 0);
  return { harness: testHarness, files: onePageArchive(testHarness), manifest: manifestFor(onePageArchive(testHarness)) };
}
const filenameExport = await exportFilenameFixture(filenameEntries);
const filenameManifestEntries = filenameExport.manifest.entries;
const pathForId = (id) => filenameManifestEntries.find((entry) => entry.id === id).path;
const expectedFilenamePaths = {
  'guides-getting-started--docs': 'guides/guides-getting-started--docs.md',
  'components-button--docs': 'components/components-button--docs.md',
  'components-checkbox--docs': 'components/components-checkbox--docs.md',
  'forms-input--docs': 'form/forms-input--docs.md',
  'unmapped-sample--docs': 'components/unmapped-sample--docs.md',
  'components-shared-alpha--docs': 'components/components-shared-alpha--docs.md',
  'components-shared-beta--docs': 'components/components-shared-beta--docs.md',
  'collision/a--docs': 'components/collision-a--docs--ccc2ebc2.md',
  'collision\\a--docs': 'components/collision-a--docs--ead3ba31.md',
  'Ｆｏｏ--Ｄｏｃｓ': 'components/foo--docs.md',
  '../../evil--docs': 'components/evil--docs.md',
  CON: 'form/_con.md',
  'CON.txt': 'form/_con.txt.md',
  PRN: 'form/_prn.md',
  AUX: 'form/_aux.md',
  NUL: 'form/_nul.md',
  COM1: 'form/_com1.md',
  LPT9: 'form/_lpt9.md',
};
for (const [id, expectedPath] of Object.entries(expectedFilenamePaths)) assert.equal(pathForId(id), expectedPath, `exact archive path for ${id}`);
assert.equal(filenameManifestEntries.find((entry) => entry.id === 'components-button--docs').name, 'Docs');
assert.equal(filenameManifestEntries.find((entry) => entry.id === 'components-button--docs').title, 'Components/Button');
assert.equal(filenameManifestEntries.find((entry) => entry.id === 'unmapped-sample--docs').category, 'components');
assert.equal(filenameManifestEntries.find((entry) => entry.id === longStoryId).path, `components/${`long-${'a'.repeat(113)}--docs`}.md`);
assert([...pathForId(longStoryId).split('/').at(-1)].length <= 128);
assert(filenameExport.files.filter((file) => /^(guides|components|form)\/[^/]+\.md$/.test(file.path)).every((file) => !file.path.includes('..')));
assert.equal(new Set(filenameExport.files.map((file) => file.path)).size, filenameExport.files.length, 'archive member paths never overwrite one another');
assert.equal(filenameExport.files.filter((file) => file.path === pathForId('collision/a--docs') || file.path === pathForId('collision\\a--docs')).length, 2);

const members = new Set(filenameExport.files.map((file) => file.path));
for (const entry of filenameManifestEntries.filter((item) => item.status === 'succeeded')) assert(members.has(entry.path), `manifest page path exists: ${entry.path}`);
const linkPattern = /\]\(([^)]+)\)/g;
for (const file of filenameExport.files.filter((item) => item.path.endsWith('.md'))) {
  for (const [, target] of file.content.matchAll(linkPattern)) {
    if (/^https?:\/\//i.test(target)) continue;
    const targetPath = decodeURIComponent(new URL(target, `https://archive.invalid/${file.path}`).pathname.slice(1));
    assert(members.has(targetPath), `${file.path} internal link resolves to archive member ${targetPath}`);
  }
}
const indexText = filenameExport.files.find((file) => file.path === 'INDEX.md').content;
for (const expectedPath of Object.values(expectedFilenamePaths)) assert(indexText.includes(`](${expectedPath})`), `INDEX.md links to ${expectedPath}`);
const tokenManifest = filenameExport.manifest.tokenObservations;
assert(tokenManifest.every((token) => token.sources.every((source) => members.has(source.path))));
const tokenMarkdown = filenameExport.files.find((file) => file.path === 'tokens/design-tokens.md').content;
assert.match(tokenMarkdown, /\]\(..\/components\/components-button--docs\.md\)/, 'token provenance uses a relative link to the generated page path');
const reportMarkdown = filenameExport.files.find((file) => file.path === 'EXTRACTION_REPORT.md').content;
assert.match(reportMarkdown, /\]\(guides\/guides-getting-started--docs\.md\)/, 'extraction report links to successful page paths');

const reorderedEntries = [...filenameEntries].reverse();
const delayedExport = await exportFilenameFixture(reorderedEntries, 3, (url) => {
  const id = new URL(url).searchParams.get('path')?.replace('/docs/', '');
  return id === longStoryId ? 35 : 1;
});
const expectedCompletionOrder = reorderedEntries.map((entry) => entry.id);
assert.notDeepEqual(delayedExport.harness.navigationCompletionOrder, expectedCompletionOrder, 'fixture completed pages in a different order than index order');
const sortedPathMap = (manifest) => manifest.entries.map(({ id, path }) => [id, path]).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
assert.deepEqual(sortedPathMap(delayedExport.manifest), sortedPathMap(filenameExport.manifest), 'filenames do not depend on index order, concurrency, or completion order');
assert.deepEqual(Array.from(delayedExport.files, (file) => file.path), Array.from(filenameExport.files, (file) => file.path), 'repeated exports emit identical archive member paths');

// Resume from the saved state after popup-equivalent reconnection.
assert.equal((await harness.send({ action: 'GET_JOB' })).job.state, 'completed');

// Force a page failure, verify it is retained, then retry it and inspect attempt history.
const retryHarness = await makeHarness({ delay: 3 });
retryHarness.failedIds.add('button--docs');
await retryHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 1 });
completed = await retryHarness.waitFor((job) => job.state === 'completed');
assert.equal(completed.failed, 1);
assert.match(retryHarness.filesByZip.at(-1).find((entry) => entry.path === 'EXTRACTION_REPORT.md').content, /button--docs.*failed/);
retryHarness.failedIds.delete('button--docs');
await retryHarness.send({ action: 'RETRY_ENTRY', id: 'button--docs' });
completed = await retryHarness.waitFor((job) => job.state === 'completed' && job.failed === 0 && job.entries.find((entry) => entry.id === 'button--docs')?.attempts === 2);
assert.deepEqual(Array.from(completed.entries.find((entry) => entry.id === 'button--docs').history, (attempt) => attempt.status), ['failed', 'succeeded']);
const retriedManifest = JSON.parse(retryHarness.filesByZip.at(-1).find((entry) => entry.path === 'manifest.json').content);
assert.deepEqual(retriedManifest.entries.find((entry) => entry.id === 'button--docs').history.map((attempt) => attempt.status), ['failed', 'succeeded']);
assert.match(retryHarness.filesByZip.at(-1).find((entry) => entry.path === 'EXTRACTION_REPORT.md').content, /attempts: #1 failed.*#2 succeeded/);
assert.equal(retryHarness.filesByZip.at(-1).filter((entry) => /^(guides|components|form)\/.+\.md$/.test(entry.path)).length, 5, 'page retry rebuilds the complete archive after checkpoint deletion');
assert(retryHarness.state.storybookExportJob.entries.every((entry) => !Object.hasOwn(entry, 'page')));

const retryAllHarness = await makeHarness({ delay: 3 });
retryAllHarness.failedIds.add('button--docs');
await retryAllHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options });
await retryAllHarness.waitFor((job) => job.state === 'completed' && job.failed === 1);
retryAllHarness.failedIds.delete('button--docs');
await retryAllHarness.send({ action: 'RESUME' });
completed = await retryAllHarness.waitFor((job) => job.state === 'completed' && job.failed === 0);
assert.equal(retryAllHarness.filesByZip.at(-1).filter((entry) => /^(guides|components|form)\/.+\.md$/.test(entry.path)).length, 5, 'retry-all rebuilds every page after checkpoint deletion');
assert(retryAllHarness.state.storybookExportJob.entries.every((entry) => !Object.hasOwn(entry, 'page')));

// Pause settles active work and closes tabs; Resume continues saved entries.
const pauseHarness = await makeHarness({ delay: 35 });
await pauseHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 1 });
await pauseHarness.waitFor((job) => job.state === 'crawling' && job.entries.some((entry) => entry.status === 'running'));
await pauseHarness.send({ action: 'PAUSE' });
const paused = await pauseHarness.waitFor((job) => job.state === 'paused');
assert(paused.processed >= 1);
assert.equal(pauseHarness.tabs.size, 0, 'temporary tabs close when pause takes effect');
await pauseHarness.send({ action: 'RESUME' });
await pauseHarness.waitFor((job) => job.state === 'completed');

// Cancel is terminal only after active page work and temporary-tab cleanup.
const cancelHarness = await makeHarness({ delay: 35 });
await cancelHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 1 });
await cancelHarness.waitFor((job) => job.state === 'crawling' && job.entries.some((entry) => entry.status === 'running'));
await cancelHarness.send({ action: 'CANCEL' });
const cancelled = await cancelHarness.waitFor((job) => job.state === 'cancelled');
assert.equal(cancelled.completedAt, undefined);
assert.equal(cancelHarness.tabs.size, 0);

// Compare bounded scheduler width with deterministic active-navigation counts.
const serialHarness = await makeHarness({ delay: 8 });
await serialHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 1 });
await serialHarness.waitFor((job) => job.state === 'completed');
assert.equal(serialHarness.peakNavigations, 1);
const boundedHarness = await makeHarness({ delay: 8 });
await boundedHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 2 });
await boundedHarness.waitFor((job) => job.state === 'completed');
assert.equal(boundedHarness.peakNavigations, 2);
const threeHarness = await makeHarness({ delay: 8 });
await threeHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 3 });
await threeHarness.waitFor((job) => job.state === 'completed');
assert.equal(threeHarness.peakNavigations, 3);

// Exercise the user-facing Offline Static coordinator from authorization message to real ZIP Blob handoff.
const offlineNoConsentHarness = await makeHarness({ delay: 3, realZip: true });
const offlineNoConsentResponse = await offlineNoConsentHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'current', authorizationConfirmed: false });
assert.equal(offlineNoConsentResponse.ok, false, 'the background coordinator rejects Offline Static without explicit authorization confirmation');
assert.match(offlineNoConsentResponse.error, /explicitly confirm/);
assert.equal(offlineNoConsentHarness.zipArchives.length, 0);

const offlineCurrentHarness = await makeHarness({ delay: 3, realZip: true });
const offlineCurrentResponse = await offlineCurrentHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'current', authorizationConfirmed: true });
assert.equal(offlineCurrentResponse.ok, true, 'Current Docs coordinator returns a generated offline ZIP');
assert.equal(offlineCurrentResponse.job.phaseCode, 'COMPLETED');
const offlineCurrentMembers = readZip(Buffer.from(await offlineCurrentHarness.zipArchives[0].blob.arrayBuffer()));
assert(offlineCurrentMembers.some((entry) => entry.path === 'index.html'));
assert(offlineCurrentMembers.some((entry) => entry.path === 'pages/guide--docs.html'), `Current Docs archive members: ${offlineCurrentMembers.map((entry) => entry.path).join(', ')}; page results: ${JSON.stringify(offlineCurrentResponse.pages)}`);
assert.equal(offlineCurrentMembers.filter((entry) => /^pages\/.+\.html$/.test(entry.path)).length, 1, 'Current Docs ZIP contains exactly its selected page');
assert(offlineCurrentHarness.tabs.size === 0, 'Current Docs export never closes or leaves a crawler tab');

const offlineMissingRootHarness = await makeHarness({ delay: 3, realZip: true, readinessFrames: [{ frameId: 0, root: false, id: '$expected' }] });
const backgroundExportHarness = await makeHarness({ delay: 20 });
const acceptedExport = await backgroundExportHarness.send({ action: 'EXPORT_OFFLINE', scope: 'current', authorizationConfirmed: true });
assert.equal(acceptedExport.ok, true);
assert.notEqual(acceptedExport.job.state, 'completed');
const finishedExport = await backgroundExportHarness.waitOfflineFor((job) => job.state === 'completed');
assert.equal(finishedExport.id, acceptedExport.job.id);
assert.equal(finishedExport.downloadAvailable, true);

const offlineMissingRootResponse = await offlineMissingRootHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'current', authorizationConfirmed: true });
assert.equal(offlineMissingRootResponse.ok, true, 'a failed page remains reportable in a generated Current Docs archive');
assert.equal(offlineMissingRootResponse.job.pages.failed, 1);
const offlineFailedMembers = readZip(Buffer.from(await offlineMissingRootHarness.zipArchives[0].blob.arrayBuffer()));
assert(!offlineFailedMembers.some((member) => /^pages\/.+\.html$/.test(member.path)));
assert(offlineFailedMembers.some((member) => member.path === 'index.html' && new TextDecoder().decode(member.bytes).includes('failed')));
assert(offlineFailedMembers.some((member) => member.path === 'OFFLINE_REPORT.md'));
assert.equal(JSON.parse(new TextDecoder().decode(offlineFailedMembers.find((member) => member.path === 'manifest.json').bytes)).pages[0].status, 'FAILED');

const offlineAllHarness = await makeHarness({ delay: 3, realZip: true });
const offlineAllResponse = await offlineAllHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'all', authorizationConfirmed: true });
assert.equal(offlineAllResponse.ok, true, `All Docs coordinator returns a generated offline ZIP: ${offlineAllResponse.error || ''}`);
const offlineAllMembers = readZip(Buffer.from(await offlineAllHarness.zipArchives[0].blob.arrayBuffer()));
const offlineAllPaths = new Set(offlineAllMembers.map((entry) => entry.path));
assert.equal(offlineAllResponse.job.pages.selected, defaultEntries().length);
assert.equal(offlineAllResponse.job.pages.staticReady, defaultEntries().length);
assert(offlineAllPaths.has('index.html'));
assert(offlineAllPaths.has('pages/guide--docs.html'));
assert(offlineAllPaths.has('ASSET_MANIFEST.json'));
assert(offlineAllPaths.has('OFFLINE_REPORT.md'));
assert.equal([...offlineAllPaths].filter((name) => /^pages\/.+\.html$/.test(name)).length, defaultEntries().length);
assert.equal(offlineAllHarness.tabs.size, 0, 'All Docs coordinator removes only its owned crawler tab');

const catalogEntries = [
  { id: 'components-dialog--docs', type: 'docs', title: 'Components/Dialog', name: 'Docs' },
  { id: 'components-dialog--default', type: 'story', title: 'Components/Dialog', name: 'Default' },
  { id: 'components-dialog--no-close-button', type: 'story', title: 'Components/Dialog', name: 'No Close Button' },
];
const catalogHarness = await makeHarness({
  entries: catalogEntries, realZip: true, offlineFixture: {
    assets: new Map([
      ['/large-a.png', { mime: 'image/png', body: new Uint8Array(3 * 1024 * 1024).fill(137) }],
      ['/large-b.png', { mime: 'image/png', body: new Uint8Array(3 * 1024 * 1024).fill(200) }],
    ]),
    html: (id) => `<!doctype html><html><head><script src="/missing-runtime.js"></script></head><body><div id="storybook-root"><svg></svg><img src="/large-a.png"><img src="/large-b.png"><a href="/storybook/?path=/story/components-dialog--no-close-button#example">Example</a></div><h1>${id}</h1></body></html>`,
  },
});
catalogHarness.setSourceTab({ id: 1, url: 'https://storybook.test/storybook/?path=/story/components-dialog--default&args=variant:other', status: 'complete' });
assert.equal((await catalogHarness.send({ action: 'DOWNLOAD_OFFLINE', jobId: 'unfinished' })).ok, false);
const catalogResponse = await catalogHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'catalog', authorizationConfirmed: true });
assert.equal(catalogResponse.ok, true, catalogResponse.error);
assert.equal(catalogResponse.job.pages.docs, 1);
assert.equal(catalogResponse.job.pages.stories, 2);
assert.equal(catalogResponse.job.pages.staticReady, 3);
assert.deepEqual(catalogHarness.navigationUrls.map((url) => new URL(url).pathname), Array(3).fill('/storybook/iframe.html'));
assert.deepEqual(catalogHarness.navigationUrls.map((url) => [...new URL(url).searchParams]), [
  [['id', 'components-dialog--docs'], ['viewMode', 'docs']],
  [['id', 'components-dialog--default'], ['viewMode', 'story']],
  [['id', 'components-dialog--no-close-button'], ['viewMode', 'story']],
]);
assert(catalogHarness.navigationUrls.every((url) => !new URL(url).searchParams.has('args')));
const catalogMembers = readZip(Buffer.from(await catalogHarness.zipArchives[0].blob.arrayBuffer()));
const catalogFile = (path) => new TextDecoder().decode(catalogMembers.find((file) => file.path === path).bytes);
const catalogIndex = catalogFile('index.html');
assert.match(catalogIndex, /components-dialog--default\.html">Default</);
assert.match(catalogIndex, /components-dialog--no-close-button\.html">No Close Button</);
assert.match(catalogFile('pages/components-dialog--docs.html'), /href="components-dialog--no-close-button\.html#example"/);
const catalogPages = JSON.parse(catalogFile('manifest.json')).pages;
assert.deepEqual(catalogPages.map((page) => page.type), ['docs', 'story', 'story']);
assert.equal(catalogPages.find(({ id }) => id.endsWith('--default')).frame.frameId, 0);
assert.equal(catalogPages.find(({ id }) => id.endsWith('--docs')).frame.rootSelector, '#storybook-docs');
assert(!catalogHarness.offlineRequestedUrls.some((url) => url.endsWith('/missing-runtime.js')));
const catalogImages = catalogMembers.filter(({ path }) => path.startsWith('assets/images/') && path.endsWith('.png'));
assert.equal(catalogImages.reduce((size, image) => size + image.bytes.byteLength, 0), 6 * 1024 * 1024);
assert.deepEqual(catalogImages.map(({ bytes }) => bytes[0]).sort(), [137, 200]);
assert.equal(catalogHarness.indexedDbRecordCount, 0, 'catalog cleans staged ZIP members and assets');
assert.equal(catalogHarness.tabs.size, 0, 'catalog export closes its owned crawler tab');

assert.equal(catalogResponse.job.downloadAvailable, true);
const staleDownload = await catalogHarness.send({ action: 'DOWNLOAD_OFFLINE', jobId: 'old-job' });
assert.equal(staleDownload.ok, false, 'a stale job ID cannot download the current ZIP');
const requestsBeforeDownload = catalogHarness.offlineRequestedUrls.length;
const navigationsBeforeDownload = catalogHarness.navigationUrls.length;
catalogHarness.setSourceTab({ id: 1, url: 'https://unrelated.test/', status: 'complete' });
const redownload = await catalogHarness.send({ action: 'DOWNLOAD_OFFLINE', jobId: catalogResponse.job.id });
assert.equal(redownload.ok, true, redownload.error);
assert.equal(redownload.filename, catalogResponse.filename);
assert.equal(catalogHarness.downloadRequests.length, 2);
assert.equal(catalogHarness.offlineRequestedUrls.length, requestsBeforeDownload);
assert.equal(catalogHarness.navigationUrls.length, navigationsBeforeDownload);
assert.deepEqual(
  Buffer.from(await catalogHarness.zipArchives[1].blob.arrayBuffer()),
  Buffer.from(await catalogHarness.zipArchives[0].blob.arrayBuffer()),
  'the saved ZIP downloads again byte-for-byte without crawling or requesting assets',
);

const loadingStoryId = 'components-button--loading';
const loadingHarness = await makeHarness({
  entries: [{ id: loadingStoryId, type: 'story', title: 'Components/Button', name: 'Loading' }],
  readinessFrames: [{ frameId: 0, routeType: 'iframe', root: true, rootSelector: '#storybook-root', text: 'Loading' }],
});
const loadingExport = await loadingHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'catalog', authorizationConfirmed: true });
assert.equal(loadingExport.job.pages.staticReady, 1, 'a rendered Loading button is a valid story');

const dataTableId = 'components-data-table--docs';
const dataTableHarness = await makeHarness({
  entries: [{ id: dataTableId, type: 'docs', title: 'Components/Data Table', name: 'Docs' }],
  readinessFrames: [
    { frameId: 0, routeType: 'iframe', root: true, rootSelector: '#storybook-docs', documentId: 'data-table-preview-document' },
    { frameId: 4, routeType: 'iframe', root: true, rootSelector: '#storybook-docs', documentId: 'nested-iframe-document' },
  ],
  realZip: true,
  offlineFixture: {
    cachedScripts: new Map([['https://storybook.test/assets/data-table-m0GME5TK.js', 'export const table = 1;']]),
    capture: ({ func, args, attempt }) => {
      if (attempt === 1) return [];
      const root = { querySelector: () => null, outerHTML: `<div id="storybook-docs"><main class="sbdocs-wrapper"><h1>Data Table</h1><p>${'x'.repeat(1024 * 1024 + 1)}</p></main></div>` };
      const context = vm.createContext({
        URL, URLSearchParams, TextEncoder,
        location: new URL(`https://storybook.test/storybook/iframe.html?id=${dataTableId}&viewMode=docs`),
        performance: { getEntriesByType: () => [] },
        document: {
          title: 'Data Table Docs', querySelector: (selector) => selector === '#storybook-docs' ? root : null,
          querySelectorAll: () => [{ href: 'https://storybook.test/assets/data-table-m0GME5TK.js' }, { src: 'https://storybook.test/assets/uncached.js' }],
          head: { children: [] }, documentElement: { getAttribute: () => null },
        },
      });
      return [{ frameId: 0, result: vm.runInContext(`(${func.toString()})(...${JSON.stringify(args)})`, context) }];
    },
  },
});
const dataTableExport = await dataTableHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'catalog', authorizationConfirmed: true });
assert.equal(dataTableExport.job.pages.staticReady, 1, 'retry captures Docs after the first injection returns no snapshot');
assert.equal(dataTableHarness.captureCalls.length, 2);
assert(dataTableHarness.captureCalls.every(({ target }) => target.documentIds[0] === 'data-table-preview-document'));
const dataTableMembers = readZip(Buffer.from(await dataTableHarness.zipArchives[0].blob.arrayBuffer()));
const tableHtml = dataTableMembers.find((file) => file.path === `pages/${dataTableId}.html`).bytes.toString();
assert(tableHtml.length > 1024 * 1024);
assert.match(tableHtml, /<div id="storybook-docs"><main class="sbdocs-wrapper">/);
assert(!tableHtml.includes('data-table-m0GME5TK.js'), 'cached chunks are not loaded by the HTML snapshot');
assert.equal(dataTableMembers.find((file) => file.path.endsWith('-data-table-m0GME5TK.js')).bytes.toString(), 'export const table = 1;');
const chunkManifest = JSON.parse(dataTableMembers.find((file) => file.path === 'ASSET_MANIFEST.json').bytes.toString());
assert.equal(chunkManifest.find((entry) => entry.source.endsWith('/uncached.js')).status, 'SKIPPED');
assert.equal(chunkManifest.find((entry) => entry.source.endsWith('/data-table-m0GME5TK.js')).sourceMode, 'browser-cache-only');
assert(!dataTableHarness.offlineRequestedUrls.some((url) => url.endsWith('.js')), 'cache misses do not fetch the script over the network');

const pageCacheHarness = await makeHarness({ entries: catalogEntries, realZip: true });
const exportCatalog = () => pageCacheHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'catalog', authorizationConfirmed: true });
const failedStory = 'components-dialog--no-close-button';
pageCacheHarness.failedIds.add(failedStory);
const firstCacheExport = await exportCatalog();
assert.equal(firstCacheExport.job.pages.failed, 1);
assert.equal(firstCacheExport.job.pages.reused, 0);
assert.equal(pageCacheHarness.cachedPageCount, 2);

pageCacheHarness.failedIds.delete(failedStory);
pageCacheHarness.setSourceTab({ id: 1, url: 'https://storybook.test/storybook/?path=/story/components-dialog--default', status: 'complete' });
const beforeRetry = pageCacheHarness.navigationUrls.length;
const retryCacheExport = await exportCatalog();
assert.equal(retryCacheExport.job.pages.reused, 2);
assert.equal(retryCacheExport.job.pages.staticReady, 3);
assert.equal(pageCacheHarness.navigationUrls.length - beforeRetry, 1, 'same pathname only navigates to the previously failed story');
assert.equal(pageCacheHarness.cachedPageCount, 3, 'successful ZIP retains page snapshots for future jobs');

pageCacheHarness.setSourceTab({ id: 1, url: 'https://storybook.test/another-book/?path=/docs/components-dialog--docs', status: 'complete' });
const changedPathExport = await exportCatalog();
assert.equal(changedPathExport.job.pages.reused, 0);
assert.equal(changedPathExport.job.pages.scanned, 3);
assert.equal(pageCacheHarness.cachedPageCount, 3, 'changing pathname deletes old snapshots instead of accumulating them');
pageCacheHarness.setSourceTab({ id: 1, url: 'https://storybook.test/storybook/?path=/docs/components-dialog--docs', status: 'complete' });
assert.equal((await exportCatalog()).job.pages.reused, 0, 'returning to the previous pathname cannot reuse cleared entries');

const offlineFixture = {
  html: (id) => `<!doctype html><html><head><link rel="stylesheet" href="/offline.css"><script src="/bundle.js"></script></head><body><main class="sbdocs-wrapper"><h1>${id}</h1><img src="/shared.png"><img src="/icon.svg#mark"><img src="/missing.png"><img src="/secret.png?token=fixture-secret"><img src="https://external.test/private.png"><a href="/?path=/docs/guide--docs">Guide</a></main></body></html>`,
  assets: new Map([
    ['/offline.css', { body: '@import "./nested.css"; @font-face{font-family:Fixture;src:url("./fixture.woff2")} .hero{background:url("./shared.png")}', mime: 'text/css' }],
    ['/nested.css', { body: '.nested{color:#123}', mime: 'text/css' }],
    ['/fixture.woff2', { body: new Uint8Array([0, 255, 10, 128]), mime: 'font/woff2' }],
    ['/shared.png', { body: new Uint8Array([137, 80, 78, 71, 0, 255, 1]), mime: 'image/png' }],
    ['/icon.svg', { body: '<svg xmlns="http://www.w3.org/2000/svg"><path id="mark" d="M0 0"/></svg>', mime: 'image/svg+xml' }],
    ['/bundle.js', { body: 'import "./chunk.js"; import(dynamicPath);', mime: 'text/javascript' }],
    ['/chunk.js', { body: 'export const fixture=1;', mime: 'text/javascript' }],
    ['/missing.png', { body: 'not found', mime: 'text/plain', status: 404 }],
  ]),
};
const offlineIntegratedHarness = await makeHarness({ delay: 3, realZip: true, offlineFixture });
const offlineIntegratedResponse = await offlineIntegratedHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'all', authorizationConfirmed: true });
assert.equal(offlineIntegratedResponse.ok, true, 'integrated All Docs asset export generates a ZIP');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/offline.css'), 1, `shared page stylesheet fetched once through the actual background coordinator; calls=${JSON.stringify([...offlineIntegratedHarness.offlineAssetCalls])}; job=${JSON.stringify(offlineIntegratedResponse.job)}`);
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/shared.png'), 1, 'shared page image fetched once through the actual background coordinator');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/nested.css'), 1, 'recursive CSS import fetched once through the coordinator');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/fixture.woff2'), 1, 'font dependency fetched once through the coordinator');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/bundle.js'), 1, 'shared JavaScript bundle fetched once through the coordinator');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/chunk.js'), 1, 'static JavaScript module dependency fetched once through the coordinator');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.get('/missing.png'), 1, 'a permanent missing resource does not retry automatically');
assert.equal(offlineIntegratedHarness.offlineAssetCalls.has('/secret.png'), false, 'secret-bearing asset URLs are rejected before network access');
assert(!offlineIntegratedHarness.offlineRequestedUrls.some((url) => url.startsWith('https://external.test/')), 'unauthorized external origins are never requested');
assert(offlineIntegratedHarness.offlineAssetPeak <= 3 && offlineIntegratedHarness.offlineAssetPeak === 3, 'integrated coordinator caps concurrent asset requests at three');
assert.equal(offlineIntegratedResponse.job.assets.failed, 1);
assert.equal(offlineIntegratedResponse.job.pages.partial, defaultEntries().length);
const offlineIntegratedMembers = readZip(Buffer.from(await offlineIntegratedHarness.zipArchives[0].blob.arrayBuffer()));
const offlineIntegratedPaths = new Set(offlineIntegratedMembers.map((member) => member.path));
assert([...offlineIntegratedPaths].some((path) => path.startsWith('assets/css/')));
assert([...offlineIntegratedPaths].some((path) => path.startsWith('assets/fonts/')));
assert([...offlineIntegratedPaths].some((path) => path.startsWith('assets/images/')));
assert([...offlineIntegratedPaths].some((path) => path.startsWith('assets/svg/')));
assert([...offlineIntegratedPaths].some((path) => path.startsWith('assets/js/')));
assert.equal(offlineIntegratedMembers.filter((member) => /^pages\/.+\.html$/.test(member.path)).length, defaultEntries().length);
assert(offlineIntegratedMembers.some((member) => member.path === 'OFFLINE_REPORT.md' && /dynamic/i.test(new TextDecoder().decode(member.bytes))), 'offline report records unsupported dynamic JavaScript behavior');
assert(offlineIntegratedMembers.some((member) => member.path === 'OFFLINE_REPORT.md' && /missing\.png/i.test(new TextDecoder().decode(member.bytes))), 'offline report records missing resources');
const offlineManifestBytes = offlineIntegratedMembers.find((member) => member.path === 'ASSET_MANIFEST.json').bytes;
const offlineAssetManifestText = new TextDecoder().decode(offlineManifestBytes);
assert(!offlineAssetManifestText.includes('fixture-secret'), 'offline asset manifest excludes a secret-bearing source URL');
const offlineManifest = JSON.parse(new TextDecoder().decode(offlineIntegratedMembers.find((member) => member.path === 'manifest.json').bytes));
assert.equal(offlineManifest.sourceOrigin, 'https://storybook.test');
assert(offlineManifest.pages.every((page) => page.frame?.frameId === 0 && page.sourceUrl && !page.sourceUrl.includes('fixture-secret')), 'offline manifest preserves verified frame and sanitized page source metadata');
assert.equal(offlineManifest.pages.filter((page) => page.status === 'PARTIAL').length, defaultEntries().length);
assert(offlineAssetManifestText.includes('"referringPageIds"') && offlineAssetManifestText.includes('"discoveryEvidence"'));
const offlineIndex = new TextDecoder().decode(offlineIntegratedMembers.find((member) => member.path === 'index.html').bytes);
assert(offlineIndex.includes('PARTIAL') || offlineIndex.includes('Partial'), 'offline navigation labels incomplete pages');
const archivedPage = new TextDecoder().decode(offlineIntegratedMembers.find((member) => member.path === 'pages/guide--docs.html').bytes);
assert(!/<script\b/i.test(archivedPage), 'integrated offline pages do not execute or retain original scripts');
assert(archivedPage.includes('../assets/images/') && archivedPage.includes('../assets/svg/'), 'integrated HTML references local image and SVG archive members');
const archivedCss = offlineIntegratedMembers.find((member) => member.path.startsWith('assets/css/') && member.path.endsWith('.css'));
assert(archivedCss && !new TextDecoder().decode(archivedCss.bytes).includes('https://storybook.test'), 'nested CSS dependencies are rewritten to local paths');
assert(offlineIntegratedHarness.indexedDbRecordCount > 0, 'partial exports retain validated staged files for authorized retry');

const slowOfflineFixture = { ...offlineFixture, assets: new Map([...offlineFixture.assets].map(([path, asset]) => [path, { ...asset, delay: 70 }])) };
const offlineLifecycleHarness = await makeHarness({ delay: 3, realZip: true, offlineFixture: slowOfflineFixture });
await offlineLifecycleHarness.clickAction({ id: 1, url: sourceUrl });
const pausedExportPromise = offlineLifecycleHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'all', authorizationConfirmed: true });
await offlineLifecycleHarness.waitOfflineFor((job) => job.state === 'downloading-assets');
await offlineLifecycleHarness.send({ action: 'OFFLINE_CONTROL', control: 'PAUSE' });
const offlinePaused = await offlineLifecycleHarness.waitOfflineFor((job) => job.state === 'paused');
assert.equal(offlinePaused.assets.downloading, 0, 'pause waits for active asset requests to settle');
await offlineLifecycleHarness.closeWindow(77);
assert.equal((await offlineLifecycleHarness.send({ action: 'GET_OFFLINE_JOB' })).job.state, 'paused', 'closing the extension window leaves the Offline Static job paused');
await offlineLifecycleHarness.clickAction({ id: 1, url: sourceUrl });
assert.equal(offlineLifecycleHarness.extensionWindows.size, 1, 'the extension window reopens while the offline job is paused');
await offlineLifecycleHarness.send({ action: 'OFFLINE_CONTROL', control: 'RESUME' });
const offlineLifecycleResult = await pausedExportPromise;
assert.equal(offlineLifecycleResult.ok, true, 'the paused export completes after resume');
assert.equal(offlineLifecycleResult.job.state, 'completed');
const authorizationRequired = await offlineLifecycleHarness.send({ action: 'OFFLINE_CONTROL', control: 'RETRY', authorizationConfirmed: false });
assert.equal(authorizationRequired.ok, false, 'retry cannot bypass the explicit authorization confirmation');
const offlineRetryResponse = await offlineLifecycleHarness.send({ action: 'OFFLINE_CONTROL', control: 'RETRY', authorizationConfirmed: true, waitForCompletion: true });
assert.equal(offlineRetryResponse.ok, true, 'an incomplete archive can be retried after reconfirmation');
assert.equal(offlineLifecycleHarness.offlineAssetCalls.get('/offline.css'), 1, 'retry reuses successfully staged CSS without downloading it again');
assert.equal(offlineLifecycleHarness.offlineAssetCalls.get('/bundle.js'), 1, 'retry reuses successfully staged JavaScript without downloading it again');
assert.equal(offlineLifecycleHarness.offlineAssetCalls.get('/shared.png'), 1, 'retry reuses successfully staged binary assets');
assert.equal(offlineLifecycleHarness.offlineAssetCalls.get('/missing.png'), 2, 'retry attempts the failed resource again');

const successfulOfflineFixture = { ...offlineFixture, html: (id) => offlineFixture.html(id).replace('<img src="/missing.png">', '').replace('<img src="/secret.png?token=fixture-secret">', '').replace('<img src="https://external.test/private.png">', ''), assets: new Map([...offlineFixture.assets].filter(([path]) => path !== '/missing.png')) };
const offlineCleanupHarness = await makeHarness({ delay: 3, realZip: true, offlineFixture: successfulOfflineFixture });
const offlineCleanupResult = await offlineCleanupHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'all', authorizationConfirmed: true });
assert.equal(offlineCleanupResult.ok, true);
assert.equal(offlineCleanupHarness.indexedDbRecordCount, 0, 'fully successful export cleans its owned IndexedDB staging records');

const offlineCancelHarness = await makeHarness({ delay: 3, realZip: true, offlineFixture: slowOfflineFixture });
const cancelledOfflinePromise = offlineCancelHarness.send({ action: 'EXPORT_OFFLINE', waitForCompletion: true, scope: 'all', authorizationConfirmed: true });
await offlineCancelHarness.waitOfflineFor((job) => job.state === 'downloading-assets');
await offlineCancelHarness.send({ action: 'OFFLINE_CONTROL', control: 'CANCEL' });
const cancelledOfflineResult = await cancelledOfflinePromise;
assert.equal(cancelledOfflineResult.ok, false, 'cancellation stops the offline archive handoff');
assert.equal((await offlineCancelHarness.send({ action: 'GET_OFFLINE_JOB' })).job.state, 'cancelled');
assert.equal(offlineCancelHarness.zipArchives.length, 0, 'cancelled Offline Static does not create a ZIP');
assert.equal(offlineCancelHarness.tabs.size, 0, 'cancelled Offline Static closes only its owned crawl tab');
assert.equal(offlineCancelHarness.indexedDbRecordCount, 0, 'cancelled export cleans its owned staging records');

const offlineRecoveryHarness = await makeHarness({ delay: 3 });
offlineRecoveryHarness.tabs.set(77, { id: 77, url: 'about:blank', status: 'complete' });
offlineRecoveryHarness.tabs.set(78, { id: 78, url: 'https://user-tab.test/', status: 'complete' });
offlineRecoveryHarness.state.storybookOfflineExportJob = { state: 'downloading-assets', phaseCode: 'DOWNLOADING_ASSETS', ownedTabId: 77, sourceUrl: 'https://storybook.test/storybook/', pages: { selected: 2 }, assets: { downloaded: 1 } };
const recoveredOfflineJob = (await offlineRecoveryHarness.send({ action: 'GET_OFFLINE_JOB' })).job;
assert.equal(recoveredOfflineJob.state, 'failed', 'a restarted worker fails explicitly when in-memory page buffers are unavailable');
assert.equal(offlineRecoveryHarness.tabs.has(77), false, 'restart recovery removes the recorded owned crawler tab');
assert.equal(offlineRecoveryHarness.tabs.has(78), true, 'restart recovery leaves unrelated user tabs open');

// Exercise the bundled ZIP writer and verify its directory and CRC fields.
const offscreenListeners = [];
let archiveBlob;
const offscreen = vm.createContext({
  chrome: { runtime: { onMessage: { addListener: (listener) => offscreenListeners.push(listener) } } },
  URL: { createObjectURL: (blob) => { archiveBlob = blob; return 'blob:test'; }, revokeObjectURL: () => {} },
  TextEncoder, Uint8Array, Uint32Array, DataView, Blob,
});
vm.runInContext(await read('offscreen.js'), offscreen, { filename: 'offscreen.js' });
offscreen.archiveFiles = archiveFiles;
const zipResponse = vm.runInContext('createArchiveUrl(archiveFiles)', offscreen);
assert.equal(zipResponse.ok, true, zipResponse.error || 'The ZIP writer rejected the existing Storybook archive fixture.');
const zip = new Uint8Array(await archiveBlob.arrayBuffer());
const view = new DataView(zip.buffer);
assert.equal(view.getUint32(0, true), 0x04034b50);
let endOffset = zip.length - 22;
while (endOffset >= 0 && view.getUint32(endOffset, true) !== 0x06054b50) endOffset--;
assert(endOffset >= 0, 'ZIP end-of-central-directory marker exists');
assert.equal(view.getUint16(endOffset + 10, true), archiveFiles.length);
let centralOffset = view.getUint32(endOffset + 16, true);
const names = [];
const localRecords = [];
for (let index = 0; index < archiveFiles.length; index++) {
  assert.equal(view.getUint32(centralOffset, true), 0x02014b50);
  const nameLength = view.getUint16(centralOffset + 28, true);
  const extraLength = view.getUint16(centralOffset + 30, true);
  const commentLength = view.getUint16(centralOffset + 32, true);
  names.push(new TextDecoder().decode(zip.slice(centralOffset + 46, centralOffset + 46 + nameLength)));
  localRecords.push({ offset: view.getUint32(centralOffset + 42, true), checksum: view.getUint32(centralOffset + 16, true), size: view.getUint32(centralOffset + 24, true) });
  centralOffset += 46 + nameLength + extraLength + commentLength;
}
assert(names.includes('manifest.json'));
assert(names.some((name) => name.startsWith('components/')));
const calculateCrc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
};
for (const record of localRecords) {
  assert.equal(view.getUint32(record.offset, true), 0x04034b50);
  const nameLength = view.getUint16(record.offset + 26, true);
  const extraLength = view.getUint16(record.offset + 28, true);
  const start = record.offset + 30 + nameLength + extraLength;
  assert.equal(calculateCrc32(zip.slice(start, start + record.size)), record.checksum, 'ZIP member data matches CRC-32');
}
const zipTestDir = await mkdtemp(join(tmpdir(), 'storybook-markdown-zip-'));
let independentUnzip = 'unavailable';
let independentOfflineZip = 'unavailable';
try {
  const zipPath = join(zipTestDir, 'export.zip');
  await writeFile(zipPath, Buffer.from(await archiveBlob.arrayBuffer()));
  const unzipTest = spawnSync('unzip', ['-t', zipPath], { encoding: 'utf8' });
  independentUnzip = 'PASS';
  if (['ENOENT', 'EPERM', 'EACCES'].includes(unzipTest.error?.code)) independentUnzip = `unavailable (${unzipTest.error.code})`;
  else if (unzipTest.error || unzipTest.status !== 0) throw new Error(`Independent unzip validation failed: ${unzipTest.stderr || unzipTest.error?.message || unzipTest.stdout}`);
  if (independentUnzip === 'PASS') {
    const list = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
    if (list.error || list.status !== 0) throw new Error(`Independent unzip listing failed: ${list.stderr || list.error?.message || list.stdout}`);
    assert.deepEqual(list.stdout.trim().split('\n').sort(), names.sort(), 'independent unzip reader sees every expected ZIP member');
  }

  const offlineZipPath = join(zipTestDir, 'offline-static.zip');
  await writeFile(offlineZipPath, Buffer.from(await offlineIntegratedHarness.zipArchives[0].blob.arrayBuffer()));
  const offlineZipFailure = (operation, args, result) => new Error(
    `Independent Offline Static ZIP ${operation} failed: ${JSON.stringify(['unzip', ...args])}; archive=${offlineZipPath}; status=${result.status}; signal=${result.signal}; error=${result.error?.message || 'none'}\nstdout: ${result.stdout || ''}\nstderr: ${result.stderr || ''}`,
  );
  // GNU tar on Ubuntu cannot read ZIPs; use the same ZIP-aware tool as the checks above.
  const offlineListArgs = ['-Z1', offlineZipPath];
  const offlineListing = spawnSync('unzip', offlineListArgs, { encoding: 'utf8' });
  if (!offlineListing.error && offlineListing.status === 0) {
    const offlineTestArgs = ['-t', offlineZipPath];
    const offlineTest = spawnSync('unzip', offlineTestArgs, { encoding: 'utf8' });
    if (offlineTest.error || offlineTest.status !== 0) throw offlineZipFailure('integrity validation', offlineTestArgs, offlineTest);
    independentOfflineZip = 'PASS (unzip)';
    const offlineNames = offlineListing.stdout.split(/\r?\n/).filter(Boolean);
    assert(offlineNames.includes('index.html') && offlineNames.includes('pages/guide--docs.html') && offlineNames.includes('ASSET_MANIFEST.json'), 'independent ZIP reader lists the generated Offline Static site');
    assert.deepEqual(offlineNames.sort(), offlineIntegratedMembers.map((member) => member.path).sort(), 'independent ZIP reader sees every expected Offline Static member');
    const offlineExtractDir = await mkdtemp(join(zipTestDir, 'offline-extracted-'));
    const offlineExtractArgs = ['-q', offlineZipPath, '-d', offlineExtractDir];
    const offlineExtract = spawnSync('unzip', offlineExtractArgs, { encoding: 'utf8' });
    if (offlineExtract.error || offlineExtract.status !== 0) throw offlineZipFailure('extraction', offlineExtractArgs, offlineExtract);
    const binaryMember = offlineIntegratedMembers.find((member) => member.path.startsWith('assets/images/') && !member.path.endsWith('/'));
    assert(binaryMember, 'integrated offline archive contains a binary image fixture');
    assert.deepEqual(await readFile(join(offlineExtractDir, ...binaryMember.path.split('/'))), Buffer.from(binaryMember.bytes), 'independent ZIP reader verifies extracted binary resource bytes');
  } else if (!['ENOENT', 'EPERM', 'EACCES'].includes(offlineListing.error?.code)) {
    throw offlineZipFailure('listing', offlineListArgs, offlineListing);
  } else {
    independentOfflineZip = `unavailable (${offlineListing.error.code})`;
  }

  offscreen.filenameFiles = filenameExport.files;
  const filenameZipResponse = vm.runInContext('createArchiveUrl(filenameFiles)', offscreen);
  assert.equal(filenameZipResponse.ok, true);
  const filenameZipPath = join(zipTestDir, 'filename-export.zip');
  await writeFile(filenameZipPath, Buffer.from(await archiveBlob.arrayBuffer()));
  if (independentUnzip === 'PASS') {
    const check = spawnSync('unzip', ['-t', filenameZipPath], { encoding: 'utf8' });
    if (check.error || check.status !== 0) throw new Error(`Independent filename ZIP validation failed: ${check.stderr || check.error?.message || check.stdout}`);
    const list = spawnSync('unzip', ['-Z1', filenameZipPath], { encoding: 'utf8' });
    if (list.error || list.status !== 0) throw new Error(`Independent filename ZIP listing failed: ${list.stderr || list.error?.message || list.stdout}`);
    assert.deepEqual(list.stdout.trim().split('\n').sort(), Array.from(filenameExport.files, (file) => file.path).sort(), 'independent unzip reader confirms exact generated filename members');
  }
} finally {
  await rm(zipTestDir, { recursive: true, force: true });
}
console.log(JSON.stringify({ result: 'PASS', currentMarkdown: true, allDocsZip: archiveFiles.length, figmaCssZip: true, exactStoryIdPaths: true, collisionHashesOnly: true, pathLinksConsistent: true, deterministicCompletionOrder: true, defaultConcurrency: 1, fallbackCategory: 'components', tokenContextAndConflicts: true, checkpointDeletion: true, partialRetry: true, pauseResume: true, cancellationCleanup: true, zipSignatures: true, offlineStatic: { currentDocsZip: true, allDocsZip: true, globalUrlDeduplication: true, actualAssetPeak: offlineIntegratedHarness.offlineAssetPeak, retryReusesStagedAssets: true, stagingRetentionAndCleanup: true, failedPageAndAssetReporting: true, windowReopen: true, workerRestartRecovery: true, authorizationGate: true, noExternalFetch: true }, independentOfflineZip, independentUnzip, mockPoolPeakNavigations: { sequential: serialHarness.peakNavigations, concurrency2: boundedHarness.peakNavigations, concurrency3: threeHarness.peakNavigations } }));
