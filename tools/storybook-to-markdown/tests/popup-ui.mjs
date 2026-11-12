import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('popup.html', root), 'utf8');
const removedWindowIds = [];
let currentExtensionWindow = { id: 345 };
let failCurrentExport = false;
let removeFailure = null;
let offlineAction = null;
let offlineReads = 0;
let offlineControlAction = null;
let offlineDownloadAction = null;
const offlineJobListeners = [];
let savedOfflineJob = { state: 'paused', phaseCode: 'PAUSED', phase: 'Paused after request', scope: 'all', sourceUrl: 'https://storybook.example/storybook/', pages: { selected: 3, scanned: 2, staticReady: 1, partial: 1, failed: 0 }, assets: { discovered: 5, downloaded: 4, failed: 1, skipped: 0, deduplicated: 2, downloadedBytes: 2048 }, percent: 45 };
const elements = new Map();

class ElementMock {
  constructor(id) {
    this.id = id;
    this.hidden = false;
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  focus() { this.focused = true; }
  dispatch(type, event = {}) { return this.listeners.get(type)?.({ preventDefault() {}, ...event }); }
}

for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, new ElementMock(id));
elements.get('storybook-panel').hidden = false;
elements.get('figma-css-panel').hidden = true;
elements.get('figma-css-input').value = '/* Initial layer */\nwidth: 320px;';
elements.get('figma-selection-url').value = 'https://www.figma.com/design/demo/file?node-id=1-2';
elements.get('figma-export-name').value = 'Draft name';
elements.get('figma-export').disabled = true;
elements.get('figma-preview').hidden = true;
elements.get('current-preview').hidden = true;
elements.get('job-panel').hidden = true;
elements.get('new-after-terminal').hidden = true;

const document = {
  getElementById: (id) => elements.get(id),
  createElement: (tag) => new ElementMock(tag),
  querySelector: (selector) => selector === 'input[name="scope"]:checked' ? { value: 'current' } : null,
};
const chrome = {
  runtime: {
    lastError: undefined,
    sendMessage(message, callback) {
      if (message.action === 'GET_JOB') callback({ ok: true, job: { state: 'idle' } });
      else if (message.action === 'GET_OFFLINE_JOB') { offlineReads++; callback({ ok: true, job: savedOfflineJob }); }
      else if (message.action === 'GET_SOURCE_TAB') callback({ ok: true, tabUrl: 'https://storybook.example/storybook/?path=/docs/button--docs' });
      else if (message.action === 'EXPORT_OFFLINE') { offlineAction = message; callback({ ok: true, filename: 'storybook-offline-current.zip', job: { state: 'completed', scope: message.scope, sourceUrl: 'https://storybook.example/storybook/', filename: 'storybook-offline-current.zip', pages: { selected: 1, scanned: 1 }, assets: {} } }); }
      else if (message.action === 'DOWNLOAD_OFFLINE') { offlineDownloadAction = message; callback({ ok: true, filename: 'storybook-offline-current.zip' }); }
      else if (message.action === 'OFFLINE_CONTROL') { offlineControlAction = message; callback({ ok: true, job: { state: 'completed', scope: 'all', pages: { selected: 2, scanned: 2 }, assets: { failed: 1 } } }); }
      else if (message.action === 'EXPORT_CURRENT') callback(failCurrentExport ? { ok: false, error: 'Current Docs mock failure' } : { ok: true, filename: 'current.md', preview: '# Storybook result' });
      else if (message.action === 'EXPORT_FIGMA_CSS') callback({ ok: true, filename: 'figma-css-demo.zip' });
      else callback({ ok: true, job: { state: 'idle' } });
    },
    onMessage: { addListener(listener) { offlineJobListeners.push(listener); } },
  },
  storage: { onChanged: { addListener() {} } },
  permissions: { request: async ({ origins }) => origins[0] === 'https://storybook.example/*' },
  windows: {
    getCurrent: async () => currentExtensionWindow,
    remove: async (id) => { removedWindowIds.push(id); if (removeFailure) throw removeFailure; },
  },
};

