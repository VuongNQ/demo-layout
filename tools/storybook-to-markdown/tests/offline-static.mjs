import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import '../offline-static.js';
const offline = globalThis.StorybookOffline;

const origin = 'https://storybook.internal';
const registry = offline.createRegistry(origin);
const cssA = registry.register('/assets/site.css?v=2', origin, { resourceType: 'css', pageId: 'alpha--docs', discoverySource: 'html-link' });
const cssB = registry.register('/assets/site.css?v=2#theme', origin, { resourceType: 'css', pageId: 'beta--docs', discoverySource: 'html-link' });
assert.equal(cssA.entry, cssB.entry, 'same canonical URL creates one registry entry');
assert.deepEqual(cssA.entry.referencingPageIds, ['alpha--docs', 'beta--docs']);
assert.equal(cssA.fragment, '');
assert.notEqual(registry.register('/assets/site.css?v=3', origin).entry, cssA.entry, 'identity query parameters remain significant');
assert.equal(registry.register('https://other.internal/a.css', origin).reason, 'origin-not-approved');
assert.equal(registry.register('/x.css?token=abc', origin).reason, 'sensitive-url');
assert.equal(registry.register('https://user:pw@storybook.internal/x.css', origin).reason, 'unsafe-url');
assert.equal(offline.canonicalize('//storybook.internal/a.svg#icon', origin, origin).url, `${origin}/a.svg`);
assert.equal(offline.canonicalize('javascript:alert(1)', origin, origin).ok, false);

const htmlRefs = offline.extractHtmlReferences('<link rel="stylesheet" href="/a.css"><img src="a.png"><source srcset="a.webp 1x, b.webp 2x"><iframe src="https://storybook.internal/embed"></iframe>', `${origin}/docs/page`);
assert.deepEqual(htmlRefs.map((x) => x.url), ['/a.css', 'a.png', 'a.webp', 'b.webp', 'https://storybook.internal/embed']);
assert.equal(htmlRefs.at(-1).source, 'unsupported-iframe');
assert(offline.extractCssReferences('@import "nested.css"; @font-face{src:url(font.woff2)} .x{background:url(../x.svg#shape)}').map((x) => x.url).includes('nested.css'));
assert.deepEqual(offline.extractCssReferences('.hero{background-image:image-set("one.png" 1x, url("two.png") 2x)}').filter((x) => x.source === 'css-image-set').map((x) => x.url), ['one.png'], 'quoted CSS image-set candidates are discovered');
assert.deepEqual(offline.extractJsReferences('import x from "./chunk.js"; import("./lazy.js"); import(path);').refs.map((x) => x.url), ['./chunk.js', './lazy.js']);
assert.equal(offline.extractJsReferences('import(path);').dynamicImports, 1);
assert.equal(offline.pathFor({ resourceType: 'image', originalUrl: `${origin}/foo.png`, contentHash: 'a'.repeat(64) }), `assets/images/${'a'.repeat(64)}.png`);
assert.equal(offline.sanitizeUrl(`${origin}/asset?token=secret`), `${origin}/asset?<redacted>`);
const rewriteRegistry = offline.createRegistry(origin);
const rewrittenAsset = rewriteRegistry.register('/theme.css', origin, { resourceType: 'css' }).entry;
rewrittenAsset.localArchivePath = 'assets/css/theme.css';
assert.match(offline.rewriteReferences('<link href="/theme.css"><p>keep /theme.css</p>', origin, rewriteRegistry), /href="..\/assets\/css\/theme.css"/);

