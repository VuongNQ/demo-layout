importScripts('extractor.js');

const JOB_KEY = 'storybookExportJob';
const MAX_PAGES = 120;
const NAVIGATION_TIMEOUT_MS = 20000;
const READINESS_TIMEOUT_MS = 16000;
const READINESS_POLL_MS = 250;
const DEFAULT_CONCURRENCY = 1;
let job = null;
let runner = null;
let persistQueue = Promise.resolve();
let figmaCssExportActive = false;

const now = () => Date.now();
const errorText = (error) => String(error?.message || error || 'Unknown error').slice(0, 500);
const clone = (value) => JSON.parse(JSON.stringify(value));
let currentExport = false;

async function loadJob() {
  if (job) return job;
  const stored = await chrome.storage.local.get(JOB_KEY);
  job = stored[JOB_KEY] || null;
  return job;
}

function persist() {
  if (!job) return Promise.resolve();
  persistQueue = persistQueue.catch(() => {}).then(() => chrome.storage.local.set({ [JOB_KEY]: clone(job) }));
  return persistQueue;
}

function discardExtractedContent() {
  for (const entry of job?.entries || []) delete entry.page;
  if (job) job.extractedContentDeletedAt = now();
}

function progressState() {
  if (!job) return { state: 'idle', processed: 0, total: 0, succeeded: 0, failed: 0, percent: 0 };
  const entries = (job.entries || []).map(({ page, ...entry }) => entry);
  const processed = entries.filter((entry) => entry.status === 'succeeded' || entry.status === 'failed').length;
  const succeeded = entries.filter((entry) => entry.status === 'succeeded').length;
  const failed = entries.filter((entry) => entry.status === 'failed').length;
  const total = entries.length;
  let percent = total ? Math.floor((processed / total) * 80) : 0;
  if (job.state === 'discovering') percent = 1;
  if (job.state === 'processing') percent = 85;
  if (job.state === 'compressing') percent = 95;
  if (job.state === 'completed') percent = 100;
  return { ...clone({ ...job, entries }), processed, total, succeeded, failed, percent };
}

async function notifyPopup() {
  await persist();
  chrome.runtime.sendMessage({ action: 'JOB_UPDATED', job: progressState() }).catch(() => {});
}

function updateJob(patch) {
  Object.assign(job, patch, { updatedAt: now() });
  return notifyPopup();
}

function categoryFor(entry) {
  const titleParts = String(entry.title || '').split(/[\\/]/).map((part) => part.trim()).filter(Boolean);
  const titleCategory = new Map([['guide', 'guides'], ['guides', 'guides'], ['documentation', 'guides'], ['docs', 'guides'], ['form', 'form'], ['forms', 'form'], ['component', 'components'], ['components', 'components']]).get(String(titleParts[0] || '').toLowerCase());
  const tagCategories = [...new Set((Array.isArray(entry.tags) ? entry.tags : []).map((tag) => String(tag).toLowerCase()).map((tag) => {
    if (['guide', 'guides', 'documentation', 'docs'].includes(tag)) return 'guides';
    if (['form', 'forms'].includes(tag)) return 'form';
    if (['component', 'components'].includes(tag)) return 'components';
    return '';
  }).filter(Boolean))];
  if (titleCategory && (!tagCategories.length || tagCategories.length === 1 && tagCategories[0] === titleCategory)) {
    return { category: titleCategory, source: 'title-hierarchy', confidence: 'high', evidence: `Storybook title begins with the recognized ${titleCategory}/ category.` };
  }
  if (!titleCategory && tagCategories.length === 1) {
    return { category: tagCategories[0], source: 'storybook-tag', confidence: 'high', evidence: `Storybook tags include the recognized ${tagCategories[0]} category.` };
  }
  const evidence = titleCategory || tagCategories.length > 1
    ? `Conflicting category metadata (title category: ${titleCategory || 'none'}; tags: ${tagCategories.join(', ') || 'none'}); routed to components/ with low confidence.`
    : 'No recognized category metadata in Storybook title hierarchy or tags; routed to components/ with low confidence.';
  return { category: 'components', source: 'fallback', confidence: 'low', evidence };
}

function slugSegment(value) {
  let slug = String(value || '').normalize('NFKC').toLowerCase().trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 64);
  if (!slug || slug === '.' || slug === '..') slug = 'page';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(slug)) slug = '_' + slug;
  return slug;
}