let source = await readFile(new URL('popup.js', root), 'utf8');
source = source.replace("import { buildFigmaCssArchive, parseFigmaCss } from './figma-css.js';", `
  const buildFigmaCssArchive = () => ({ files: [], filename: 'figma-css-demo.zip' });
  const parseFigmaCss = (css) => { if (css === 'bad') throw new Error('Figma mock parse failure'); return { layers: [{ name: css.split('\\n')[0], declarations: [{ property: 'width', value: '320px' }], warnings: [], annotations: [] }], warnings: [] }; };
`);
const context = vm.createContext({ chrome, document, console, URL, setInterval: () => 1, clearInterval() {} });
vm.runInContext(source, context, { filename: 'popup.js' });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(offlineReads, 1, 'popup startup restores the persisted Offline Static job');
assert.equal(elements.get('offline-job-panel').hidden, false, 'a reopened Storybook tab displays saved Offline Static progress');
assert.equal(elements.get('offline-state-pill').textContent, 'paused');
assert.equal(elements.get('offline-resume').hidden, false, 'a reopened paused job exposes Resume');
assert.equal(elements.get('offline-download').hidden, true, 'an unfinished job cannot download a ZIP');
assert.match(elements.get('offline-counts').textContent, /1 static-ready · 1 partial/);
offlineJobListeners.forEach((listener) => listener({ action: 'OFFLINE_JOB_UPDATED', job: { state: 'idle' } }));
assert.equal(elements.get('offline-job-panel').hidden, true, 'idle Offline Static state remains isolated from other export modes');

elements.get('mode-figma').dispatch('click');
assert.equal(elements.get('figma-css-panel').hidden, false);
assert.equal(elements.get('storybook-panel').hidden, true);
elements.get('figma-parse').dispatch('click');
assert.equal(elements.get('figma-layer-count').textContent, '1');
assert.match(elements.get('figma-message').textContent, /Parsed locally/);
elements.get('figma-export').dispatch('click');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.match(elements.get('figma-message').textContent, /Downloaded figma-css-demo.zip/);

elements.get('mode-storybook').dispatch('click');
assert.equal(elements.get('storybook-panel').hidden, false);
assert.equal(elements.get('figma-css-panel').hidden, true);
assert.equal(elements.get('figma-layer-count').textContent, '1', 'Figma parsed preview survives mode switching');
assert.equal(elements.get('storybook-message').textContent, '', 'Figma success is absent from Storybook status');
elements.get('start').dispatch('click');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.match(elements.get('storybook-message').textContent, /Downloaded current.md/);
assert.equal(elements.get('preview').textContent, '# Storybook result');

elements.get('mode-figma').dispatch('click');
assert.equal(elements.get('figma-css-input').value, '/* Initial layer */\nwidth: 320px;', 'Figma draft survives Storybook export and tab switching');
assert.match(elements.get('figma-message').textContent, /Downloaded figma-css-demo.zip/);
assert.equal(elements.get('current-preview').hidden, false, 'Storybook preview remains in its own panel state');
assert.equal(elements.get('mode-figma').getAttribute('aria-selected'), 'true');
assert.equal(elements.get('mode-storybook').tabIndex, -1);
elements.get('figma-css-input').value = 'bad';
elements.get('figma-parse').dispatch('click');
assert.match(elements.get('figma-message').textContent, /Figma mock parse failure/);
assert.match(elements.get('storybook-message').textContent, /Downloaded current.md/, 'Figma error does not replace Storybook success');
elements.get('mode-storybook').dispatch('click');
failCurrentExport = true;
await elements.get('start').dispatch('click');
assert.match(elements.get('storybook-message').textContent, /Current Docs mock failure/);
assert.match(elements.get('figma-message').textContent, /Figma mock parse failure/, 'Storybook error does not replace Figma error');
failCurrentExport = false;
await elements.get('start').dispatch('click');
assert.equal(elements.get('preview').textContent, '# Storybook result');
elements.get('mode-figma').dispatch('click');
elements.get('mode-figma').dispatch('keydown', { key: 'ArrowRight' });
assert.equal(elements.get('mode-storybook').getAttribute('aria-selected'), 'true', 'arrow key updates active tab selection');
assert.equal(elements.get('mode-storybook').focused, true, 'keyboard tab movement transfers focus');

