const origin = process.env.STORYBOOK_ORIGIN || 'http://127.0.0.1:4179';
const sourceUrl = `${origin}/storybook/?path=/docs/guide--docs`;
const options = { props: true, tokens: true, examples: true };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    });
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() { this.socket.close(); }
}

const version = await json('http://127.0.0.1:9222/json/version');
const browser = new Cdp(version.webSocketDebuggerUrl);
const targets = await json('http://127.0.0.1:9222/json/list');
const worker = targets.find((target) => target.type === 'service_worker' && target.url.startsWith('chrome-extension://'));
const extensionId = process.env.STORYBOOK_EXTENSION_ID || (worker ? new URL(worker.url).host : 'fignfifoniblkonapihmkfakmlgkbkcf');
const fixtureTab = targets.find((target) => target.type === 'page' && target.url.startsWith(`${origin}/storybook/`));
if (!fixtureTab) throw new Error('Open the Storybook fixture in the launched Chrome profile first.');
const popupTarget = await browser.send('Target.createTarget', { url: `chrome-extension://${extensionId}/popup.html` });
const attached = await browser.send('Target.attachToTarget', { targetId: popupTarget.targetId, flatten: true });
const sessionId = attached.sessionId;
await browser.send('Runtime.enable', {}, sessionId);
await browser.send('Page.enable', {}, sessionId);

async function evaluate(expression, session = sessionId) {
  const response = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, session);
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Popup script failed.');
  return response.result.value;
}