let active = 0, peak = 0, calls = new Map();
const fetchImpl = async (url, options) => {
  assert.equal(options.credentials, 'omit');
  calls.set(url, (calls.get(url) || 0) + 1);
  active++; peak = Math.max(peak, active);
  await new Promise((resolve) => setTimeout(resolve, 15));
  active--;
  return new Response(new TextEncoder().encode(url.includes('same-a') || url.includes('same-b') ? 'same-bytes' : `body:${url}`), { status: 200, headers: { 'Content-Type': url.endsWith('.css') ? 'text/css' : 'image/png' } });
};
const scheduler = offline.makeScheduler({ concurrency: 3, fetchImpl, maxTotalBytes: 5000 });
const assets = ['a.css', 'b.png', 'c.png', 'd.png'].map((path) => registry.register(path, origin, { resourceType: offline.classify(path) }).entry);
const result = await scheduler.run(assets, origin);
assert(peak <= 3 && peak === 3, 'three requests overlap and peak concurrency is bounded');
assert.equal(result.peakConcurrency, 3);
assert.equal(assets[0].status, 'DOWNLOADED');
assert.equal(assets[0].contentHash.length, 64);
assert.equal(assets[0].localArchivePath.startsWith('assets/'), true);

const sharedRegistry = offline.createRegistry(origin);
const shared1 = sharedRegistry.register('/same-a.png', origin, { resourceType: 'image' }).entry;
const shared2 = sharedRegistry.register('/same-a.png#icon', origin, { resourceType: 'image' }).entry;
const dedupScheduler = offline.makeScheduler({ concurrency: 3, fetchImpl });
await Promise.all([dedupScheduler.download(shared1, origin), dedupScheduler.download(shared2, origin)]);
assert.equal(shared1, shared2);
assert.equal(calls.get(`${origin}/same-a.png`), 1, 'concurrent duplicate references share in-flight fetch');

const contentRegistry = offline.createRegistry(origin);
const sameA = contentRegistry.register('/same-a.png', origin, { resourceType: 'image' }).entry;
const sameB = contentRegistry.register('/same-b.png', origin, { resourceType: 'image' }).entry;
const contentScheduler = offline.makeScheduler({ fetchImpl });
await contentScheduler.run([sameA, sameB], origin);
assert.equal(sameA.status, 'DOWNLOADED');
assert.equal(sameB.status, 'DOWNLOADED');
assert.equal(sameA.localArchivePath, sameB.localArchivePath, 'identical same-type bytes share archive member');
const cssContentRegistry = offline.createRegistry(origin);
const cssEntryA = cssContentRegistry.register('/a/site.css', origin, { resourceType: 'css' }).entry;
const cssEntryB = cssContentRegistry.register('/b/site.css', origin, { resourceType: 'css' }).entry;
await offline.makeScheduler({ fetchImpl: async () => new Response('.x{background:url("./image.png")}', { headers: { 'Content-Type': 'text/css' } }) }).run([cssEntryA, cssEntryB], origin);
assert.notEqual(cssEntryA.localArchivePath, cssEntryB.localArchivePath, 'CSS with relative dependencies keeps URL-specific archive members');

const bad = offline.createRegistry(origin).register('/broken.css', origin, { resourceType: 'css' }).entry;
const badScheduler = offline.makeScheduler({ fetchImpl: async (url) => new Response('<html>login</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) });
await badScheduler.download(bad, origin);
assert.equal(bad.status, 'FAILED', 'HTML login response is rejected instead of packaged as CSS');
assert.match(bad.failureReason, /HTML response rejected/);

let retryCalls = 0;
const retryRegistry = offline.createRegistry(origin);
const transient = retryRegistry.register('/transient.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ fetchImpl: async () => {
  retryCalls++;
  return retryCalls === 1
    ? new Response('temporary', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    : new Response(new Uint8Array([7, 8, 9]), { headers: { 'Content-Type': 'image/png' } });
} }).download(transient, origin);
assert.equal(retryCalls, 2, 'transient server errors receive a bounded retry');
assert.equal(transient.attempts, 2);
assert.equal(transient.status, 'DOWNLOADED');

let rateLimitCalls = 0;
const rateLimited = offline.createRegistry(origin).register('/limited.png', origin, { resourceType: 'image' }).entry;
const retryAfterStart = Date.now();
await offline.makeScheduler({ fetchImpl: async () => {
  rateLimitCalls++;
  return rateLimitCalls === 1
    ? new Response('slow down', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '0.01' } })
    : new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } });
} }).download(rateLimited, origin);
assert.equal(rateLimitCalls, 2, 'HTTP 429 with Retry-After is retried');
assert(Date.now() - retryAfterStart >= 8, 'Retry-After delay is respected');