function hashId(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const MAX_ARCHIVE_FILENAME_CODEPOINTS = 128;
const ARCHIVE_CATEGORIES = new Set(['guides', 'components', 'form']);

function storyIdFilenameBase(id, suffix = '') {
  let normalized = String(id || '').normalize('NFKC').toLowerCase()
    .replace(/[\\/]/g, '-')
    .replace(/[:*?"<>|\u0000-\u001f\u007f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '-')
    .replace(/\.{2,}/g, '-')
    .replace(/^\.+|\.+$/g, '');
  const suffixLength = [...suffix].length;
  const baseLimit = Math.max(1, MAX_ARCHIVE_FILENAME_CODEPOINTS - 4 - suffixLength);
  const meaningfulSuffix = normalized.endsWith('--docs') ? '--docs' : '';
  const stem = meaningfulSuffix ? normalized.slice(0, -meaningfulSuffix.length) : normalized;
  const stemLimit = Math.max(0, baseLimit - [...meaningfulSuffix].length);
  let boundedStem = [...stem].slice(0, stemLimit).join('').replace(/^[-.]+|[-. ]+$/g, '');
  if (!boundedStem && !meaningfulSuffix) boundedStem = 'page';
  let base = `${boundedStem}${meaningfulSuffix}`;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(base)) base = `_${base}`;
  return `${base}${suffix}`;
}

function compareEntriesByIdentity(a, b) {
  const left = [a.id, a.title, a.name, a.importPath].map((value) => String(value || '')).join('\u0000');
  const right = [b.id, b.title, b.name, b.importPath].map((value) => String(value || '')).join('\u0000');
  return left < right ? -1 : left > right ? 1 : 0;
}

function bucketsBy(records, keyFor) {
  const buckets = new Map();
  for (const record of records) {
    const key = keyFor(record);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(record);
  }
  return buckets;
}

function assignPaths(entries) {
  const records = entries.map((entry) => {
    const classification = categoryFor(entry);
    return { entry, classification, category: classification.category, plainBase: storyIdFilenameBase(entry.id), collisionSuffix: '', collisionRound: 0, collisionOrdinal: 0 };
  });

  for (const bucket of bucketsBy(records, (record) => `${record.category}/${record.plainBase}`).values()) {
    if (bucket.length < 2) continue;
    for (const record of bucket) record.collisionSuffix = `--${hashId(record.entry.id)}`;
  }

  const pathFor = (record) => `${record.category}/${storyIdFilenameBase(record.entry.id, record.collisionSuffix)}.md`;
  // Resolve even the unlikely case where a generated hash suffix collides with
  // another sanitized ID. Sort by original metadata so completion order cannot
  // determine the filename.
  for (let pass = 0; pass < 16; pass++) {
    const collisions = [...bucketsBy(records, pathFor).values()].filter((bucket) => bucket.length > 1);
    if (!collisions.length) break;
    for (const bucket of collisions) {
      bucket.sort((a, b) => compareEntriesByIdentity(a.entry, b.entry));
      bucket.forEach((record, index) => {
        record.collisionRound += 1;
        record.collisionOrdinal = index + 1;
        record.collisionSuffix = `--${hashId(record.entry.id)}-${record.collisionOrdinal}${record.collisionRound > 1 ? `-${record.collisionRound}` : ''}`;
      });
    }
    if (pass === 15 && [...bucketsBy(records, pathFor).values()].some((bucket) => bucket.length > 1)) {
      throw new Error('Could not create unique Markdown paths for colliding Storybook IDs.');
    }
  }

  for (const record of records) {
    const { entry, classification, category } = record;
    const path = pathFor(record);
    entry.category = category;
    entry.categorySource = classification.source;
    entry.categoryConfidence = classification.confidence;
    entry.categoryEvidence = classification.evidence;
    entry.path = path;
    entry.titleSource = entry.title ? 'index-title' : entry.name ? 'index-name' : 'storybook-id';
    entry.title = entry.title || entry.name || entry.id;
  }
}

function normalizeOptions(options) {
  return { props: options?.props !== false, tokens: options?.tokens !== false, examples: options?.examples !== false };
}

async function discover(tabId, sourceUrl) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (source) => {
      const current = new URL(source);
      const base = new URL('.', current);
      const candidates = [new URL('index.json', base), new URL('stories.json', base), new URL('/index.json', current.origin), new URL('/stories.json', current.origin)];
      const seen = new Set();
      for (const url of candidates) {
        if (seen.has(url.href)) continue;
        seen.add(url.href);
        try {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (!response.ok) continue;
          const json = await response.json();
          const entries = json.entries || json.stories || {};
          return { indexUrl: url.href, entries: Object.entries(entries).map(([id, entry]) => ({
            id,
            type: entry.type || (entry.isDocsOnly ? 'docs' : ''),
            title: entry.title || entry.kind || '',
            name: entry.name || '',
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            importPath: entry.importPath || '',
          })).filter((entry) => entry.type === 'docs') };
        } catch { /* Probe the next supported index path. */ }
      }
      return { indexUrl: '', entries: [] };
    },
    args: [sourceUrl],
  });
  const payload = result[0]?.result || { indexUrl: '', entries: [] };
  return { indexUrl: payload.indexUrl, entries: payload.entries.slice(0, MAX_PAGES), discovered: payload.entries.length };
}

function buildDocsUrl(sourceUrl, id) {
  const target = new URL(sourceUrl);
  target.searchParams.set('path', `/docs/${id}`);
  target.search = target.search.replace(/([?&]path=)%2Fdocs%2F/i, '$1/docs/');
  target.hash = '';
  return target.href;
}

function matchesDocsUrl(url, target) {
  try {
    const actual = new URL(url);
    const expected = new URL(target);
    return actual.origin === expected.origin && actual.pathname === expected.pathname && actual.searchParams.get('path') === expected.searchParams.get('path');
  } catch { return false; }
}

function navigateTab(tabId, target) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      error ? reject(error) : resolve();
    };
    const listener = (updatedId, info, tab) => {
      if (updatedId === tabId && info.status === 'complete' && matchesDocsUrl(tab.url || '', target)) finish();
    };
    const timer = setTimeout(() => finish(new Error(`Navigation timed out: ${target}`)), NAVIGATION_TIMEOUT_MS);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.update(tabId, { url: target }).then(async () => {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete' && matchesDocsUrl(tab.url || '', target)) finish();
    }).catch(finish);
  });
}

function inspectDocsReadiness(expectedId) {
  const params = new URLSearchParams(location.search);
  const route = params.get('path') || '';
  const iframeId = params.get('id') || '';
  const viewMode = params.get('viewMode') || '';
  const routeId = route.replace(/^\/docs\//, '');
  const id = routeId || iframeId;
  const routeMatches = routeId === expectedId || (viewMode === 'docs' && iframeId === expectedId);
  const rootSelectors = ['.sbdocs-wrapper', '.sbdocs-content', '#storybook-docs', '[data-testid="storybook-docs"]'];
  const matchedRootSelector = rootSelectors.find((selector) => document.querySelector(selector)) || '';
  const root = matchedRootSelector ? document.querySelector(matchedRootSelector) : null;
  if (!root || !routeMatches) return { ready: false, id, route, viewMode, matchedRootSelector, length: 0, busySelectors: [], reason: !routeMatches ? 'entry-id-mismatch' : 'docs-root-absent' };
  const value = String(root.innerText || root.textContent || '').replace(/\s+/g, ' ').trim();
  const busySelectors = [];
  if (root.matches?.('[aria-busy="true"]')) busySelectors.push('[aria-busy="true"] (root)');
  for (const selector of ['[aria-busy="true"]', '.sb-preparing-story', '[data-testid*="loading"]', '[data-testid*="loader"]']) {
    if (root.querySelector(selector) && !busySelectors.some((item) => item.startsWith(selector))) busySelectors.push(selector);
  }
  const placeholderOnly = /^(loading(?:\s+docs)?[.…]*|preparing story[.…]*)$/i.test(value);
  // Storybook can leave a stale busy marker beside fully rendered Docs text.
  // Matching ID, substantive text and stability are the readiness authority;
  // busy selectors remain diagnostic evidence rather than an unconditional veto.
  const substantive = value.length > 0 && !placeholderOnly;
  let textHash = 2166136261;
  for (let index = 0; index < value.length; index++) textHash = Math.imul(textHash ^ value.charCodeAt(index), 16777619);
  return {
    ready: routeMatches && Boolean(root) && substantive,
    id,
    route,
    viewMode,
    matchedRootSelector,
    length: value.length,
    busySelectors,
    reason: substantive ? (busySelectors.length ? 'content-visible-with-busy-marker' : 'content-visible') : 'content-empty-or-placeholder',
    signature: `${document.title}|${value.length}|${textHash >>> 0}`,
  };
}

async function waitForDocsReady(tabId, entry) {
  const started = now();
  let previous = '';
  let stableCount = 0;
  let lastFrames = [];
  let samples = [];
  while (now() - started < READINESS_TIMEOUT_MS) {
    if (job.cancelRequested) throw new Error('Cancelled after active page settled.');
    const results = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: inspectDocsReadiness, args: [entry.id] });
    lastFrames = results.map((result) => ({ frameId: result.frameId, ...(result.result || {}) }));
    const probes = lastFrames.filter((result) => result.ready);
    probes.sort((a, b) => a.frameId - b.frameId);
    if (probes.length) {
      const selected = probes[0];
      const signature = `${selected.frameId}:${selected.id}:${selected.matchedRootSelector}:${selected.signature}`;
      stableCount = signature === previous ? stableCount + 1 : 1;
      previous = signature;
      samples = [...samples, { sample: stableCount, frameId: selected.frameId, id: selected.id, rootSelector: selected.matchedRootSelector, textLength: selected.length, busySelectors: selected.busySelectors }].slice(-3);
      if (stableCount >= 3) return { ...selected, frameId: selected.frameId, stabilizationSamples: samples };
    } else {
      previous = '';
      stableCount = 0;
      samples = [];
    }
    await new Promise((resolve) => setTimeout(resolve, READINESS_POLL_MS));
  }
  const frameSummary = lastFrames.map(({ frameId, id, route, viewMode, matchedRootSelector, length, busySelectors, reason }) =>
    `frame ${frameId}: id=${id || 'none'}, route=${route || 'none'}, viewMode=${viewMode || 'none'}, root=${matchedRootSelector || 'none'}, text=${length || 0}, busy=${busySelectors?.join(',') || 'none'}, reason=${reason || 'unknown'}`,
  ).join('; ').slice(0, 900);
  throw new Error(`Docs readiness timed out after ${READINESS_TIMEOUT_MS / 1000}s (expected ID: ${entry.id}). Last frame probes: ${frameSummary || 'none'}`);
}

