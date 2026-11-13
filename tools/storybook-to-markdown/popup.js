import { buildFigmaCssArchive, parseFigmaCss } from './figma-css.js';

const byId = (id) => document.getElementById(id);
const startButton = byId('start');
const storybookMessage = byId('storybook-message');
const jobPanel = byId('job-panel');
const newExport = byId('new-export');
const figmaPanel = byId('figma-css-panel');
let currentJob = null;
let elapsedTimer = null;
let lastAnnouncement = '';
let activeImportMode = 'storybook';
let parsedFigmaCss = null;
let currentOfflineJob = null;

function selectedFormat() { return byId('format-offline')?.checked ? 'offline' : 'markdown'; }
function updateFormatUi() {
  const offline = selectedFormat() === 'offline';
  byId('markdown-options').hidden = offline;
  byId('offline-authorization').hidden = !offline;
  const catalog = byId('scope-catalog');
  byId('scope-catalog-option').hidden = !offline;
  catalog.disabled = !offline;
  if (!offline && catalog.checked) byId('scope-current').checked = true;
  byId('current-preview').hidden = true;
  startButton.textContent = offline ? 'Generate Offline Static ZIP' : 'Extract & download';
}
byId('format-markdown').addEventListener('change', updateFormatUi);
byId('format-offline').addEventListener('change', updateFormatUi);

function renderOffline(job) {
  currentOfflineJob = job;
  const hasJob = job?.state && job.state !== 'idle';
  const active = hasJob && !['completed', 'failed', 'cancelled'].includes(job.state);
  byId('offline-job-panel').hidden = !hasJob || activeImportMode !== 'storybook';
  byId('new-export').hidden = activeImportMode === 'figma' || active || Boolean(currentJob && !['idle', 'completed', 'cancelled', 'failed'].includes(currentJob.state));
  byId('offline-download').hidden = job?.state !== 'completed' || !job.downloadAvailable;
  if (!hasJob) return;
  byId('offline-state-pill').textContent = job.state;
  byId('offline-state-pill').className = `state-pill ${job.state}`;
  byId('offline-live-status').textContent = `${job.phaseCode ? `${job.phaseCode} · ` : ''}${job.phase || job.state}${job.lastError ? ` · ${job.lastError}` : ''}`;
  byId('offline-progress').value = Number(job.percent) || 0;
  byId('offline-source').textContent = `Source: ${job.sourceUrl || ''} · Scope: ${job.scope || ''}`;
  const p = job.pages || {}, a = job.assets || {};
  const discovered = job.scope === 'catalog' && p.docs !== undefined ? `${p.docs} Docs · ${p.stories} stories discovered. ` : '';
  byId('offline-counts').textContent = `${discovered}Pages ${p.scanned || 0}/${p.selected || 0} available · ${p.reused || 0} from cache · ${p.staticReady || 0} static-ready · ${p.partial || 0} partial · ${p.failed || 0} failed. Assets ${a.downloaded || 0}/${a.discovered || 0} downloaded · ${a.failed || 0} failed · ${a.skipped || 0} skipped · ${a.deduplicated || 0} deduplicated · ${a.downloadedBytes || 0} bytes.`;
  byId('offline-current').textContent = [job.currentPage && `Page: ${job.currentPage}`, job.currentAsset && `Asset: ${job.currentAsset}`, job.filename && `Downloaded: ${job.filename}`, ...(job.warnings || [])].filter(Boolean).join(' · ');
  byId('offline-pause').hidden = !['discovering', 'scanning', 'discovering-assets', 'downloading-assets'].includes(job.state);
  byId('offline-resume').hidden = job.state !== 'paused';
  byId('offline-cancel').hidden = !active;
  const retryableFailures = (job.assets?.failed || 0) > 0 || (job.pages?.failed || 0) > 0 || (job.pages?.partial || 0) > 0;
  byId('offline-retry').hidden = !['failed', 'cancelled'].includes(job.state) && !(job.state === 'completed' && retryableFailures);
  byId('offline-retry').textContent = job.state === 'completed' ? 'Retry incomplete pages and assets' : 'Retry failed export';
}