let permanentCalls = 0;
const permanent = offline.createRegistry(origin).register('/permanent.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ fetchImpl: async () => { permanentCalls++; return new Response('missing', { status: 404, headers: { 'Content-Type': 'text/plain' } }); } }).download(permanent, origin);
assert.equal(permanentCalls, 1, 'permanent HTTP failures do not retry automatically');
assert.equal(permanent.status, 'FAILED');

let timeoutCalls = 0;
const timedOut = offline.createRegistry(origin).register('/timeout.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ timeoutMs: 5, fetchImpl: async (_url, options) => {
  timeoutCalls++;
  return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
} }).download(timedOut, origin);
assert.equal(timeoutCalls, 3, 'timed-out resources have a finite retry bound');
assert.equal(timedOut.status, 'FAILED');

const redirect = offline.createRegistry(origin).register('/redirect.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ fetchImpl: async () => ({ ok: true, status: 200, url: 'https://other.internal/redirect.png', headers: new Headers({ 'Content-Type': 'image/png' }), arrayBuffer: async () => new Uint8Array([1]).buffer }) }).download(redirect, origin);
assert.equal(redirect.status, 'FAILED');
assert.match(redirect.failureReason, /Redirect outside approved Storybook origin/);

const tooLarge = offline.createRegistry(origin).register('/large.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ maxResourceBytes: 4, fetchImpl: async () => new Response(new Uint8Array([1, 2, 3, 4, 5]), { headers: { 'Content-Type': 'image/png' } }) }).download(tooLarge, origin);
assert.equal(tooLarge.status, 'FAILED');
assert.match(tooLarge.failureReason, /size limit/);

const quota = offline.createRegistry(origin).register('/quota.png', origin, { resourceType: 'image' }).entry;
await offline.makeScheduler({ fetchImpl: async () => new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } }), stageAsset: async () => { throw new Error('Offline staging storage/quota failure: full'); } }).download(quota, origin);
assert.equal(quota.status, 'FAILED');
assert.match(quota.failureReason, /storage\/quota/);

const rejectedOriginRegistry = offline.createRegistry(origin);
const rejectedOrigin = rejectedOriginRegistry.register('https://other.internal/private.png', origin, { resourceType: 'image' });
let unauthorizedFetchCalls = 0;
await offline.makeScheduler({ fetchImpl: async () => { unauthorizedFetchCalls++; return new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } }); } }).run([rejectedOrigin.entry], origin);
assert.equal(rejectedOrigin.entry.status, 'SKIPPED');
assert.equal(unauthorizedFetchCalls, 0, 'off-origin references are never requested');

const apiResponse = offline.createRegistry(origin).register('/api.json', origin, { resourceType: 'other' }).entry;
await offline.makeScheduler({ fetchImpl: async () => new Response('{"private":"body"}', { headers: { 'Content-Type': 'application/octet-stream' } }) }).download(apiResponse, origin);
assert.equal(apiResponse.status, 'FAILED', 'JSON-like API payloads are not collected as static assets');

const credentialScript = offline.createRegistry(origin).register('/credential.js', origin, { resourceType: 'js' }).entry;
await offline.makeScheduler({ fetchImpl: async () => new Response('const header = "Bearer abcdefghijklmnopqrstuvwxyz";', { headers: { 'Content-Type': 'text/javascript' } }) }).download(credentialScript, origin);
assert.equal(credentialScript.status, 'FAILED', 'text assets containing credential patterns are excluded');