async function installStartButton(concurrency, session = sessionId) {
  await evaluate('window.__startResult = null', session);
  const result = await evaluate(`(() => {
    let button = document.getElementById('browser-test-start');
    if (!button) {
      button = document.createElement('button');
      button.id = 'browser-test-start';
      button.textContent = 'Run browser test';
      button.style.cssText = 'position:fixed;right:8px;top:8px;z-index:999999;padding:8px;background:#b42318;color:white';
      document.body.append(button);
    }
    button.onclick = async () => {
      try {
        const granted = await chrome.permissions.request({ origins: [${JSON.stringify(`${origin}/*`)}] });
        if (!granted) throw new Error('Origin permission was denied.');
        const matches = await chrome.tabs.query({ url: ${JSON.stringify(`${origin}/storybook/*`)} });
        const tab = matches[0];
        if (!tab) throw new Error('Fixture tab was not found.');
        const response = await chrome.runtime.sendMessage({ action: 'START_ALL', tabId: tab.id, tabUrl: ${JSON.stringify(sourceUrl)}, options: ${JSON.stringify(options)}, concurrency: ${concurrency} });
        window.__startResult = response;
      } catch (error) { window.__startResult = { ok: false, error: error.message }; }
    };
    const rect = button.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`, session);
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: result.x, y: result.y }, session);
  await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: result.x, y: result.y, button: 'left', clickCount: 1 }, session);
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: result.x, y: result.y, button: 'left', clickCount: 1 }, session);
  const startResult = await evaluate(`new Promise((resolve) => { const began = Date.now(); const timer = setInterval(() => { if (window.__startResult || Date.now() - began > 10000) { clearInterval(timer); resolve(window.__startResult || { ok: false, error: 'Start did not settle.' }); } }, 50); })`, session);
  if (!startResult.ok) throw new Error(startResult.error);
  return startResult;
}

async function popupJob(session = sessionId) {
  return evaluate(`new Promise((resolve) => chrome.runtime.sendMessage({ action: 'GET_JOB' }, (response) => resolve(response.job)))`, session);
}

async function waitJob(predicate, timeout = 45000, session = sessionId) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const job = await popupJob(session);
    if (predicate(job)) return job;
    await pause(100);
  }
  throw new Error('Timed out waiting for a job state.');
}

async function click(selector, session = sessionId) {
  const exists = await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, session);
  if (!exists) throw new Error(`Popup control not found: ${selector}`);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`, session);
}

async function downloadItems(session = sessionId) {
  return evaluate(`new Promise((resolve) => chrome.downloads.search({}, (items) => resolve(items.map(({filename, state, url}) => ({filename, state, url}))))`, session);
}

const testResults = {};

// Start the first all-pages crawl from the origin-permission control; close/reopen the popup mid-crawl.
await installStartButton(2, sessionId);
await waitJob((job) => job.state === 'crawling' && job.entries.some((entry) => entry.status === 'running'));
await browser.send('Target.closeTarget', { targetId: popupTarget.targetId });
const reopened = await browser.send('Target.createTarget', { url: `chrome-extension://${extensionId}/popup.html` });
const reopenedAttached = await browser.send('Target.attachToTarget', { targetId: reopened.targetId, flatten: true });
const previousSession = sessionId;
// Continue using the same helper against the newly opened popup target.
const newSessionId = reopenedAttached.sessionId;
await browser.send('Runtime.enable', {}, newSessionId);
await browser.send('Page.enable', {}, newSessionId);
async function evalReopened(expression) {
  const response = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, newSessionId);
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Reopened popup failed.');
  return response.result.value;
}
async function pollReopened() { return evalReopened(`new Promise((resolve) => chrome.runtime.sendMessage({ action: 'GET_JOB' }, (response) => resolve(response.job)))`); }
let restored;
for (let count = 0; count < 100; count++) {
  restored = await pollReopened();
  if (['crawling', 'completed'].includes(restored.state)) break;
  await pause(100);
}
if (!restored?.entries?.length) throw new Error('Popup did not restore the saved crawl.');
testResults.popupReopen = { restoredState: restored.state, total: restored.total };
let first = restored;
for (let count = 0; count < 300 && first.state !== 'completed'; count++) { await pause(100); first = await pollReopened(); }
if (first.state !== 'completed') throw new Error(`All Docs export did not complete: ${first.state} ${first.lastError || ''}`);
testResults.allDocs = { state: first.state, succeeded: first.succeeded, failed: first.failed, processed: first.processed };

// The fixture fails one entry's first Docs render; retry it through the real popup control.
if (first.failed !== 1) throw new Error(`Expected one fixture failure, saw ${first.failed}.`);
// Entry controls use a button in the page row, so find its containing row by its stable ID text.
await evalReopened(`(() => { const row=[...document.querySelectorAll('.page-row')].find((el)=>el.textContent.includes('retry--docs')); row?.querySelector('.retry-entry')?.click(); })()`);
let retried = first;
for (let count = 0; count < 300; count++) { await pause(100); retried = await pollReopened(); if (retried.state === 'completed' && retried.failed === 0 && retried.entries.find((entry) => entry.id === 'retry--docs')?.attempts === 2) break; }
if (retried.failed !== 0) throw new Error('Per-page retry did not succeed.');
testResults.retry = retried.entries.find((entry) => entry.id === 'retry--docs').history.map((attempt) => attempt.status);

// Start a sequential run, pause after active work begins, and verify restored paused state.
await evalReopened(`window.__startResult = null;`);
await installStartButton(1, newSessionId);
await waitJob((job) => job.state === 'crawling' && job.entries.some((entry) => entry.status === 'running'), 45000, newSessionId);
const tabsBeforePause = (await popupJob(newSessionId)).tabIds || [];
await click('#pause', newSessionId);
let paused = await waitJob((job) => job.state === 'paused', 45000, newSessionId);
if (paused.tabIds?.length) throw new Error('Paused job still owns temporary tabs.');
for (const tabId of tabsBeforePause) {
  try { await evalReopened(`chrome.tabs.get(${tabId})`); throw new Error(`Paused job left temporary tab ${tabId} open.`); }
  catch (error) { if (error.message.includes('left temporary tab')) throw error; }
}
testResults.pause = paused.state;
await browser.send('Target.closeTarget', { targetId: reopened.targetId });
const resumeTarget = await browser.send('Target.createTarget', { url: `chrome-extension://${extensionId}/popup.html` });
const resumeAttached = await browser.send('Target.attachToTarget', { targetId: resumeTarget.targetId, flatten: true });
const resumeSession = resumeAttached.sessionId;
await browser.send('Runtime.enable', {}, resumeSession);
await click('#resume', resumeSession);
let finished = null;
for (let count = 0; count < 300; count++) {
  const response = await browser.send('Runtime.evaluate', { expression: `new Promise((resolve) => chrome.runtime.sendMessage({ action: 'GET_JOB' }, (result) => resolve(result.job)))`, awaitPromise: true, returnByValue: true }, resumeSession);
  finished = response.result.value;
  if (finished.state === 'completed') break;
  await pause(100);
}
if (finished?.state !== 'completed') throw new Error('Resumed export did not complete.');
testResults.resume = finished.state;

const currentResult = await browser.send('Runtime.evaluate', {
  expression: `new Promise(async (resolve) => { const tabs=await chrome.tabs.query({url:${JSON.stringify(`${origin}/storybook/*`)}}); const tab=tabs[0]; resolve(await chrome.runtime.sendMessage({action:'EXPORT_CURRENT',tabId:tab.id,tabUrl:${JSON.stringify(sourceUrl)},options:${JSON.stringify(options)}})); })`,
  awaitPromise: true, returnByValue: true,
}, resumeSession);
if (!currentResult.result.value.ok || !currentResult.result.value.filename.endsWith('.md')) throw new Error('Current Docs did not return a Markdown download.');
testResults.currentDocs = currentResult.result.value.filename;

// Cancel during an active crawl and verify the job is terminal only after its owned tabs are gone.
await browser.send('Target.closeTarget', { targetId: resumeTarget.targetId });
const cancelTarget = await browser.send('Target.createTarget', { url: `chrome-extension://${extensionId}/popup.html` });
const cancelAttached = await browser.send('Target.attachToTarget', { targetId: cancelTarget.targetId, flatten: true });
const cancelSession = cancelAttached.sessionId;
await browser.send('Runtime.enable', {}, cancelSession);
async function cancelEval(expression) {
  const response = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, cancelSession);
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Cancel control failed.');
  return response.result.value;
}
const cancelButton = await cancelEval(`(() => { const b=document.createElement('button'); b.id='browser-test-cancel-start'; b.textContent='Start cancellation test'; b.onclick=async()=>{const tabs=await chrome.tabs.query({url:${JSON.stringify(`${origin}/storybook/*`)}}); const tab=tabs[0]; window.__cancelStart=await chrome.runtime.sendMessage({action:'START_ALL',tabId:tab.id,tabUrl:${JSON.stringify(sourceUrl)},options:${JSON.stringify(options)},concurrency:1});}; document.body.append(b); const r=b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cancelButton.x, y: cancelButton.y, button: 'left', clickCount: 1 }, cancelSession);
await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cancelButton.x, y: cancelButton.y, button: 'left', clickCount: 1 }, cancelSession);
const waitCancelStart = async () => {
  for (let count = 0; count < 100; count++) {
    const job = await cancelEval(`new Promise((resolve)=>chrome.runtime.sendMessage({action:'GET_JOB'},(response)=>resolve(response.job)))`);
    if (job.state === 'crawling' && job.entries.some((entry) => entry.status === 'running')) return job;
    await pause(50);
  }
  throw new Error('Cancellation fixture crawl did not start.');
};
const cancelRunning = await waitCancelStart();
const tabsBeforeCancel = cancelRunning.tabIds || [];
await cancelEval(`document.querySelector('#cancel').click()`);
const cancelled = await waitJob((job) => job.state === 'cancelled', 45000, cancelSession);
if (cancelled.tabIds?.length) throw new Error('Cancelled job still owns temporary tabs.');
for (const tabId of tabsBeforeCancel) {
  try { await cancelEval(`chrome.tabs.get(${tabId})`); throw new Error(`Cancelled job left temporary tab ${tabId} open.`); }
  catch (error) { if (error.message.includes('left temporary tab')) throw error; }
}
testResults.cancel = cancelled.state;

// Compare actual Chrome tab scheduling against this deterministic local fixture.
testResults.chromeBenchmarkMs = {};
for (const concurrency of [1, 2, 3]) {
  const started = Date.now();
  await installStartButton(concurrency, cancelSession);
  const result = await waitJob((job) => job.state === 'completed', 60000, cancelSession);
  if (result.failed) throw new Error(`Benchmark width ${concurrency} had page failures.`);
  testResults.chromeBenchmarkMs[concurrency] = Date.now() - started;
}

testResults.downloads = (await downloadItems(cancelSession)).filter((item) => item.url?.startsWith('blob:') || item.filename.endsWith('.md'));
testResults.permission = (await cancelEval(`new Promise((resolve)=>chrome.permissions.contains({origins:[${JSON.stringify(`${origin}/*`)}]},resolve))`));
testResults.otherOriginPermission = (await cancelEval(`new Promise((resolve)=>chrome.permissions.contains({origins:['https://storybook-permission-scope.invalid/*']},resolve))`));
if (!testResults.permission || testResults.otherOriginPermission) throw new Error('Host permission is not limited to the selected Storybook origin.');
await browser.send('Target.closeTarget', { targetId: cancelTarget.targetId });
await browser.send('Target.closeTarget', { targetId: resumeTarget.targetId }).catch(() => {});
browser.close();
console.log(JSON.stringify({ result: 'PASS', ...testResults }, null, 2));