async function offlineControl(control) {
  try {
    if (control === 'RETRY') {
      if (selectedFormat() !== 'offline') { byId('format-offline').checked = true; updateFormatUi(); }
      if (!byId('offline-authorized').checked) throw new Error('Confirm that organizational policy permits this export and its intended storage or transfer before retrying.');
      const source = await send({ action: 'GET_SOURCE_TAB' });
      const origin = new URL(source.tabUrl).origin;
      if (!await chrome.permissions.request({ origins: [`${origin}/*`] })) throw new Error('Permission for the selected Storybook origin is required to fetch its static assets.');
    }
    const response = await send({ action: 'OFFLINE_CONTROL', control, authorizationConfirmed: control === 'RETRY' });
    if (control === 'RETRY') byId('offline-authorized').checked = false;
    renderOffline(response.job);
  }
  catch (error) { storybookMessage.textContent = error.message; }
}
byId('offline-pause').addEventListener('click', () => offlineControl('PAUSE'));
byId('offline-resume').addEventListener('click', () => offlineControl('RESUME'));
byId('offline-cancel').addEventListener('click', () => offlineControl('CANCEL'));
byId('offline-retry').addEventListener('click', () => offlineControl('RETRY'));

byId('offline-download').addEventListener('click', async () => {
  const button = byId('offline-download');
  button.disabled = true;
  storybookMessage.textContent = 'Preparing saved ZIP…';
  try {
    const response = await send({ action: 'DOWNLOAD_OFFLINE', jobId: currentOfflineJob?.id });
    storybookMessage.textContent = `Downloaded ${response.filename}.`;
  } catch (error) {
    storybookMessage.textContent = `Error: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});

function send(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else if (!response?.ok) reject(new Error(response?.error || 'Export request failed.'));
      else resolve(response);
    });
  });
}

function elapsedText(job) {
  if (!job?.startedAt) return 'Elapsed: 0:00';
  const isTerminal = ['completed', 'paused', 'cancelled', 'failed'].includes(job.state);
  const stop = job.completedAt || (isTerminal ? job.updatedAt : Date.now());
  const seconds = Math.max(0, Math.floor((stop - job.startedAt) / 1000));
  return `Elapsed: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function appendPageOutcome(container, entry) {
  const row = document.createElement('article');
  row.className = `page-row ${entry.status}`;
  const heading = document.createElement('div');
  heading.className = 'page-heading';
  const name = document.createElement('span');
  name.className = 'page-name';
  name.textContent = entry.title || entry.id;
  name.title = `${entry.title || entry.id} (${entry.id})`;
  const badge = document.createElement('span');
  badge.className = 'page-status';
  badge.textContent = `${entry.status || 'queued'}${entry.attempts ? ` · ${entry.attempts} attempt${entry.attempts === 1 ? '' : 's'}` : ''}`;
  heading.append(name, badge);
  row.append(heading);

  const id = document.createElement('code');
  id.textContent = entry.id;
  row.append(id);
  if (entry.error) {
    const error = document.createElement('p');
    error.className = 'page-error';
    error.textContent = entry.error;
    row.append(error);
  }
  if (entry.history?.length) {
    const history = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Attempt history';
    history.append(summary);
    const list = document.createElement('ul');
    for (const attempt of entry.history) {
      const item = document.createElement('li');
      const detail = attempt.error ? ` — ${attempt.error}` : '';
      item.textContent = `Attempt ${attempt.attempt}: ${attempt.status}${detail}`;
      list.append(item);
    }
    history.append(list);
    row.append(history);
  }
  if (entry.status === 'failed') {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'retry-entry secondary';
    retry.textContent = currentJob?.state === 'completed' ? 'Retry and rebuild archive' : 'Retry this page';
    retry.disabled = ['discovering', 'crawling', 'processing', 'compressing'].includes(currentJob?.state);
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      try { await send({ action: 'RETRY_ENTRY', id: entry.id }); }
      catch (error) { storybookMessage.textContent = error.message; retry.disabled = false; }
    });
    row.append(retry);
  }
  container.append(row);
}

function setImportMode(mode) {
  activeImportMode = mode === 'figma' ? 'figma' : 'storybook';
  const storybookTab = byId('mode-storybook');
  const figmaTab = byId('mode-figma');
  storybookTab.setAttribute('aria-selected', String(activeImportMode === 'storybook'));
  figmaTab.setAttribute('aria-selected', String(activeImportMode === 'figma'));
  storybookTab.tabIndex = activeImportMode === 'storybook' ? 0 : -1;
  figmaTab.tabIndex = activeImportMode === 'figma' ? 0 : -1;
  byId('storybook-panel').hidden = activeImportMode !== 'storybook';
  figmaPanel.hidden = activeImportMode !== 'figma';
  byId('offline-job-panel').hidden = activeImportMode !== 'storybook' || !currentOfflineJob || currentOfflineJob.state === 'idle';
  newExport.hidden = activeImportMode === 'figma' || Boolean(currentJob?.state && !['idle', 'completed', 'cancelled', 'failed'].includes(currentJob.state));
}

function invalidateFigmaPreview() {
  parsedFigmaCss = null;
  byId('figma-export').disabled = true;
  byId('figma-preview').hidden = true;
  byId('figma-layer-count').textContent = '0';
  byId('figma-warning-count').textContent = '0';
  if (byId('figma-css-input').value) byId('figma-message').textContent = 'Input changed. Parse again to preview and export.';
}

function showFigmaPreview(parsed) {
  const list = byId('figma-layer-list');
  list.replaceChildren();
  for (const layer of parsed.layers) {
    const item = document.createElement('article');
    item.className = 'figma-layer-preview';
    const heading = document.createElement('h4');
    heading.textContent = `${layer.order}. ${layer.name || '(unnamed layer)'}`;
    const detail = document.createElement('p');
    detail.textContent = `${layer.declarations.length} declaration${layer.declarations.length === 1 ? '' : 's'} · ${layer.warnings.length} warning${layer.warnings.length === 1 ? '' : 's'}`;
    item.append(heading, detail);
    if (layer.annotations.length) {
      const annotations = document.createElement('p');
      annotations.className = 'muted';
      annotations.textContent = `Annotations: ${layer.annotations.map((annotation) => annotation.text).join('; ')}`;
      item.append(annotations);
    }
    list.append(item);
  }
  byId('figma-layer-count').textContent = String(parsed.layers.length);
  byId('figma-warning-count').textContent = String(parsed.warnings.length);
  byId('figma-preview').hidden = false;
  byId('figma-export').disabled = parsed.layers.length === 0;
}

for (const [id, mode] of [['mode-storybook', 'storybook'], ['mode-figma', 'figma']]) {
  byId(id).addEventListener('click', () => setImportMode(mode));
  byId(id).addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'storybook' : event.key === 'End' ? 'figma' : mode === 'storybook' ? 'figma' : 'storybook';
    setImportMode(next);
    byId(next === 'storybook' ? 'mode-storybook' : 'mode-figma').focus();
  });
}
byId('close-window').addEventListener('click', async () => {
  const button = byId('close-window');
  button.disabled = true;
  try {
    const currentWindow = await chrome.windows.getCurrent();
    const windowId = currentWindow?.id;
    if (!Number.isInteger(windowId) || windowId < 0) {
      throw new Error('Chrome did not provide a valid extension window ID. Close this window using its native controls.');
    }
    await chrome.windows.remove(windowId);
  } catch (error) {
    byId(activeImportMode === 'figma' ? 'figma-message' : 'storybook-message').textContent = `Could not close this window: ${error.message}`;
    button.disabled = false;
  }
});
for (const id of ['figma-css-input', 'figma-selection-url', 'figma-export-name']) byId(id).addEventListener('input', invalidateFigmaPreview);
byId('figma-parse').addEventListener('click', () => {
  const button = byId('figma-parse');
  button.disabled = true;
  byId('figma-message').textContent = '';
  try {
    parsedFigmaCss = parseFigmaCss(byId('figma-css-input').value, byId('figma-selection-url').value);
    showFigmaPreview(parsedFigmaCss);
    byId('figma-message').textContent = parsedFigmaCss.warnings.length ? 'Parsed locally. Review the warnings before export.' : 'Parsed locally. Review the layer preview before export.';
  } catch (error) {
    parsedFigmaCss = null;
    byId('figma-layer-count').textContent = '0';
    byId('figma-warning-count').textContent = '0';
    byId('figma-preview').hidden = true;
    byId('figma-export').disabled = true;
    byId('figma-message').textContent = `Error: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
byId('figma-export').addEventListener('click', async () => {
  const button = byId('figma-export');
  if (!parsedFigmaCss) return;
  button.disabled = true;
  byId('figma-message').textContent = 'Building the local Figma CSS ZIP…';
  try {
    const archive = buildFigmaCssArchive(parsedFigmaCss, byId('figma-css-input').value, byId('figma-export-name').value);
    const response = await send({ action: 'EXPORT_FIGMA_CSS', files: archive.files, filename: archive.filename });
    byId('figma-message').textContent = `Downloaded ${response.filename}. Pasted CSS was processed locally.`;
  } catch (error) {
    byId('figma-message').textContent = `Error: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
byId('figma-clear').addEventListener('click', () => {
  byId('figma-css-input').value = '';
  byId('figma-selection-url').value = '';
  byId('figma-export-name').value = '';
  byId('figma-message').textContent = '';
  parsedFigmaCss = null;
  byId('figma-layer-list').replaceChildren();
  byId('figma-layer-count').textContent = '0';
  byId('figma-warning-count').textContent = '0';
  byId('figma-preview').hidden = true;
  byId('figma-export').disabled = true;
});

function render(job) {
  currentJob = job;
  const active = ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state);
  const terminal = ['completed', 'cancelled', 'failed'].includes(job.state);
  const hasJob = job.state && job.state !== 'idle';
  jobPanel.hidden = !hasJob;
  byId('idle-status').hidden = hasJob;
  const offlineActive = currentOfflineJob && !['completed', 'failed', 'cancelled', 'idle'].includes(currentOfflineJob.state);
  newExport.hidden = activeImportMode === 'figma' || (hasJob && !terminal) || Boolean(offlineActive);
  byId('new-after-terminal').hidden = !terminal;

  if (!hasJob) return;
  const labels = {
    discovering: 'Discovering', crawling: 'Crawling', processing: 'Processing', compressing: 'Packaging',
    completed: 'Completed', paused: 'Paused', cancelled: 'Cancelled', failed: 'Failed',
  };
  byId('state-pill').textContent = labels[job.state] || job.state;
  byId('state-pill').className = `state-pill ${job.state}`;
  const statusText = `${labels[job.state] || job.state}. ${job.phase || ''}${job.lastError ? ` ${job.lastError}` : ''}`.trim();
  if (statusText !== lastAnnouncement) {
    byId('live-status').textContent = statusText;
    lastAnnouncement = statusText;
  }
  byId('progress').value = Number(job.percent) || 0;
  byId('progress').setAttribute('aria-valuenow', String(Number(job.percent) || 0));
  byId('progress').setAttribute('aria-valuetext', `${Number(job.percent) || 0}% complete`);
  byId('percent').textContent = `${Number(job.percent) || 0}%`;
  byId('counts').textContent = `${job.processed || 0} / ${job.total || 0} pages · ${job.succeeded || 0} succeeded · ${job.failed || 0} failed`;
  byId('elapsed').textContent = elapsedText(job);
  byId('current-page').textContent = job.currentPage ? `Current page: ${job.currentPage.title} (${job.currentPage.id})` : `Phase: ${job.phase || labels[job.state]}`;
  byId('pause').hidden = !active || job.state !== 'crawling';
  byId('pause').disabled = Boolean(job.pauseRequested || job.cancelRequested);
  byId('resume').hidden = !['paused', 'failed', 'cancelled'].includes(job.state);
  byId('resume').textContent = job.state === 'paused' ? 'Resume' : 'Resume / retry export';
  byId('cancel').hidden = !active && job.state !== 'paused';
  byId('cancel').disabled = Boolean(job.cancelRequested);
  byId('retry-all').hidden = !(job.failed > 0 && ['completed', 'failed', 'paused'].includes(job.state));
  byId('retry-all').textContent = job.state === 'completed' ? 'Retry failed pages and rebuild archive' : 'Retry failed pages';
  byId('retry-all').disabled = active;
  byId('pages').replaceChildren();
  for (const entry of job.entries || []) appendPageOutcome(byId('pages'), entry);
}

async function pollJob() {
  try {
    const response = await send({ action: 'GET_JOB' });
    render(response.job || { state: 'idle' });
  } catch (error) {
    storybookMessage.textContent = error.message;
  }
}

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  storybookMessage.textContent = '';
  try {
    const scope = document.querySelector('input[name="scope"]:checked').value;
    if (selectedFormat() === 'offline') {
      if (!byId('offline-authorized').checked) throw new Error('Confirm that organizational policy permits this export and its intended storage or transfer.');
      const source = await send({ action: 'GET_SOURCE_TAB' });
      const origin = new URL(source.tabUrl).origin;
      const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
      if (!granted) throw new Error('Permission for the selected Storybook origin is required to fetch its static assets.');
      byId('offline-job-panel').hidden = false;
      storybookMessage.textContent = 'Capturing Storybook pages and static assets…';
      byId('offline-authorized').checked = false;
      const response = await send({ action: 'EXPORT_OFFLINE', scope, authorizationConfirmed: true });
      renderOffline(response.job);
      storybookMessage.textContent = '';
      return;
    }
    byId('current-preview').hidden = true;
    byId('preview').textContent = '';
    const options = { props: byId('props').checked, tokens: byId('tokens').checked, examples: byId('examples').checked };
    if (scope === 'all') {
      const source = await send({ action: 'GET_SOURCE_TAB' });
      const granted = await chrome.permissions.request({ origins: [`${new URL(source.tabUrl).origin}/*`] });
      if (!granted) throw new Error('Host permission for this Storybook origin is required.');
      const response = await send({ action: 'START_ALL', options });
      render(response.job);
    } else {
      storybookMessage.textContent = 'Extracting the current Docs page…';
      const response = await send({ action: 'EXPORT_CURRENT', options });
      storybookMessage.textContent = `Downloaded ${response.filename}; 1 page.`;
      byId('preview').textContent = response.preview;
      byId('current-preview').hidden = false;
    }
  } catch (error) {
    storybookMessage.textContent = `Error: ${error.message}`;
  } finally {
    startButton.disabled = false;
  }
});