const integratedOrigin = 'https://fixture.internal';
const responseBodies = new Map([
  ['/shared.css', ['@import "./nested.css"; @font-face{font-family:Fixture;src:url("./fixture.woff2")} .hero{background:url("./hero.png")}', 'text/css']],
  ['/nested.css', ['@import "./shared.css"; .nested{color:#123;background-image:image-set("./one.png" 1x, "./two.png" 2x)}', 'text/css']],
  ['/fixture.woff2', [new Uint8Array([0, 255, 10, 128]), 'font/woff2']],
  ['/hero.png', [new Uint8Array([137, 80, 78, 71, 0, 255, 1]), 'image/png']],
  ['/bundle.js', ['import "./chunk.js"; import(dynamicPath);', 'text/javascript']],
  ['/chunk.js', ['export const fixture=1;', 'text/javascript']],
  ['/shared.svg', ['<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>', 'image/svg+xml']],
  ['/one.png', [new Uint8Array([1, 2, 3]), 'image/png']],
  ['/two.png', [new Uint8Array([4, 5, 6]), 'image/png']],
]);
const integratedCalls = new Map(); let integratedActive = 0, integratedPeak = 0;
const integratedFetch = async (url, options) => {
  assert.equal(options.credentials, 'omit');
  const parsed = new URL(url); const data = responseBodies.get(parsed.pathname);
  integratedCalls.set(parsed.pathname, (integratedCalls.get(parsed.pathname) || 0) + 1);
  integratedActive++; integratedPeak = Math.max(integratedPeak, integratedActive);
  await new Promise((resolve) => setTimeout(resolve, parsed.pathname === '/one.png' ? 30 : 10)); integratedActive--;
  if (!data) return new Response('missing', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  const body = data[0] instanceof Uint8Array ? data[0] : new TextEncoder().encode(data[0]);
  return new Response(body, { status: 200, headers: { 'Content-Type': data[1] } });
};
const docTemplate = (name, image) => `<!doctype html><html><head><link rel="stylesheet" href="/shared.css"><script src="/bundle.js"></script></head><body><main><h1>${name}</h1><img src="/hero.png"><picture><source srcset="/${image} 1x"><img src="/shared.svg#shape"></picture><a href="/?path=/docs/${name.toLowerCase()}--docs">Other Docs</a><a href="#props">Props</a><div id="props">props</div></main></body></html>`;
const integrated = await offline.buildOfflineSite([
  { id: 'one--docs', title: 'One', url: `${integratedOrigin}/?path=/docs/one--docs`, html: docTemplate('One', 'one.png') },
  { id: 'two--docs', title: 'Two', url: `${integratedOrigin}/?path=/docs/two--docs`, html: docTemplate('Two', 'two.png') },
], { approvedOrigin: integratedOrigin, sourceUrl: `${integratedOrigin}/`, fetchImpl: integratedFetch, concurrency: 3, maxResourceBytes: 1024, maxTotalBytes: 10000 });
assert.equal(integratedCalls.get('/shared.css'), 1, 'shared stylesheet fetched once by integrated export');
assert.equal(integratedCalls.get('/hero.png'), 1, 'shared image fetched once by integrated export');
assert.equal(integratedCalls.get('/bundle.js'), 1, 'shared JavaScript bundle fetched once');
assert.equal(integratedCalls.get('/nested.css'), 1, 'nested CSS dependency fetched once');
assert.equal(integratedCalls.get('/shared.css'), 1, 'circular stylesheet imports do not refetch the original stylesheet');
assert.equal(integratedCalls.get('/fixture.woff2'), 1, 'font dependency fetched once');
assert(integratedPeak <= 3 && integratedPeak === 3, 'integrated asset requests never exceed three active requests');
assert(integrated.files.some((file) => file.path === 'index.html'));
assert(integrated.files.some((file) => file.path === 'pages/one--docs.html'));
assert(integrated.files.some((file) => file.path === 'pages/two--docs.html'));
assert(integrated.files.some((file) => file.path === 'ASSET_MANIFEST.json'));
const offlinePage = integrated.files.find((file) => file.path === 'pages/one--docs.html').content;
assert(offlinePage.includes('href="../index.html"') && offlinePage.includes('href="two--docs.html"'), 'page navigation links locally to the index and sibling Docs pages');
assert(!/<script\b/i.test(offlinePage), 'safe static mode strips scripts');
assert(!/https:\/\/fixture\.internal\/(?:shared\.css|hero\.png)/.test(offlinePage), 'HTML resource references are localized');
assert(offlinePage.includes('href="#props"'), 'local fragment navigation is preserved');
assert(integrated.files.some((file) => file.path.startsWith('assets/css/')));
const rewrittenNestedCss = new TextDecoder().decode(integrated.files.find((file) => file.path.startsWith('assets/css/') && file.path.endsWith('.css') && file.path !== integrated.registry.values().find((asset) => asset.originalUrl.endsWith('/shared.css')).localArchivePath)?.bytes || new Uint8Array());
assert(rewrittenNestedCss.includes('image-set("../images/') && !rewrittenNestedCss.includes('./one.png'), 'CSS image-set strings are rewritten to local archive paths');
assert(integrated.manifest.pages.every((page) => ['STATIC_READY', 'PARTIAL', 'FAILED'].includes(page.status)));
assert(integrated.localCheck.ok, 'all generated HTML and CSS local references resolve to archive members');
const inventoriedJs = integrated.files.find((file) => file.path.startsWith('assets/js/') && file.path.endsWith('.js'));
assert(new TextDecoder().decode(inventoriedJs.bytes).includes('./') && !new TextDecoder().decode(inventoriedJs.bytes).includes('https://fixture.internal/chunk.js'), 'static JS module references are rewritten for inventory without execution');
assert(integrated.registry.values().find((asset) => asset.resourceType === 'js').warnings.some((warning) => warning.includes('dynamic import')), 'unresolved runtime imports are reported');

const missingIntegrated = await offline.buildOfflineSite([{ id: 'missing--docs', title: 'Missing', url: `${integratedOrigin}/?path=/docs/missing--docs`, html: '<html><head><link rel="stylesheet" href="/absent.css"></head><body><h1>Missing dependency</h1></body></html>' }], { approvedOrigin: integratedOrigin, sourceUrl: integratedOrigin, fetchImpl: integratedFetch, concurrency: 3, maxResourceBytes: 1024, maxTotalBytes: 10000 });
assert.equal(missingIntegrated.registry.values()[0].status, 'FAILED');
assert.match(missingIntegrated.files.find((file) => file.path === 'OFFLINE_REPORT.md').content, /absent\.css/);
assert.equal(missingIntegrated.pageResults[0].status, 'PARTIAL');
assert.match(missingIntegrated.files.find((file) => file.path === 'index.html').content, /Partial/);
assert.match(missingIntegrated.files.find((file) => file.path === 'OFFLINE_REPORT.md').content, /## Page outcomes[\s\S]*PARTIAL/);
const caseCollision = await offline.buildOfflineSite([
  { id: 'Button--docs', title: 'Upper', url: `${integratedOrigin}/?path=/docs/Button--docs`, html: '<html><body><h1>Upper</h1></body></html>' },
  { id: 'button--docs', title: 'Lower', url: `${integratedOrigin}/?path=/docs/button--docs`, html: '<html><body><h1>Lower</h1></body></html>' },
], { approvedOrigin: integratedOrigin, sourceUrl: integratedOrigin });
assert.equal(new Set(caseCollision.pageResults.map((page) => page.path.toLowerCase())).size, 2, 'Storybook IDs that differ only by case get collision-safe Windows paths');

const offscreenSource = await readFile(new URL('../offscreen.js', import.meta.url), 'utf8');
const urls = new Map(); const listenersZip = [];
const offscreenContext = vm.createContext({ chrome: { runtime: { onMessage: { addListener: (listener) => listenersZip.push(listener) } } }, TextEncoder, Uint8Array, Uint32Array, DataView, Blob, ArrayBuffer, URL: { createObjectURL: (blob) => { const key = `blob:offline-${urls.size}`; urls.set(key, blob); return key; }, revokeObjectURL: (url) => urls.delete(url) }, Set });
vm.runInContext(offscreenSource, offscreenContext);
let zipResponse;
listenersZip[0]({ action: 'MAKE_ZIP', files: integrated.files }, {}, (response) => { zipResponse = response; });
assert(zipResponse.ok, 'binary files are accepted by the ZIP writer');
const archive = new Uint8Array(await urls.get(zipResponse.url).arrayBuffer());
const view = new DataView(archive.buffer); const zipNames = []; let cursor = 0;
while (cursor + 30 <= archive.length && view.getUint32(cursor, true) === 0x04034b50) {
  const nameLength = view.getUint16(cursor + 26, true), extraLength = view.getUint16(cursor + 28, true), size = view.getUint32(cursor + 18, true);
  const start = cursor + 30 + nameLength + extraLength, name = new TextDecoder().decode(archive.subarray(cursor + 30, cursor + 30 + nameLength)); zipNames.push(name);
  const crc = (bytes) => { let value = 0xffffffff; for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; } return (value ^ 0xffffffff) >>> 0; };
  assert.equal(view.getUint32(cursor + 14, true), crc(archive.subarray(start, start + size)), `ZIP CRC validates: ${name}`);
  const member = integrated.files.find((file) => file.path === name);
  if (member?.bytes) assert.deepEqual([...archive.subarray(start, start + size)], [...member.bytes], `binary ZIP member byte preservation: ${name}`);
  cursor = start + size;
}
assert(zipNames.includes('index.html'));
assert(zipNames.includes('OFFLINE_REPORT.md'));

const staged = new Map();
const cachedFetches = new Map();
const stagedFetch = async (url) => { cachedFetches.set(url, (cachedFetches.get(url) || 0) + 1); return new Response(new TextEncoder().encode('persisted-css'), { headers: { 'Content-Type': 'text/css' } }); };
const stagedPage = [{ id: 'cached--docs', title: 'Cached', url: `${integratedOrigin}/?path=/docs/cached--docs`, html: '<html><head><link rel="stylesheet" href="/cache.css"></head><body><h1>Cached</h1></body></html>' }];
await offline.buildOfflineSite(stagedPage, { approvedOrigin: integratedOrigin, fetchImpl: stagedFetch, loadStagedAsset: async (entry) => staged.get(entry.canonicalFetchKey), stageAsset: async (entry) => staged.set(entry.canonicalFetchKey, { bytes: entry.bytes.buffer.slice(0), contentHash: entry.contentHash, mimeType: entry.mimeType }), maxResourceBytes: 1024, maxTotalBytes: 2000 });
await offline.buildOfflineSite(stagedPage, { approvedOrigin: integratedOrigin, fetchImpl: async () => { throw new Error('completed staged CSS must be reused'); }, loadStagedAsset: async (entry) => staged.get(entry.canonicalFetchKey), stageAsset: async () => {}, maxResourceBytes: 1024, maxTotalBytes: 2000 });
assert.equal(cachedFetches.get(`${integratedOrigin}/cache.css`), 1, 'completed staged assets are integrity-checked and reused without another request');

let pause = false, fetchCount = 0, pausedObserved = false;
const pauseRegistry = offline.createRegistry(integratedOrigin);
const pauseAssets = ['p1.png', 'p2.png', 'p3.png'].map((name) => pauseRegistry.register(`/${name}`, integratedOrigin, { resourceType: 'image' }).entry);
const pauseScheduler = offline.makeScheduler({ concurrency: 1, pauseRequested: () => pause, onPauseState: (value) => { pausedObserved ||= value; }, fetchImpl: async () => { fetchCount++; if (fetchCount === 1) pause = true; await new Promise((resolve) => setTimeout(resolve, 20)); return new Response(new Uint8Array([fetchCount]), { headers: { 'Content-Type': 'image/png' } }); } });
const pausedRun = pauseScheduler.run(pauseAssets, integratedOrigin);
await new Promise((resolve) => setTimeout(resolve, 120));
assert.equal(fetchCount, 1, 'pause prevents assignment of the next queued asset after in-flight work settles');
assert.equal(pausedObserved, true);
pause = false;
await pausedRun;
assert.equal(fetchCount, 3, 'resume continues queued assets');

console.log(JSON.stringify({ result: 'PASS', urlDeduplication: true, sensitiveUrlRejection: true, htmlCssJsDiscovery: true, imageSetDiscoveryAndRewrite: true, rewrite: true, inFlightSharing: true, contentHashDeduplication: true, semanticContentDedupSafety: true, boundedConcurrency: integratedPeak, retryPolicy: true, timeoutAndSizeLimits: true, storageQuotaHandling: true, crossOriginRejectedBeforeFetch: true, loginPageRejected: true, integratedPages: 2, binaryZip: true }));
