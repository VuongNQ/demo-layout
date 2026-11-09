importScripts('extractor.js');
const TIMEOUT_MS = 18000;
const MAX_PAGES = 120;
function sanitize(s) { return String(s || 'storybook').toLowerCase().normalize('NFKD').replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'storybook'; }
function cell(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim(); }
function md(s) { return String(s ?? '').replace(/([\\`*_{}\[\]<>])/g, '\\$1').trim(); }
function codeFence(s) { const runs = String(s).match(/`+/g) || []; return '`'.repeat(Math.max(3, ...runs.map(x => x.length + 1))); }
function renderPage(page, options) {
  const lines = ['## ' + md(page.title), '', 'Source: ' + page.url, ''];
  if (page.description.length) lines.push('### Description', '', ...page.description.map(md), '');
  if (page.headings.length) lines.push('### Sections', '', ...page.headings.map(h => ' '.repeat(Math.max(0, h.level - 2) * 2) + '- ' + md(h.text)), '');
  if (options.props) {
    page.tables.forEach((rows, i) => {
      const width = Math.max(...rows.map(r => r.length));
      if (!width) return;
      lines.push('### Table ' + (i + 1), '', '| ' + Array.from({length:width}, (_,j) => cell(rows[0][j])).join(' | ') + ' |', '| ' + Array(width).fill('---').join(' | ') + ' |');
      rows.slice(1).forEach(row => lines.push('| ' + Array.from({length:width}, (_,j) => cell(row[j])).join(' | ') + ' |'));
      lines.push('');
    });
  }
  if (options.tokens && page.tokens.length) {
    lines.push('### Observed design tokens / styles', '', '| Name / label | Value / computed style |', '| --- | --- |');
    for (const t of page.tokens) {
      const value = t.name ? t.value : [t.color, t.background, t.font, t.fontSize, t.radius].filter(Boolean).join('; ');
      lines.push('| ' + cell(t.name || t.label) + ' | ' + cell(value) + ' |');
    }
    lines.push('', '> Computed styles are observations, not confirmed canonical design tokens.', '');
  }
  if (options.examples && page.examples.length) {
    lines.push('### Code examples', '');
    for (const sample of page.examples) { const fence = codeFence(sample); lines.push(fence, sample, fence, ''); }
  }
  if (options.examples && page.guidelines.length) lines.push('### Lists and guidelines (observed)', '', ...page.guidelines.map(s => '- ' + md(s)), '');
  return lines.join('\n');
}
function renderExport(pages, options, origin, warnings) {
  return ['# Storybook Design System', '', 'Source: ' + origin, 'Extracted: ' + new Date().toISOString(), 'Pages: ' + pages.length, '', '> Content is extracted from rendered Storybook Docs, not inferred from source code.', '', ...pages.map(p => renderPage(p, options)), ...(warnings.length ? ['## Extraction warnings', '', ...warnings.map(w => '- ' + md(w)), ''] : [])].join('\n');
}
async function extractFromTab(tabId, options) {
  const results = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: extractStorybookDocument, args: [options] });
  const pages = results.map(r => r.result).filter(Boolean);
  if (!pages.length) throw new Error('No readable frame. Check permissions or page readiness.');
  return pages.sort((a,b) => Number(b.foundDocs) - Number(a.foundDocs) || b.contentLength - a.contentLength)[0];
}
async function discover(tabId, origin) {
  const result = await chrome.scripting.executeScript({ target: { tabId }, func: async (base) => {
    for (const path of ['/index.json', '/stories.json']) {
      try {
        const response = await fetch(new URL(path, base), { credentials: 'same-origin' });
        if (!response.ok) continue;
        const json = await response.json();
        const entries = json.entries || json.stories || {};
        return Object.entries(entries).filter(([,e]) => e.type === 'docs' || e.type === 'story' || e.type === 'root').map(([id,e]) => ({id, type:e.type, title:e.title || '', name:e.name || ''}));
      } catch { /* Try next index location. */ }
    }
    return [];
  }, args: [origin] });
  return (result[0]?.result || []).filter(e => e.type === 'docs').slice(0, MAX_PAGES);
}
function waitUntilComplete(tabId, expected, ms = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Timed out: ' + expected)), ms);
    const listener = (updatedId, info, tab) => {
      if (updatedId === tabId && info.status === 'complete' && tab.url?.includes('path=/docs/')) finish(null);
    };
    function finish(error) { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(listener); error ? reject(error) : resolve(); }
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then(tab => { if (tab.status === 'complete' && tab.url?.includes('path=/docs/')) finish(null); }).catch(finish);
  });
}
async function exportMarkdown(message) {
  const { tabId, tabUrl, scope, options } = message;
  const origin = new URL(tabUrl).origin;
  const warnings = [];
  const pages = [];
  if (scope === 'current') {
    pages.push(await extractFromTab(tabId, options));
    if (!pages[0].foundDocs) warnings.push('Storybook Docs wrapper not detected; extracted general page content.');
  } else {
    const entries = await discover(tabId, origin);
    if (!entries.length) throw new Error('No Docs entries found at /index.json or /stories.json. Use Current page mode.');
    if (entries.length === MAX_PAGES) warnings.push('Limited to the first ' + MAX_PAGES + ' Docs entries.');
    let temp;
    try {
      temp = await chrome.tabs.create({ url: 'about:blank', active: false });
      for (const entry of entries) {
        const target = origin + '/?path=/docs/' + encodeURIComponent(entry.id);
        try {
          await chrome.tabs.update(temp.id, { url: target });
          await waitUntilComplete(temp.id, target);
          await new Promise(resolve => setTimeout(resolve, 900));
          const page = await extractFromTab(temp.id, options);
          if (!page.foundDocs) warnings.push(entry.id + ': Docs wrapper not found (page may be loading or inaccessible).');
          page.title ||= entry.title;
          pages.push(page);
        } catch (error) { warnings.push(entry.id + ': ' + error.message); }
      }
    } finally { if (temp?.id) await chrome.tabs.remove(temp.id).catch(() => {}); }
    if (!pages.length) throw new Error('Failed to extract all ' + entries.length + ' discovered Docs entries.');
  }
  const markdown = renderExport(pages, options, origin, warnings);
  const filename = 'storybook-' + scope + '-' + sanitize(new URL(tabUrl).hostname) + '-' + new Date().toISOString().slice(0,10) + '.md';
  const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
  await chrome.downloads.download({ url: dataUrl, filename, saveAs: true, conflictAction: 'uniquify' });
  return { filename, pages: pages.length, failures: warnings.length, preview: markdown.slice(0, 8000) };
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== 'EXPORT') return;
  exportMarkdown(message).then(result => sendResponse({ ok:true, ...result })).catch(error => sendResponse({ ok:false, error: error.message }));
  return true;
});