async function extractFromTab(tabId, options, expectedId = '', frameId = undefined) {
  const target = frameId === undefined ? { tabId, allFrames: true } : { tabId, frameIds: [frameId] };
  const results = await chrome.scripting.executeScript({ target, func: extractStorybookDocument, args: [options] });
  const pages = results.map((result) => ({ frameId: result.frameId, ...(result.result || {}) })).filter((page) => page.title || page.contentLength);
  if (!pages.length) throw new Error('No readable frame. Check site permissions and Docs readiness.');
  pages.sort((a, b) => Number(b.foundDocs) - Number(a.foundDocs) || Number(a.frameId) - Number(b.frameId) || b.contentLength - a.contentLength);
  const page = pages[0];
  if (expectedId && (!page.foundDocs || page.storyId !== expectedId)) throw new Error(`Storybook Docs content mismatch (expected ${expectedId}, found ${page.storyId || 'unknown'}).`);
  return page;
}

async function closeWorkerTabs() {
  if (!job?.tabIds?.length) return { ok: true, remaining: [] };
  const ids = [...job.tabIds];
  const remaining = [];
  for (const id of ids) {
    await chrome.tabs.remove(id).catch(() => {});
    try { if (await chrome.tabs.get(id)) remaining.push(id); } catch { /* The owned tab is gone. */ }
  }
  job.tabIds = job.tabIds.filter((id) => !ids.includes(id)).concat(remaining);
  if (!remaining.length) job.cleanupCompletedAt = now();
  await persist();
  return { ok: remaining.length === 0, remaining };
}

async function makeSlot() {
  const tab = await chrome.tabs.create({ url: 'about:blank', active: false });
  job.tabIds.push(tab.id);
  await persist();
  return tab.id;
}

async function processEntry(entry, tabId) {
  entry.status = 'running';
  entry.attempts = (entry.attempts || 0) + 1;
  entry.startedAt = now();
  entry.error = '';
  entry.history ||= [];
  entry.history.push({ attempt: entry.attempts, status: 'running', startedAt: entry.startedAt });
  job.currentPage = { id: entry.id, title: entry.title };
  job.state = 'crawling';
  job.phase = `Loading ${entry.title}`;
  await notifyPopup();
  const target = buildDocsUrl(job.sourceUrl, entry.id);
  await navigateTab(tabId, target);
  const readiness = await waitForDocsReady(tabId, entry);
  if (job.cancelRequested) throw new Error('Cancelled after active page settled.');
  const page = await extractFromTab(tabId, job.options, entry.id, readiness.frameId);
  page.readiness = { frameId: readiness.frameId, entryId: readiness.id, rootSelector: readiness.matchedRootSelector, textLength: readiness.length, stabilizationSamples: readiness.stabilizationSamples, busySelectors: readiness.busySelectors };
  page.entryId = entry.id;
  page.entryTitle = entry.title;
  page.entryName = entry.name;
  page.entryTags = entry.tags;
  page.sourceUrl = page.url;
  page.category = entry.category;
  page.categorySource = entry.categorySource;
  page.categoryConfidence = entry.categoryConfidence;
  page.categoryEvidence = entry.categoryEvidence;
  page.path = entry.path;
  page.frameId = page.frameId ?? 0;
  entry.page = page;
  entry.status = 'succeeded';
  entry.completedAt = now();
  entry.history.at(-1).status = 'succeeded';
  entry.history.at(-1).completedAt = entry.completedAt;
  job.lastError = '';
  await notifyPopup();
}

