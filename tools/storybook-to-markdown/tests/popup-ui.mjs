import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('popup.html', root), 'utf8');
const removedWindowIds = [];
let currentExtensionWindow = { id: 345 };
let failCurrentExport = false;
let removeFailure = null;
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
      else if (message.action === 'EXPORT_CURRENT') callback(failCurrentExport ? { ok: false, error: 'Current Docs mock failure' } : { ok: true, filename: 'current.md', preview: '# Storybook result' });
      else if (message.action === 'EXPORT_FIGMA_CSS') callback({ ok: true, filename: 'figma-css-demo.zip' });
      else callback({ ok: true, job: { state: 'idle' } });
    },
    onMessage: { addListener() {} },
  },
  storage: { onChanged: { addListener() {} } },
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
const context = vm.createContext({ chrome, document, console, setInterval: () => 1, clearInterval() {} });
vm.runInContext(source, context, { filename: 'popup.js' });
await new Promise((resolve) => setTimeout(resolve, 0));

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
