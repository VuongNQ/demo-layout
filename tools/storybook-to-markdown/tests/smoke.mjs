import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

const directory = new URL('../', import.meta.url);
const read = (name) => readFile(new URL(name, directory), 'utf8');
const manifest = JSON.parse(await read('manifest.json'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, '0.3.0');
assert(manifest.permissions.includes('storage'));
assert(manifest.permissions.includes('offscreen'));
assert(!manifest.permissions.includes('unlimitedStorage'));
const popupHtml = await read('popup.html');
assert.match(popupHtml, /<progress[^>]+aria-label="Export progress"/);
assert.match(popupHtml, /aria-live="polite"/);
assert.match(popupHtml, /Idle · ready to export/);
assert(!popupHtml.includes('id="concurrency"'), 'popup does not expose concurrency above the approved serial default');
const popupJs = await read('popup.js');
for (const state of ['discovering', 'crawling', 'processing', 'compressing', 'completed', 'paused', 'cancelled', 'failed']) assert(popupJs.includes(`${state}:`));

async function makeHarness({ entries = defaultEntries(), delay = 4, readinessFrames = null } = {}) {
  const messages = new Set();
  const tabListeners = new Set();
  const downloadListeners = new Set();
  const tabs = new Map();
  const downloadItems = new Map();
  const downloadRequests = [];
  const filesByZip = [];
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
  const extractionFrames = [];

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
      sendMessage: async (message) => {
        if (message.action === 'MAKE_ZIP') {
          filesByZip.push(message.files);
          return { ok: true, url: `blob:mock-${filesByZip.length}` };
        }
        return { ok: true };
      },
      getContexts: async () => [],
      getURL: (path) => `chrome-extension://mock/${path}`,
    },
    storage: {
      local: {
        get: async (key) => ({ [key]: state[key] }),
        set: async (value) => Object.assign(state, structuredClone(value)),
      },
    },
    tabs: {
      onUpdated: event(tabListeners),
      create: async () => { const id = tabSequence++; tabs.set(id, { id, url: 'about:blank', status: 'complete' }); return tabs.get(id); },
      get: async (id) => tabs.get(id),
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
    scripting: {
      executeScript: async ({ target, func, args = [] }) => {
        if (args.length === 1 && typeof args[0] === 'string' && args[0].startsWith('http')) return [{ frameId: 0, result: await func(args[0]) }];
        const tab = tabs.get(target.tabId);
        if (tab?.url && tab.url !== 'about:blank') mainContext.location = new URL(tab.url);
        if (typeof args[0] === 'string') {
          const id = args[0];
          attempts.set(id, (attempts.get(id) || 0) + 1);
          if (failedIds.has(id)) throw new Error('Synthetic frame access failure.');
          const frames = readinessFrames || [{ frameId: 0, routeType: 'main', root: true, text: `${id} documentation text with stable rendered content` }];
          return frames.map((frame) => {
            const frameId = frame.frameId;
            const sampleKey = `${id}:${frameId}`;
            const count = probeCounts.get(sampleKey) || 0;
            probeCounts.set(sampleKey, count + 1);
            const resolvedId = frame.id === '$expected' || !frame.id ? id : frame.id;
            const url = frame.routeType === 'iframe'
              ? `https://storybook.test/storybook/iframe.html?id=${encodeURIComponent(resolvedId)}&viewMode=docs`
              : `https://storybook.test/storybook/?path=/docs/${encodeURIComponent(resolvedId)}`;
            const samples = frame.textSamples || [];
            const value = samples[Math.min(count, Math.max(samples.length - 1, 0))] ?? frame.text ?? `${id} documentation text with stable rendered content`;
            const root = frame.root ? {
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
            const result = vm.runInContext(`(${func.toString()})(${JSON.stringify(id)})`, frameContext);
            return { frameId, result };
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
    chrome, URL, URLSearchParams, TextEncoder, Uint8Array, Uint32Array, DataView, Blob, structuredClone,
    setTimeout, clearTimeout, console, document,
    getComputedStyle: (element) => ({
      length: element === document.documentElement ? 1 : 0,
      item: () => '--color-primary',
      getPropertyValue: () => currentId() === 'form--docs' ? '#654321' : '#123456',
      colorScheme: 'light',
      color: '#222222', backgroundColor: 'rgb(255, 255, 255)', fontFamily: 'Arial', fontSize: '16px', borderRadius: '0px',
    }),
    fetch: async () => ({ ok: true, json: async () => ({ entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])) }) }),
    importScripts: () => {},
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
  return { send, waitFor, state, tabs, filesByZip, downloadRequests, navigationUrls, navigationCompletionOrder, failedIds, attempts, extractionFrames, get peakNavigations() { return peakNavigations; } };
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

const current = await harness.send({ action: 'EXPORT_CURRENT', tabId: 1, tabUrl: sourceUrl, options });
assert(current.ok, current.error);
assert.match(current.filename, /\.md$/);
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

// Exercise the bundled ZIP writer and verify its directory and CRC fields.
const offscreenListeners = [];
let archiveBlob;
const offscreen = vm.createContext({
  chrome: { runtime: { onMessage: { addListener: (listener) => offscreenListeners.push(listener) } } },
  URL: { createObjectURL: (blob) => { archiveBlob = blob; return 'blob:test'; }, revokeObjectURL: () => {} },
  TextEncoder, Uint8Array, Uint32Array, DataView, Blob,
});
vm.runInContext(await read('offscreen.js'), offscreen, { filename: 'offscreen.js' });
let zipResponse;
offscreenListeners[0]({ action: 'MAKE_ZIP', files: archiveFiles }, {}, (response) => { zipResponse = response; });
assert.equal(zipResponse.ok, true);
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
try {
  const zipPath = join(zipTestDir, 'export.zip');
  await writeFile(zipPath, Buffer.from(await archiveBlob.arrayBuffer()));
  execFileSync('unzip', ['-t', zipPath], { stdio: 'pipe' });
  const independentlyReadNames = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n').sort();
  assert.deepEqual(independentlyReadNames, names.sort(), 'independent unzip reader sees every expected ZIP member');

  let filenameZipResponse;
  offscreenListeners[0]({ action: 'MAKE_ZIP', files: filenameExport.files }, {}, (response) => { filenameZipResponse = response; });
  assert.equal(filenameZipResponse.ok, true);
  const filenameZipPath = join(zipTestDir, 'filename-export.zip');
  await writeFile(filenameZipPath, Buffer.from(await archiveBlob.arrayBuffer()));
  execFileSync('unzip', ['-t', filenameZipPath], { stdio: 'pipe' });
  const filenameZipMembers = execFileSync('unzip', ['-Z1', filenameZipPath], { encoding: 'utf8' }).trim().split('\n').sort();
  assert.deepEqual(filenameZipMembers, Array.from(filenameExport.files, (file) => file.path).sort(), 'independent unzip reader confirms exact generated filename members');
} finally {
  await rm(zipTestDir, { recursive: true, force: true });
}
console.log(JSON.stringify({ result: 'PASS', currentMarkdown: true, allDocsZip: archiveFiles.length, exactStoryIdPaths: true, collisionHashesOnly: true, pathLinksConsistent: true, deterministicCompletionOrder: true, defaultConcurrency: 1, fallbackCategory: 'components', tokenContextAndConflicts: true, checkpointDeletion: true, partialRetry: true, pauseResume: true, cancellationCleanup: true, zipSignatures: true, independentUnzip: true, mockPoolPeakNavigations: { sequential: serialHarness.peakNavigations, concurrency2: boundedHarness.peakNavigations, concurrency3: threeHarness.peakNavigations } }));