async function crawlPool() {
  let cursor = 0;
  const pending = job.entries.map((entry, index) => entry.status === 'queued' || entry.status === 'retrying' ? index : -1).filter((index) => index >= 0);
  const width = Math.max(1, Math.min(3, Number(job.concurrency) || DEFAULT_CONCURRENCY));
  const worker = async () => {
    let tabId;
    while (!job.pauseRequested && !job.cancelRequested) {
      const workIndex = pending[cursor++];
      if (workIndex === undefined) return;
      const entry = job.entries[workIndex];
      try {
        tabId ||= await makeSlot();
        if (job.pauseRequested || job.cancelRequested) return;
        await processEntry(entry, tabId);
      } catch (error) {
        if (job.cancelRequested) {
          entry.status = 'queued';
          entry.error = '';
          if (entry.history?.length) {
            entry.history.at(-1).status = 'cancelled';
            entry.history.at(-1).completedAt = now();
          }
        } else {
          entry.status = 'failed';
          entry.error = errorText(error);
          entry.completedAt = now();
          if (entry.history?.length) {
            entry.history.at(-1).status = 'failed';
            entry.history.at(-1).error = entry.error;
            entry.history.at(-1).completedAt = entry.completedAt;
          }
          job.lastError = `${entry.id}: ${entry.error}`;
          await notifyPopup();
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(width, pending.length || 1) }, () => worker()));
}

function zipFilesFor(jobSnapshot) {
  // Recompute from the stable Storybook IDs so a recovered pre-upgrade job
  // cannot emit its former display-name/hash paths.
  assignPaths(jobSnapshot.entries);
  for (const entry of jobSnapshot.entries) if (entry.page) entry.page.path = entry.path;
  const successful = jobSnapshot.entries.filter((entry) => entry.status === 'succeeded' && entry.page);
  const tokens = new Map();
  const tokenContext = (token, page) => token.context || page.tokenContext || { theme: 'unknown', colorScheme: 'unknown' };
  const tokenIdentity = (token) => token.identity || (token.name ? `css-custom-property:${token.name}` : `computed-style:${token.label || 'unknown'}`);
  const tokenValue = (token) => token.name ? token.value : { color: token.color || '', background: token.background || '', font: token.font || '', fontSize: token.fontSize || '', radius: token.radius || '' };
  const tokenGroupKey = (token, page) => JSON.stringify([tokenIdentity(token), tokenContext(token, page)]);
  const tokenKey = (token, page) => JSON.stringify([tokenIdentity(token), tokenContext(token, page), tokenValue(token)]);
  for (const entry of successful) {
    for (const token of entry.page.tokens || []) {
      const key = tokenKey(token, entry.page);
      if (!tokens.has(key)) tokens.set(key, { ...token, identity: tokenIdentity(token), context: tokenContext(token, entry.page), kind: token.name ? 'css-custom-property' : 'computed-style', sources: [] });
      const source = { id: entry.id, path: entry.path, url: entry.page.sourceUrl, frameId: entry.page.frameId };
      if (!tokens.get(key).sources.some((existing) => existing.id === source.id && existing.frameId === source.frameId)) tokens.get(key).sources.push(source);
    }
  }
  const valuesByIdentityContext = new Map();
  for (const [key, token] of tokens) {
    const groupKey = tokenGroupKey(token, { tokenContext: token.context });
    if (!valuesByIdentityContext.has(groupKey)) valuesByIdentityContext.set(groupKey, new Map());
    valuesByIdentityContext.get(groupKey).set(JSON.stringify(tokenValue(token)), key);
  }
  for (const token of tokens.values()) {
    const variants = [...valuesByIdentityContext.get(tokenGroupKey(token, { tokenContext: token.context })).keys()];
    token.conflict = variants.length > 1;
    if (token.conflict) token.conflictValues = variants.map((value) => JSON.parse(value));
  }
  const manifestEntries = jobSnapshot.entries.map(({ id, type, title, titleSource, name, tags, importPath, category, categorySource, categoryConfidence, categoryEvidence, path, status, attempts, error, history, page }) => ({
    id, type, title, titleSource, name, tags, importPath, category, categorySource, categoryConfidence, categoryEvidence, path, status, attempts, error: error || '', history: history || [], readiness: page?.readiness || null, sourceUrl: page?.sourceUrl || buildDocsUrl(jobSnapshot.sourceUrl, id),
  }));
  const manifest = {
    schemaVersion: 1,
    exporterVersion: '0.3.0',
    jobId: jobSnapshot.id,
    sourceOrigin: new URL(jobSnapshot.sourceUrl).origin,
    sourceUrl: jobSnapshot.sourceUrl,
    indexUrl: jobSnapshot.indexUrl,
    startedAt: new Date(jobSnapshot.startedAt).toISOString(),
    completedAt: new Date().toISOString(),
    options: jobSnapshot.options,
    concurrency: jobSnapshot.concurrency,
    categoryFolders: ['guides', 'components', 'form'],
    unknownCategoryFallback: { folder: 'components', confidence: 'low', evidenceRecordedPerEntry: true },
    counts: { discovered: jobSnapshot.discoveredCount, selected: jobSnapshot.entries.length, succeeded: successful.length, failed: jobSnapshot.entries.length - successful.length, omitted: Math.max(0, jobSnapshot.discoveredCount - jobSnapshot.entries.length) },
    entries: manifestEntries,
    tokenObservations: [...tokens.values()].sort((a, b) => a.identity.localeCompare(b.identity) || JSON.stringify(a.context).localeCompare(JSON.stringify(b.context)) || JSON.stringify(tokenValue(a)).localeCompare(JSON.stringify(tokenValue(b)))),
  };
  const indexLines = ['# Storybook Docs index', '', `Source: ${jobSnapshot.sourceUrl}`, '', '## Pages', ''];
  for (const category of ['guides', 'components', 'form']) {
    const group = successful.filter((entry) => entry.category === category);
    if (!group.length) continue;
    indexLines.push(`### ${category}`, '');
    for (const entry of group) indexLines.push(`- [${entry.title.replace(/[\[\]]/g, '\\$&')}](${entry.path}) — ID: \`${entry.id}\` · [Source](${entry.page.sourceUrl})`);
    indexLines.push('');
  }
  indexLines.push('- [Shared observed tokens](tokens/design-tokens.md)', '- [Extraction report](EXTRACTION_REPORT.md)', '');
  const failures = jobSnapshot.entries.filter((entry) => entry.status === 'failed');
  const reportLines = ['# Extraction report', '', `Job: \`${jobSnapshot.id}\``, `Source: ${jobSnapshot.sourceUrl}`, `Discovered: ${jobSnapshot.discoveredCount}`, `Selected: ${jobSnapshot.entries.length}`, `Succeeded: ${successful.length}`, `Failed: ${failures.length}`, `Omitted by cap: ${Math.max(0, jobSnapshot.discoveredCount - jobSnapshot.entries.length)}`, '', '## Page outcomes', ''];
  for (const entry of jobSnapshot.entries) {
    const outcomes = (entry.history || []).map((attempt) => `#${attempt.attempt} ${attempt.status}${attempt.error ? ` (${attempt.error})` : ''}`).join(', ');
    const pageReference = entry.status === 'succeeded' && entry.path ? `; page: [${entry.path}](${entry.path})` : entry.path ? `; intended path: \`${entry.path}\`` : '';
    reportLines.push(`- \`${entry.id}\` (${entry.title}): ${entry.status}; category ${entry.category} (${entry.categoryConfidence || 'unknown'} confidence: ${entry.categoryEvidence || 'no evidence recorded'})${pageReference}${outcomes ? `; attempts: ${outcomes}` : `; attempts ${entry.attempts || 0}`}${entry.error ? `; latest error: ${entry.error}` : ''}`);
  }
  reportLines.push('', '> Token and computed-style values are observations from rendered pages, not confirmed canonical design tokens.', '');
  const files = [
    { path: 'guides/', content: '' },
    { path: 'components/', content: '' },
    { path: 'form/', content: '' },
    { path: 'tokens/', content: '' },
    { path: 'README.md', content: `# Storybook Docs export\n\nSource: ${jobSnapshot.sourceUrl}\n\nThis archive contains rendered Docs observations. It does not infer unavailable component metadata, prop types, or defaults. Docs entries without recognized category metadata are routed to \`components/\` with low-confidence fallback evidence in the manifest and extraction report.\n\nToken and computed-style observations are not canonical design-token claims. See [INDEX.md](INDEX.md), [tokens/design-tokens.md](tokens/design-tokens.md), and [EXTRACTION_REPORT.md](EXTRACTION_REPORT.md).\n` },
    { path: 'INDEX.md', content: indexLines.join('\n') },
    { path: 'manifest.json', content: JSON.stringify(manifest, null, 2) + '\n' },
    { path: 'EXTRACTION_REPORT.md', content: reportLines.join('\n') },
    { path: 'tokens/README.md', content: '# Shared token observations\n\nValues below are observations, not canonical design tokens. Each row preserves source page provenance.\n' },
    { path: 'tokens/design-tokens.md', content: renderTokens([...tokens.values()]) },
  ];
  for (const entry of successful) files.push({ path: entry.path, content: renderStoryPage(entry.page, jobSnapshot.options) });
  for (const entry of successful) {
    const segments = String(entry.path || '').split('/');
    if (segments.length !== 2 || !ARCHIVE_CATEGORIES.has(segments[0]) || segments[1] === '.' || segments[1] === '..' || !segments[1].endsWith('.md') || [...segments[1]].length > MAX_ARCHIVE_FILENAME_CODEPOINTS) {
      throw new Error(`Unsafe generated Markdown path for Storybook ID ${entry.id}: ${entry.path || '(empty)'}`);
    }
  }
  const archivePaths = new Set();
  for (const file of files) {
    if (archivePaths.has(file.path)) throw new Error(`Duplicate archive member path: ${file.path}`);
    archivePaths.add(file.path);
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function renderTokens(tokens) {
  const lines = ['# Observed design token and style values', '', '> These are runtime observations, not confirmed canonical design tokens.', ''];
  for (const token of tokens.sort((a, b) => a.identity.localeCompare(b.identity) || JSON.stringify(a.context).localeCompare(JSON.stringify(b.context)) || JSON.stringify(tokenValueForRender(a)).localeCompare(JSON.stringify(tokenValueForRender(b))))) {
    const value = token.name ? token.value : [token.color, token.background, token.font, token.fontSize, token.radius].filter(Boolean).join('; ');
    lines.push(`## ${token.identity || token.name || token.label || 'Unlabelled computed style'}`, '', `- Kind: ${token.kind}`, `- Value: ${String(value || '').replace(/\n/g, ' ')}`, `- Context: theme=${token.context?.theme || 'unknown'}; color-scheme=${token.context?.colorScheme || 'unknown'}`);
    if (token.conflict) lines.push('- Conflict: this identity and context were observed with multiple values.');
    lines.push('- Sources:');
    for (const source of token.sources) lines.push(`  - [${source.id}](../${source.path}) · frame ${source.frameId} · ${source.url}`);
    lines.push('');
  }
  return lines.join('\n');
}

function tokenValueForRender(token) {
  return token.name ? token.value : [token.color || '', token.background || '', token.font || '', token.fontSize || '', token.radius || ''];
}

function renderStoryPage(page, options) {
  const lines = [`# ${page.title || page.entryTitle}`, '', `Storybook ID: \`${page.entryId}\``, `Source: ${page.sourceUrl}`, `Category: ${page.category} (${page.categoryConfidence || 'unknown'} confidence)`, `Category evidence: ${page.categoryEvidence || 'No category evidence recorded.'}`, `Frame: ${page.frameId}`, ''];
  if (page.description?.length) lines.push('## Description', '', ...page.description.map((text) => md(text)), '');
  if (page.headings?.length) lines.push('## Sections', '', ...page.headings.map((heading) => `${'  '.repeat(Math.max(0, heading.level - 2))}- ${md(heading.text)}`), '');
  const tableGroups = [
    ['Props and variants', options.props ? page.propsTables || [] : []],
    ['Rendered tables', options.props ? page.renderedTables || [] : []],
    ['Unclassified tables', options.props ? page.unknownTables || [] : []],
  ];
  for (const [title, tables] of tableGroups) for (const table of tables) {
    lines.push(`## ${title}`, '', `Observed classification: ${table.classification} (${table.confidence})`, `Evidence: ${table.reason}`, '');
    lines.push(...renderTable(table.rows), '');
  }
  if (options.examples && page.examples?.length) {
    lines.push('## Examples', '');
    for (const example of page.examples) {
      const sample = typeof example === 'string' ? example : example.code;
      const ticks = Math.max(2, ...[...(sample.matchAll(/`+/g))].map((match) => match[0].length)) + 1;
      const fence = '`'.repeat(Math.max(3, ticks));
      lines.push(`${fence}${example.language ? example.language : ''}`, sample, fence, '');
    }
  }
  if (options.examples && page.guidelines?.length) {
    lines.push('## Guidelines and notes', '');
    for (const item of page.guidelines) lines.push(`### ${md(item.heading || 'Observed guidance')}`, '', item.text, '');
  }
  return lines.join('\n');
}

function renderTable(rows) {
  if (!rows?.length) return ['(No table rows were returned.)'];
  const width = Math.max(1, ...rows.map((row) => row.length));
  const lines = [`| ${Array.from({ length: width }, (_, index) => cell(rows[0][index])).join(' | ')} |`, `| ${Array(width).fill('---').join(' | ')} |`];
  for (const row of rows.slice(1)) lines.push(`| ${Array.from({ length: width }, (_, index) => cell(row[index])).join(' | ')} |`);
  return lines;
}

function md(value) { return String(value ?? '').replace(/([\\`*_{}\[\]<>])/g, '\\$1').trim(); }
function cell(value) { return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim(); }

async function createZipUrl(files) {
  // The ZIP writer is pure JavaScript, but URL.createObjectURL is unavailable in extension service workers.
  // Keep the Blob/object-URL step in this bundled offscreen document for the downloads API handoff.
  let exists = false;
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL('offscreen.html')] });
    exists = contexts.length > 0;
  } else {
    const clientsList = await clients.matchAll();
    exists = clientsList.some((client) => client.url === chrome.runtime.getURL('offscreen.html'));
  }
  if (!exists) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['BLOBS'], justification: 'Package user-requested local export files into one ZIP download.' });
  const response = await chrome.runtime.sendMessage({ action: 'MAKE_ZIP', files });
  if (!response?.ok) throw new Error(response?.error || 'ZIP packaging failed.');
  return response.url;
}

async function waitForDownload(downloadId, url) {
  const getState = async () => {
    const results = await chrome.downloads.search({ url });
    const item = results.find((candidate) => candidate.id === downloadId);
    return item?.state || 'in_progress';
  };
  const initial = await getState();
  if (initial === 'complete' || initial === 'interrupted') return initial;
  return new Promise((resolve) => {
    const listener = (delta) => {
      if (delta.id !== downloadId || !['complete', 'interrupted'].includes(delta.state?.current)) return;
      chrome.downloads.onChanged.removeListener(listener);
      resolve(delta.state.current);
    };
    chrome.downloads.onChanged.addListener(listener);
    getState().then((state) => {
      if (state === 'complete' || state === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
        resolve(state);
      }
    }).catch(() => {});
  });
}

async function releaseArchiveUrl(url) {
  if (!url) return closeOffscreenDocument();
  try {
    await chrome.runtime.sendMessage({ action: 'REVOKE_URL', url });
    if (chrome.runtime.getContexts) {
      const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL('offscreen.html')] });
      if (contexts.length) await chrome.offscreen.closeDocument();
    } else {
      const clientsList = await clients.matchAll();
      if (clientsList.some((client) => client.url === chrome.runtime.getURL('offscreen.html'))) await chrome.offscreen.closeDocument();
    }
  } catch { /* A later extension startup can close the remaining offscreen context. */ }
}

async function closeOffscreenDocument() {
  try {
    if (chrome.runtime.getContexts) {
      const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL('offscreen.html')] });
      if (contexts.length) await chrome.offscreen.closeDocument();
    } else {
      const clientsList = await clients.matchAll();
      if (clientsList.some((client) => client.url === chrome.runtime.getURL('offscreen.html'))) await chrome.offscreen.closeDocument();
    }
  } catch { /* The offscreen document may already be gone. */ }
}

async function downloadCurrent(message) {
  const options = normalizeOptions(message.options);
  const page = await extractFromTab(message.tabId, options);
  const output = renderCurrent([page], options, new URL(message.tabUrl).origin, page.foundDocs ? [] : ['Storybook Docs wrapper not detected; extracted general page content.']);
  const filename = `storybook-current-${slugSegment(new URL(message.tabUrl).hostname)}-${new Date().toISOString().slice(0, 10)}.md`;
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(output)}`;
  await chrome.downloads.download({ url, filename, saveAs: true, conflictAction: 'uniquify' });
  return { filename, pages: 1, preview: output.slice(0, 8000) };
}

function validateFigmaCssArchive(files, filename) {
  if (!Array.isArray(files) || files.length < 6 || files.length > 65535) throw new Error('Figma CSS archive has an invalid file list.');
  if (typeof filename !== 'string' || !/^figma-css-[\p{L}\p{N}_-]{1,80}\.zip$/u.test(filename)) throw new Error('Figma CSS archive filename is unsafe.');
  const required = new Set(['README.md', 'INDEX.md', 'manifest.json', 'EXTRACTION_REPORT.md', 'source/original.css', 'tokens/observed-values.md']);
  const paths = new Set();
  const encoder = new TextEncoder();
  let byteLength = 0;
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') throw new Error('Figma CSS archive contains an invalid file record.');
    const isRootMember = ['README.md', 'INDEX.md', 'manifest.json', 'EXTRACTION_REPORT.md'].includes(file.path);
    const isSource = file.path === 'source/original.css';
    const isTokens = file.path === 'tokens/observed-values.md';
    const isLayer = /^layers\/\d{4,}-[\p{L}\p{N}_-]{1,64}\.md$/u.test(file.path);
    if (!isRootMember && !isSource && !isTokens && !isLayer) throw new Error(`Figma CSS archive contains an unsafe path: ${file.path}`);
    if (paths.has(file.path)) throw new Error(`Figma CSS archive contains a duplicate path: ${file.path}`);
    paths.add(file.path);
    required.delete(file.path);
    byteLength += encoder.encode(file.content).length;
    if (byteLength > 16_000_000) throw new Error('Figma CSS archive exceeds the local 16 MB package limit.');
  }
  if (required.size) throw new Error(`Figma CSS archive is missing required files: ${[...required].join(', ')}`);
  if (![...paths].some((archivePath) => archivePath.startsWith('layers/'))) throw new Error('Figma CSS archive contains no layer pages.');
}

async function downloadFigmaCss(message) {
  await loadJob();
  if (figmaCssExportActive || currentExport) return { ok: false, error: 'Another extension export is already running.' };
  if (job && ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state)) return { ok: false, error: 'Finish or pause the active Storybook export before creating a Figma CSS ZIP.' };
  validateFigmaCssArchive(message.files, message.filename);
  figmaCssExportActive = true;
  let url = '';
  try {
    url = await createZipUrl(message.files);
    const downloadId = await chrome.downloads.download({ url, filename: message.filename, saveAs: true, conflictAction: 'uniquify' });
    const state = await waitForDownload(downloadId, url);
    if (state !== 'complete') throw new Error('Chrome interrupted the Figma CSS ZIP download.');
    return { ok: true, filename: message.filename };
  } finally {
    if (url) await releaseArchiveUrl(url);
    else await closeOffscreenDocument();
    figmaCssExportActive = false;
  }
}

function renderCurrent(pages, options, origin, warnings) {
  const lines = ['# Storybook Design System', '', `Source: ${origin}`, `Extracted: ${new Date().toISOString()}`, `Pages: ${pages.length}`, '', '> Content is extracted from rendered Storybook Docs, not inferred from source code.', ''];
  for (const page of pages) lines.push(`## ${md(page.title)}`, '', `Source: ${page.url}`, '', ...(page.description.length ? ['### Description', '', ...page.description.map(md), ''] : []), ...(page.headings.length ? ['### Sections', '', ...page.headings.map((heading) => `${' '.repeat(Math.max(0, heading.level - 2) * 2)}- ${md(heading.text)}`), ''] : []), ...(options.props ? page.tables.flatMap((table, index) => [`### Table ${index + 1}`, '', ...renderTable(table.rows || table), '']) : []), ...(options.tokens && page.tokens.length ? ['### Observed design tokens / styles', '', '| Name / label | Value / computed style |', '| --- | --- |', ...page.tokens.map((token) => `| ${cell(token.name || token.label)} | ${cell(token.name ? token.value : [token.color, token.background, token.font, token.fontSize, token.radius].filter(Boolean).join('; '))} |`), '', '> Computed styles are observations, not confirmed canonical design tokens.', ''] : []), ...(options.examples && page.examples.length ? ['### Code examples', '', ...page.examples.flatMap((example) => { const sample = typeof example === 'string' ? example : example.code; const fence = '`'.repeat(Math.max(3, ...[...(sample.matchAll(/`+/g))].map((match) => match[0].length + 1))); return [fence, sample, fence, '']; })] : []), ...(options.examples && page.guidelines.length ? ['### Lists and guidelines (observed)', '', ...page.guidelines.map((item) => `- ${md(typeof item === 'string' ? item : item.text)}`), ''] : []));
  if (warnings.length) lines.push('## Extraction warnings', '', ...warnings.map((warning) => `- ${md(warning)}`), '');
  return lines.join('\n');
}

async function runAll() {
  if (runner) return runner;
  runner = (async () => {
    try {
      if (job.cancelRequested) {
        const cleanup = await closeWorkerTabs();
        const state = cleanup.ok ? 'cancelled' : 'failed';
        await updateJob({ state, phase: cleanup.ok ? 'Cancelled; temporary tabs closed' : `Cancellation cleanup failed for tabs ${cleanup.remaining.join(', ')}`, currentPage: null, cancelRequested: false });
        return;
      }
      if (job.state === 'discovering') {
        const found = await discover(job.sourceTabId, job.sourceUrl);
        job.indexUrl = found.indexUrl;
        job.discoveredCount = found.discovered;
        job.entries = found.entries;
        if (job.discoveredCount > MAX_PAGES) job.warnings.push(`Limited to first ${MAX_PAGES} of ${job.discoveredCount} Docs entries.`);
        assignPaths(job.entries);
        for (const entry of job.entries) { entry.status = 'queued'; entry.attempts = 0; entry.error = ''; }
        await updateJob({ state: 'crawling', phase: `Crawling ${job.entries.length} Docs entries`, currentPage: null });
        if (!job.entries.length) throw new Error('No Docs entries found in the Storybook index.');
      }
      if (job.cancelRequested) {
        const cleanup = await closeWorkerTabs();
        const state = cleanup.ok ? 'cancelled' : 'failed';
        await updateJob({ state, phase: cleanup.ok ? 'Cancelled; temporary tabs closed' : `Cancellation cleanup failed for tabs ${cleanup.remaining.join(', ')}`, currentPage: null, cancelRequested: false });
        return;
      }
      if (job.state === 'compressing' && job.downloadId && job.downloadUrl) {
        const downloadState = await waitForDownload(job.downloadId, job.downloadUrl);
        await releaseArchiveUrl(job.downloadUrl);
        if (job.cancelRequested || downloadState === 'interrupted') {
          const cancelled = job.cancelRequested;
          await updateJob({ state: cancelled ? 'cancelled' : 'failed', phase: cancelled ? 'Cancelled; temporary tabs closed' : 'ZIP download failed', currentPage: null, cancelRequested: false, downloadId: null, downloadUrl: '', lastError: cancelled ? '' : 'Chrome interrupted the ZIP download.' });
        } else {
          discardExtractedContent();
          await updateJob({ state: 'completed', phase: 'ZIP download completed; extracted page checkpoints deleted', currentPage: null, completedAt: now(), downloadId: null, downloadUrl: '' });
        }
        return;
      }
      if (job.state === 'compressing' && job.downloadUrl && !job.downloadId) {
        await releaseArchiveUrl(job.downloadUrl);
        job.downloadUrl = '';
      }
      await crawlPool();
      if (job.pauseRequested) {
        const cleanup = await closeWorkerTabs();
        if (!cleanup.ok) throw new Error(`Could not close temporary tabs: ${cleanup.remaining.join(', ')}`);
        await updateJob({ state: 'paused', phase: 'Paused; temporary tabs closed', currentPage: null, pauseRequested: false });
        return;
      }
      if (job.cancelRequested) {
        const cleanup = await closeWorkerTabs();
        const state = cleanup.ok ? 'cancelled' : 'failed';
        await updateJob({ state, phase: cleanup.ok ? 'Cancelled; temporary tabs closed' : `Cancellation cleanup failed for tabs ${cleanup.remaining.join(', ')}`, currentPage: null, cancelRequested: false });
        return;
      }
      const cleanup = await closeWorkerTabs();
      if (!cleanup.ok) throw new Error(`Could not close temporary tabs: ${cleanup.remaining.join(', ')}`);
      await updateJob({ state: 'processing', phase: 'Classifying pages and deduplicating token observations', currentPage: null });
      const files = zipFilesFor(job);
      await updateJob({ state: 'compressing', phase: 'Building ZIP archive (uncompressed entries)', currentPage: null, downloadId: null, downloadUrl: '' });
      const url = await createZipUrl(files);
      if (job.cancelRequested) {
        await releaseArchiveUrl(url);
        await updateJob({ state: 'cancelled', phase: 'Cancelled; temporary tabs closed', currentPage: null, cancelRequested: false });
        return;
      }
      await updateJob({ downloadUrl: url });
      const filename = `storybook-all-${slugSegment(new URL(job.sourceUrl).hostname)}-${new Date().toISOString().slice(0, 10)}.zip`;
      const downloadId = await chrome.downloads.download({ url, filename, saveAs: true, conflictAction: 'uniquify' });
      await updateJob({ state: 'compressing', phase: 'Waiting for ZIP download to finish', currentPage: null, downloadId, downloadUrl: url });
      if (job.cancelRequested) await chrome.downloads.cancel(downloadId).catch(() => {});
      const downloadState = await waitForDownload(downloadId, url);
      if (job.cancelRequested || downloadState === 'interrupted') {
        await releaseArchiveUrl(url);
        const cancelled = job.cancelRequested;
        await updateJob({ state: cancelled ? 'cancelled' : 'failed', phase: cancelled ? 'Cancelled; temporary tabs closed' : 'ZIP download failed', currentPage: null, completedAt: now(), cancelRequested: false, downloadId: null, downloadUrl: '', lastError: cancelled ? '' : 'Chrome interrupted the ZIP download.' });
      } else {
        await releaseArchiveUrl(url);
        discardExtractedContent();
        await updateJob({ state: 'completed', phase: 'ZIP download completed; extracted page checkpoints deleted', currentPage: null, completedAt: now(), cancelRequested: false, pauseRequested: false, downloadId: null, downloadUrl: '' });
      }
    } catch (error) {
      const message = errorText(error);
      const cleanup = await closeWorkerTabs();
      await releaseArchiveUrl(job.downloadUrl);
      const state = job.cancelRequested && cleanup.ok ? 'cancelled' : 'failed';
      const detail = cleanup.ok ? message : `${message}; temporary tabs remain open: ${cleanup.remaining.join(', ')}`;
      await updateJob({ state, phase: state === 'cancelled' ? 'Cancelled; temporary tabs closed' : 'Export failed', lastError: detail, currentPage: null, downloadUrl: '', cancelRequested: false, pauseRequested: false });
    } finally {
      runner = null;
    }
  })();
  return runner;
}

async function scheduleRunner() {
  const pending = runner;
  if (pending) await pending.catch(() => {});
  return runAll();
}

async function startAll(message) {
  await loadJob();
  if (figmaCssExportActive) return { ok: false, error: 'Wait for the Figma CSS ZIP export to finish before starting a Storybook crawl.' };
  if (currentExport) return { ok: false, error: 'A Current Docs export is already running.' };
  if (job && ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state)) return { ok: true, duplicate: true, job: progressState() };
  if (job && job.state === 'paused') return { ok: false, error: 'Resume or cancel the paused job before starting another export.' };
  const previousCleanup = await closeWorkerTabs();
  if (!previousCleanup.ok) return { ok: false, error: `Close or retry cleanup for temporary tabs ${previousCleanup.remaining.join(', ')} first.` };
  job = {
    id: `job-${now()}-${Math.random().toString(36).slice(2, 8)}`,
    state: 'discovering', phase: 'Discovering Storybook Docs metadata',
    sourceTabId: message.tabId, sourceUrl: message.tabUrl, indexUrl: '',
    options: normalizeOptions(message.options), concurrency: Math.max(1, Math.min(3, Number(message.concurrency) || DEFAULT_CONCURRENCY)),
    entries: [], discoveredCount: 0, warnings: [], tabIds: [], currentPage: null,
    createdAt: now(), startedAt: now(), updatedAt: now(), pauseRequested: false, cancelRequested: false,
  };
  await notifyPopup();
  void scheduleRunner();
  return { ok: true, job: progressState() };
}

async function resumeJob() {
  await loadJob();
  if (figmaCssExportActive) return { ok: false, error: 'Wait for the Figma CSS ZIP export to finish before resuming the Storybook crawl.' };
  if (!job) return { ok: false, error: 'There is no saved export to resume.' };
  if (['discovering', 'crawling', 'processing', 'compressing'].includes(job.state)) {
    if (!runner) {
      const cleanup = await closeWorkerTabs();
      if (!cleanup.ok) return { ok: false, error: `Cannot resume until temporary tabs close: ${cleanup.remaining.join(', ')}` };
      for (const entry of job.entries) if (entry.status === 'running') entry.status = 'queued';
      job.pauseRequested = false;
      job.cancelRequested = false;
      void scheduleRunner();
    }
    return { ok: true, job: progressState() };
  }
  if (!['paused', 'failed', 'cancelled', 'completed'].includes(job.state)) return { ok: false, error: 'This job is not resumable.' };
  if (job.state === 'completed' && !job.entries.some((entry) => entry.status === 'failed')) return { ok: false, error: 'There are no failed pages to retry.' };
  const cleanup = await closeWorkerTabs();
  if (!cleanup.ok) return { ok: false, error: `Cannot resume until temporary tabs close: ${cleanup.remaining.join(', ')}` };
  for (const entry of job.entries) {
    if (entry.status === 'failed' || job.state === 'completed' && entry.status === 'succeeded' && !entry.page) entry.status = 'queued';
  }
  job.completedAt = null;
  job.pauseRequested = false;
  job.cancelRequested = false;
  job.state = job.entries.length ? 'crawling' : 'discovering';
  job.phase = job.entries.length ? 'Resuming saved Docs entries' : 'Discovering Storybook Docs metadata';
  job.lastError = '';
  await notifyPopup();
  void scheduleRunner();
  return { ok: true, job: progressState() };
}

async function controlJob(action, id) {
  await loadJob();
  if (action === 'RETRY_ENTRY' && figmaCssExportActive) return { ok: false, error: 'Wait for the Figma CSS ZIP export to finish before retrying a Storybook page.' };
  if (!job) return { ok: false, error: 'No export job is available.' };
  if (action === 'PAUSE') {
    if (job.state !== 'crawling') return { ok: false, error: 'Pause is available while crawling.' };
    job.pauseRequested = true;
    job.phase = 'Pausing after active page work settles';
    await notifyPopup();
    if (!runner) void scheduleRunner();
    return { ok: true, job: progressState() };
  }
  if (action === 'CANCEL') {
    if (!['discovering', 'crawling', 'processing', 'compressing', 'paused', 'failed'].includes(job.state)) return { ok: false, error: 'This job cannot be cancelled now.' };
    job.cancelRequested = true;
    job.pauseRequested = false;
    job.phase = 'Cancelling; waiting for active work and tab cleanup';
    await notifyPopup();
    if (!runner && job.state !== 'paused' && job.state !== 'failed') void scheduleRunner();
    if (job.downloadId && job.state === 'compressing') await chrome.downloads.cancel(job.downloadId).catch(() => {});
    if (job.state === 'paused' || job.state === 'failed') {
      const cleanup = await closeWorkerTabs();
      const state = cleanup.ok ? 'cancelled' : 'failed';
      await updateJob({ state, phase: cleanup.ok ? 'Cancelled; temporary tabs closed' : `Cancellation cleanup failed for tabs ${cleanup.remaining.join(', ')}`, lastError: cleanup.ok ? '' : cleanup.remaining.join(', '), cancelRequested: false, currentPage: null });
    }
    return { ok: true, job: progressState() };
  }
  if (action === 'RETRY_ENTRY') {
    if (runner && !['paused', 'failed', 'completed', 'cancelled'].includes(job.state)) return { ok: false, error: 'Wait for the active crawl to pause or finish before retrying a page.' };
    const cleanup = await closeWorkerTabs();
    if (!cleanup.ok) return { ok: false, error: `Cannot retry until temporary tabs close: ${cleanup.remaining.join(', ')}` };
    const entry = job.entries.find((candidate) => candidate.id === id);
    if (!entry || entry.status !== 'failed') return { ok: false, error: 'Only a failed Docs entry can be retried.' };
    if (job.state === 'completed') {
      for (const candidate of job.entries) if (candidate.status === 'succeeded' && !candidate.page) candidate.status = 'queued';
      job.completedAt = null;
    }
    entry.status = 'retrying';
    entry.error = '';
    job.state = 'crawling';
    job.phase = `Retrying ${entry.title}`;
    job.lastError = '';
    job.pauseRequested = false;
    job.cancelRequested = false;
    await notifyPopup();
    void scheduleRunner();
    return { ok: true, job: progressState() };
  }
  return { ok: false, error: 'Unknown job action.' };
}

async function getJob() {
  await loadJob();
  if (job && ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state) && !runner) {
    const cleanup = await closeWorkerTabs();
    if (!cleanup.ok) {
      await updateJob({ state: 'failed', phase: 'Recovery cleanup failed', lastError: `Temporary tabs remain open: ${cleanup.remaining.join(', ')}` });
      return progressState();
    }
    for (const entry of job.entries) if (entry.status === 'running') entry.status = 'queued';
    void scheduleRunner();
  }
  return progressState();
}

chrome.downloads.onChanged.addListener((delta) => {
  if (!delta.state || !['complete', 'interrupted'].includes(delta.state.current)) return;
  loadJob().then(async () => {
    if (job?.downloadId !== delta.id || !job.downloadUrl) return;
    await releaseArchiveUrl(job.downloadUrl);
    job.downloadUrl = '';
    await persist();
  }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'MAKE_ZIP' || message?.action === 'REVOKE_URL') return;
  (async () => {
    if (message?.action === 'GET_JOB') return { ok: true, job: await getJob() };
    if (message?.action === 'START_ALL') return startAll(message);
    if (message?.action === 'RESUME') return resumeJob();
    if (['PAUSE', 'CANCEL', 'RETRY_ENTRY'].includes(message?.action)) return controlJob(message.action, message.id);
    if (message?.action === 'EXPORT_FIGMA_CSS') return downloadFigmaCss(message);
    if (message?.action === 'EXPORT_CURRENT') {
      await loadJob();
      if (figmaCssExportActive || currentExport || (job && ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state))) return { ok: false, error: 'Another export job is already active.' };
      const cleanup = await closeWorkerTabs();
      if (!cleanup.ok) return { ok: false, error: `Close temporary tabs ${cleanup.remaining.join(', ')} before exporting.` };
      currentExport = true;
      try { return { ok: true, ...(await downloadCurrent(message)) }; }
      finally { currentExport = false; }
    }
    return { ok: false, error: 'Unsupported action.' };
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, error: errorText(error) }));
  return true;
});

chrome.runtime.onStartup.addListener(() => {
  loadJob().then(async () => {
    if (job && ['discovering', 'crawling', 'processing', 'compressing'].includes(job.state)) {
      const cleanup = await closeWorkerTabs();
      if (!cleanup.ok) {
        await updateJob({ state: 'failed', phase: 'Startup cleanup failed', lastError: `Temporary tabs remain open: ${cleanup.remaining.join(', ')}` });
        return;
      }
      for (const entry of job.entries) if (entry.status === 'running') entry.status = 'queued';
      void runAll();
    }
  }).catch(() => {});
});
