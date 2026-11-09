const button = document.getElementById('extract');
const status = document.getElementById('status');
const preview = document.getElementById('preview');
const setStatus = (value) => { status.textContent = value; };
const send = (message) => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(message, (result) => {
    const error = chrome.runtime.lastError;
    if (error) reject(new Error(error.message));
    else if (!result?.ok) reject(new Error(result?.error || 'Export failed'));
    else resolve(result);
  });
});
button.addEventListener('click', async () => {
  button.disabled = true;
  preview.textContent = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) throw new Error('Open an http(s) Storybook page first.');
    const scope = document.querySelector('input[name="scope"]:checked').value;
    const options = { props: document.getElementById('props').checked, tokens: document.getElementById('tokens').checked, examples: document.getElementById('examples').checked };
    if (scope === 'all') {
      const granted = await chrome.permissions.request({ origins: [new URL(tab.url).origin + '/*'] });
      if (!granted) throw new Error('Host permission is required for full-site export.');
    }
    setStatus(scope === 'all' ? 'Scanning discoverable Docs pages…' : 'Extracting current page…');
    const result = await send({ action: 'EXPORT', tabId: tab.id, tabUrl: tab.url, scope, options });
    preview.textContent = result.preview;
    setStatus('Downloaded ' + result.filename + '. ' + result.pages + ' pages; ' + result.failures + ' warnings.');
  } catch (error) { setStatus('Error: ' + error.message); }
  finally { button.disabled = false; }
});