elements.get('format-offline').checked = true;
elements.get('format-offline').dispatch('change');
assert.equal(elements.get('markdown-options').hidden, true, 'Offline Static keeps Markdown controls out of the static export form');
assert.equal(elements.get('offline-authorization').hidden, false, 'Offline Static requires a visible authorization attestation');
elements.get('start').dispatch('click');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.match(elements.get('storybook-message').textContent, /Confirm that organizational policy permits/);
elements.get('offline-authorized').checked = true;
await elements.get('start').dispatch('click');
assert.deepEqual(offlineAction && [offlineAction.scope, offlineAction.authorizationConfirmed], ['current', true], `confirmed Current Docs starts the separate Offline Static action: ${elements.get('storybook-message').textContent}`);
assert.match(elements.get('storybook-message').textContent, /Downloaded storybook-offline-current.zip/);
offlineJobListeners.forEach((listener) => listener({ action: 'OFFLINE_JOB_UPDATED', job: { state: 'completed', scope: 'all', pages: { selected: 2, scanned: 2, partial: 1 }, assets: { failed: 1 } } }));
assert.equal(elements.get('offline-retry').hidden, false, 'completed partial exports expose a retry control');
assert.equal(elements.get('offline-download').hidden, true, 'a completed job without a retained archive hides Download ZIP');
offlineJobListeners.forEach((listener) => listener({ action: 'OFFLINE_JOB_UPDATED', job: { id: 'offline-saved', state: 'completed', downloadAvailable: true, pages: { partial: 1 } } }));
assert.equal(elements.get('offline-download').hidden, false, 'a completed export with an archive exposes Download ZIP');
await elements.get('offline-download').dispatch('click');
assert.equal(offlineDownloadAction?.jobId, 'offline-saved');
assert.match(elements.get('storybook-message').textContent, /Downloaded storybook-offline-current.zip/);
elements.get('offline-authorized').checked = false;
await elements.get('offline-retry').dispatch('click');
assert.match(elements.get('storybook-message').textContent, /Confirm that organizational policy permits/);
assert.equal(offlineControlAction, null, 'retry does not reach the background worker before confirmation');
elements.get('offline-authorized').checked = true;
await elements.get('offline-retry').dispatch('click');
assert.equal(offlineControlAction?.authorizationConfirmed, true, 'retry requires a new explicit confirmation');

elements.get('figma-clear').dispatch('click');
assert.equal(elements.get('figma-css-input').value, '');
assert.equal(elements.get('preview').textContent, '# Storybook result', 'Figma reset leaves Storybook result intact');
await elements.get('close-window').dispatch('click');
assert.deepEqual(removedWindowIds, [345], 'Close passes the positive current extension window ID to windows.remove');
elements.get('close-window').disabled = false;
currentExtensionWindow = { id: -2 };
await elements.get('close-window').dispatch('click');
assert.deepEqual(removedWindowIds, [345], 'Close does not call windows.remove with an invalid negative ID');
assert.match(elements.get('storybook-message').textContent, /valid extension window ID/, 'invalid ID failure is reported');
currentExtensionWindow = undefined;
await elements.get('close-window').dispatch('click');
assert.deepEqual(removedWindowIds, [345], 'Close does not call windows.remove when the current window ID is missing');
assert.match(elements.get('storybook-message').textContent, /valid extension window ID/, 'missing ID failure is reported');
currentExtensionWindow = { id: 346 };
removeFailure = new Error('mock window removal failure');
await elements.get('close-window').dispatch('click');
assert.deepEqual(removedWindowIds, [345, 346], 'API failure test receives a valid concrete ID');
assert.match(elements.get('storybook-message').textContent, /Could not close this window: mock window removal failure/, 'windows.remove API failures are reported');

console.log(JSON.stringify({ result: 'PASS', figmaDraftAndPreviewIsolation: true, modeMessageIsolation: true, modeResetIsolation: true, tabKeyboardNavigation: true, closeUsesConcreteWindowId: 345, missingAndNegativeWindowIdsRejected: true, closeApiFailuresReported: true }));
