import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const directory = new URL('../', import.meta.url);
const read = (name) => readFile(new URL(name, directory), 'utf8');
const manifest = JSON.parse(await read('manifest.json'));
assert.equal(manifest.manifest_version, 3);
assert(manifest.permissions.includes('storage'));
assert(manifest.permissions.includes('offscreen'));
const popupHtml = await read('popup.html');
assert.match(popupHtml, /<progress[^>]+aria-label="Export progress"/);
assert.match(popupHtml, /aria-live="polite"/);
assert.match(popupHtml, /Idle · ready to export/);
const popupJs = await read('popup.js');
for (const state of ['discovering', 'crawling', 'processing', 'compressing', 'completed', 'paused', 'cancelled', 'failed']) assert(popupJs.includes(`${state}:`));

async function makeHarness({ entries = defaultEntries(), delay = 4 } = {}) {
  const messages = new Set();
  const tabListeners = new Set();
  const downloadListeners = new Set();
  const tabs = new Map();
  const downloadItems = new Map();
  const downloadRequests = [];
  const filesByZip = [];
  const failedIds = new Set();
  const attempts = new Map();
  const state = {};
  let tabSequence = 10;
  let downloadSequence = 1;
  let mainContext;

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
    documentElement: {},
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
        tab.status = 'loading';
        setTimeout(() => { tab.status = 'complete'; mainContext.location = new URL(tab.url); chrome.tabs.onUpdated.emit(id, { status: 'complete' }, { ...tab }); }, delay);
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
          return [{ frameId: 0, result: { ready: true, id, length: 50, signature: `${id}|stable` } }];
        }
        return [{ frameId: 0, result: func(args[0]) }];
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
    getComputedStyle: () => ({ length: 0, item: () => '' }),
    fetch: async () => ({ ok: true, json: async () => ({ entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])) }) }),
    importScripts: () => {},
  });
  mainContext = context;
  context.location = new URL('https://storybook.test/?path=/docs/current');
  const background = (await read('background.js')).replace("importScripts('extractor.js');", '').replace(".then(sendResponse).catch((error) => sendResponse({ ok: false, error: errorText(error) }));", ".then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.stack || error.message }));");
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
  return { send, waitFor, state, tabs, filesByZip, downloadRequests, failedIds, attempts };
}

function defaultEntries() {
  return [
    { id: 'guide--docs', type: 'docs', title: 'Guides/Overview', name: 'Overview', tags: [] },
    { id: 'button--docs', type: 'docs', title: 'Components/Button', name: 'Button', tags: ['components'] },
    { id: 'form--docs', type: 'docs', title: 'Forms/Control', name: 'Control', tags: [] },
    { id: 'undesignated--docs', type: 'docs', name: 'No category', tags: [] },
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

const start = await harness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 2 });
assert(start.ok);
assert.equal((await harness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 2 })).duplicate, true);
let completed = await harness.waitFor((job) => job.state === 'completed');
assert.equal(completed.total, 4);
assert.equal(completed.succeeded, 4);
assert.equal(harness.tabs.size, 0, 'temporary tabs are closed after export');
let archiveFiles = harness.filesByZip.at(-1);
for (const file of ['README.md', 'INDEX.md', 'manifest.json', 'EXTRACTION_REPORT.md', 'guides/', 'components/', 'form/', 'unclassified/', 'tokens/', 'tokens/design-tokens.md']) assert(archiveFiles.some((entry) => entry.path === file), `${file} exists in archive`);
assert(archiveFiles.some((entry) => entry.path.startsWith('guides/')));
assert(archiveFiles.some((entry) => entry.path.startsWith('components/')));
assert(archiveFiles.some((entry) => entry.path.startsWith('form/')));
assert(archiveFiles.some((entry) => entry.path.startsWith('unclassified/')));
const pageFiles = archiveFiles.filter((entry) => /^(guides|components|form|unclassified)\/.+\.md$/.test(entry.path));
assert.equal(pageFiles.length, 4, 'one Markdown document exists for each Docs entry');
assert(pageFiles.every((entry) => entry.content.startsWith('# ') && entry.content.includes('Storybook ID:')));
const archiveManifest = JSON.parse(archiveFiles.find((entry) => entry.path === 'manifest.json').content);
assert.deepEqual(archiveManifest.entries.map((entry) => entry.id), defaultEntries().map((entry) => entry.id));
assert.equal(new Set(archiveManifest.entries.map((entry) => entry.path)).size, archiveManifest.entries.length);
assert(archiveManifest.entries.every((entry) => !entry.path.split('/').includes('..')));
assert(archiveFiles.some((entry) => entry.content.includes('Props and variants')));

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
assert.match(retryHarness.filesByZip.at(-1).find((entry) => entry.path === 'EXTRACTION_REPORT.md').content, /history: #1 failed.*#2 succeeded/);

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

// Compare the production pool scheduler with deterministic mocked navigation latency.
const serialHarness = await makeHarness({ delay: 8 });
const serialStarted = Date.now();
await serialHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 1 });
await serialHarness.waitFor((job) => job.state === 'completed');
const serialMs = Date.now() - serialStarted;
const boundedHarness = await makeHarness({ delay: 8 });
const boundedStarted = Date.now();
await boundedHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 2 });
await boundedHarness.waitFor((job) => job.state === 'completed');
const boundedMs = Date.now() - boundedStarted;
assert(boundedMs < serialMs, `bounded mock pool (${boundedMs}ms) should beat sequential mock (${serialMs}ms)`);
const threeHarness = await makeHarness({ delay: 8 });
const threeStarted = Date.now();
await threeHarness.send({ action: 'START_ALL', tabId: 1, tabUrl: sourceUrl, options, concurrency: 3 });
await threeHarness.waitFor((job) => job.state === 'completed');
const threeMs = Date.now() - threeStarted;
assert(threeMs < serialMs, `three-tab mock pool (${threeMs}ms) should beat sequential mock (${serialMs}ms)`);

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
console.log(JSON.stringify({ result: 'PASS', currentMarkdown: true, allDocsZip: archiveFiles.length, partialRetry: true, pauseResume: true, cancellationCleanup: true, zipSignatures: true, mockBenchmarkMs: { sequential: serialMs, concurrency2: boundedMs, concurrency3: threeMs } }));