byId('pause').addEventListener('click', async () => {
  try { const response = await send({ action: 'PAUSE' }); render(response.job); }
  catch (error) { storybookMessage.textContent = error.message; }
});
byId('resume').addEventListener('click', async () => {
  try { const response = await send({ action: 'RESUME' }); render(response.job); }
  catch (error) { storybookMessage.textContent = error.message; }
});
byId('cancel').addEventListener('click', async () => {
  try { const response = await send({ action: 'CANCEL' }); render(response.job); }
  catch (error) { storybookMessage.textContent = error.message; }
});
byId('retry-all').addEventListener('click', async () => {
  try { const response = await send({ action: 'RESUME' }); render(response.job); }
  catch (error) { storybookMessage.textContent = error.message; }
});
byId('new-after-terminal').addEventListener('click', () => {
  setImportMode('storybook');
  newExport.hidden = false;
  jobPanel.hidden = true;
  byId('idle-status').hidden = false;
  byId('current-preview').hidden = true;
  byId('preview').textContent = '';
  storybookMessage.textContent = '';
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.action === 'JOB_UPDATED' && message.job) render(message.job);
  if (message?.action === 'OFFLINE_JOB_UPDATED' && message.job) renderOffline(message.job);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.storybookExportJob) pollJob();
  if (changes.storybookOfflineExportJob?.newValue) renderOffline(changes.storybookOfflineExportJob.newValue);
});

pollJob();
send({ action: 'GET_OFFLINE_JOB' }).then((response) => renderOffline(response.job)).catch(() => {});
updateFormatUi();
elapsedTimer = setInterval(() => {
  if (currentJob && !jobPanel.hidden) byId('elapsed').textContent = elapsedText(currentJob);
}, 1000);
