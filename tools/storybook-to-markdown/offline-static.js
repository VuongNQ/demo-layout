/* Offline Static primitives. Imported by the MV3 worker and tested without Chrome. */
(function (root) {
  'use strict';
  const MAX_RESOURCE_BYTES = 4 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
  const MAX_PAGE_BYTES = 1024 * 1024;
  const MAX_PAGES_TOTAL_BYTES = 16 * 1024 * 1024;
  const REQUEST_TIMEOUT_MS = 15000;
  const RETRIES = 2;
  const CONCURRENCY = 3;
  const MAX_ASSETS = 5000;
  const SECRET_QUERY = /(?:token|secret|password|passwd|authorization|credential|session|cookie|signature|sig|api[_-]?key|access[_-]?key|auth|jwt|ticket|state|client[_-]?id|client[_-]?secret|(?:^|[_-])code$|(?:^|[_-])key$)/i;
  const SECRET_NAME = /(?:bearer\s+|eyJ[a-zA-Z0-9_-]{10,}\.|[?&](?:token|secret|password|authorization|session|api[_-]?key|auth|jwt|ticket|code)=)/i;
  const TYPE_DIR = { css: 'css', js: 'js', font: 'fonts', image: 'images', svg: 'svg', media: 'other', other: 'other' };
  const mimeType = (url, supplied = '') => {
    const mime = String(supplied).split(';')[0].trim().toLowerCase();
    if (mime) return mime;
    const ext = new URL(url).pathname.split('.').pop().toLowerCase();
    return ({ css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' })[ext] || 'application/octet-stream';
  };
  function compatibleMime(type, resourceType) {
    const mime = String(type || '').split(';')[0].trim().toLowerCase();
    if (!mime) return resourceType !== 'other';
    if (mime === 'application/octet-stream') return true;
    if (resourceType === 'css') return mime === 'text/css';
    if (resourceType === 'js') return /^(?:text|application)\/(?:javascript|ecmascript|x-javascript)$/.test(mime);
    if (resourceType === 'svg') return mime === 'image/svg+xml';
    if (resourceType === 'image') return mime.startsWith('image/');
    if (resourceType === 'font') return mime.startsWith('font/') || /^application\/(?:x-)?(?:font.*|.*font.*)|application\/vnd\.ms-fontobject$/.test(mime);
    if (resourceType === 'media') return mime.startsWith('audio/') || mime.startsWith('video/');
    if (resourceType === 'other') return mime === 'application/octet-stream';
    return false;
  }
  async function readBounded(response, maxBytes, controller) {
    if (!response.body?.getReader) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > maxBytes) throw new Error('Resource exceeds per-resource size limit.');
      return buffer;
    }
    const reader = response.body.getReader();
    const chunks = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.byteLength;
        if (total > maxBytes) { await reader.cancel().catch(() => {}); controller.abort(); throw new Error('Resource exceeds per-resource size limit.'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const joined = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    return joined.buffer;
  }
  function canonicalize(reference, baseUrl, approvedOrigin) {
    let url;
    try { url = new URL(reference, baseUrl); } catch { return { ok: false, reason: 'invalid-url' }; }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return { ok: false, reason: 'unsafe-url' };
    if (SECRET_NAME.test(url.href) || [...url.searchParams.keys()].some((key) => SECRET_QUERY.test(key))) return { ok: false, reason: 'sensitive-url' };
    if (url.origin !== approvedOrigin) return { ok: false, reason: 'origin-not-approved' };
    url.hash = '';
    return { ok: true, url: url.href };
  }
  function createRegistry(approvedOrigin) {
    const entries = new Map();
    function register(reference, baseUrl, detail = {}) {
      const identity = canonicalize(reference, baseUrl, approvedOrigin);
      if (!identity.ok) {
        const sanitized = sanitizeUrl(String(reference));
        const rejectedKey = `rejected:${detail.resourceType || 'other'}:${sanitized || identity.reason}`;
        let skipped = entries.get(rejectedKey);
        if (!skipped) {
          skipped = { assetId: `asset-${entries.size + 1}`, originalUrl: sanitized, canonicalFetchKey: '', resourceType: detail.resourceType || 'other', discoverySources: [], referencingPageIds: [], referencingAssetIds: [], referenceCount: 0, status: 'SKIPPED', attempts: 0, mimeType: '', byteSize: 0, contentHash: '', localArchivePath: '', rewriteStatus: 'unresolved', failureReason: identity.reason, warnings: [] };
          entries.set(rejectedKey, skipped);
        }
        skipped.referenceCount++;
        if (detail.pageId && !skipped.referencingPageIds.includes(detail.pageId)) skipped.referencingPageIds.push(detail.pageId);
        if (detail.parentAssetId && !skipped.referencingAssetIds.includes(detail.parentAssetId)) skipped.referencingAssetIds.push(detail.parentAssetId);
        if (detail.discoverySource && !skipped.discoverySources.includes(detail.discoverySource)) skipped.discoverySources.push(detail.discoverySource);
        return { accepted: false, reason: identity.reason, entry: skipped };
      }
      if (!entries.has(identity.url) && entries.size >= MAX_ASSETS) {
        const key = 'rejected:asset-limit';
        let skipped = entries.get(key);
        if (!skipped) { skipped = { assetId: `asset-${entries.size + 1}`, originalUrl: '', canonicalFetchKey: '', resourceType: 'other', discoverySources: [], referencingPageIds: [], referencingAssetIds: [], referenceCount: 0, status: 'SKIPPED', attempts: 0, mimeType: '', byteSize: 0, contentHash: '', localArchivePath: '', rewriteStatus: 'unresolved', failureReason: `Unique asset safety limit of ${MAX_ASSETS} reached.`, warnings: [] }; entries.set(key, skipped); }
        skipped.referenceCount++;
        if (detail.pageId && !skipped.referencingPageIds.includes(detail.pageId)) skipped.referencingPageIds.push(detail.pageId);
        return { accepted: false, reason: 'asset-limit', entry: skipped };
      }
      let entry = entries.get(identity.url);
      if (!entry) {
        entry = { assetId: `asset-${entries.size + 1}`, originalUrl: identity.url, canonicalFetchKey: identity.url, resourceType: detail.resourceType || 'other', discoverySources: [], referencingPageIds: [], referencingAssetIds: [], referenceCount: 0, status: 'DISCOVERED', attempts: 0, mimeType: '', byteSize: 0, contentHash: '', localArchivePath: '', rewriteStatus: 'pending', failureReason: '', warnings: [], bytes: null };
        entries.set(identity.url, entry);
      }
      entry.referenceCount++;
      if (detail.discoverySource && !entry.discoverySources.includes(detail.discoverySource)) entry.discoverySources.push(detail.discoverySource);
      if (detail.pageId && !entry.referencingPageIds.includes(detail.pageId)) entry.referencingPageIds.push(detail.pageId);
      if (detail.parentAssetId) {
        if (!entry.referencingAssetIds.includes(detail.parentAssetId)) entry.referencingAssetIds.push(detail.parentAssetId);
        const parent = [...entries.values()].find((candidate) => candidate.assetId === detail.parentAssetId);
        for (const pageId of parent?.referencingPageIds || []) if (!entry.referencingPageIds.includes(pageId)) entry.referencingPageIds.push(pageId);
      }
      return { accepted: true, entry, fragment: (() => { try { return new URL(reference, baseUrl).hash; } catch { return ''; } })() };
    }
    return { entries, register, get: (url) => entries.get(url), values: () => [...entries.values()] };
  }
  function classify(ref) {
    const s = String(ref).toLowerCase();
    if (/\.css(?:[?#]|$)/.test(s)) return 'css';
    if (/\.(?:m?js)(?:[?#]|$)/.test(s)) return 'js';
    if (/\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/.test(s)) return 'font';
    if (/\.svg(?:[?#]|$)/.test(s)) return 'svg';
    if (/\.(?:png|jpe?g|gif|webp|avif|ico)(?:[?#]|$)/.test(s)) return 'image';
    if (/\.(?:mp4|webm|mov|mp3|wav|ogg|m4a)(?:[?#]|$)/.test(s)) return 'media';
    return 'other';
  }
  function mapImageSetStrings(css, resolve) {
    const source = String(css);
    const expression = /image-set\s*\(/gi;
    let output = '';
    let cursor = 0;
    for (const match of source.matchAll(expression)) {
      const open = match.index + match[0].length - 1;
      let depth = 1, quote = '', escaped = false, close = open + 1;
      for (; close < source.length && depth; close++) {
        const char = source[close];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (quote) { if (char === quote) quote = ''; continue; }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === '(') depth++;
        else if (char === ')') depth--;
      }
      if (depth) break;
      const inner = source.slice(open + 1, close - 1).replace(/(^|,)(\s*)(["'])([^"']+)\3/g, (_all, prefix, space, delimiter, value) => {
        const resolved = resolve(value);
        return `${prefix}${space}${delimiter}${resolved || 'none'}${delimiter}`;
      });
      output += source.slice(cursor, open + 1) + inner + ')';
      cursor = close;
    }
    return output + source.slice(cursor);
  }
  function extractCssReferences(css) {
    const refs = [];
    const pattern = /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?|url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    const source = String(css);
    for (const match of source.matchAll(pattern)) if (!/^data:|^#|^javascript:/i.test(match[1] || match[2])) {
      const url = (match[1] || match[2]).trim();
      const before = source.slice(0, match.index);
      const inFontFace = before.lastIndexOf('@font-face') > before.lastIndexOf('}');
      refs.push({ url, source: match[1] ? 'css-import' : 'css-url', resourceType: match[1] ? 'css' : inFontFace ? 'font' : classify(url) === 'other' ? 'image' : classify(url) });
    }
    mapImageSetStrings(source, (url) => { if (!/^(?:data:|#|javascript:)/i.test(url)) refs.push({ url, source: 'css-image-set', resourceType: 'image' }); return url; });
    return refs;
  }
  function extractJsReferences(js) {
    const refs = [];
    const source = String(js);
    const isStaticUrl = (value) => /^(?:\.{1,2}\/|\/|https?:\/\/|\/\/)/i.test(value);
    let unresolvedImports = 0;
    const modulePatterns = [/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
    for (const pattern of modulePatterns) for (const match of source.matchAll(pattern)) {
      if (isStaticUrl(match[1])) refs.push({ url: match[1], source: 'static-js-module', resourceType: classify(match[1]) === 'other' ? 'js' : classify(match[1]) });
      else if (!/^(?:data:|#)/i.test(match[1])) unresolvedImports++;
    }
    for (const pattern of [/\b(?:src|href)\s*:\s*["']([^"']+)["']/g, /new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g]) for (const match of source.matchAll(pattern)) {
      if (isStaticUrl(match[1])) refs.push({ url: match[1], source: 'static-js-asset', resourceType: classify(match[1]) });
    }
    const dynamicImports = (source.match(/\bimport\s*\(\s*(?!["'])/g) || []).length;
    return { refs, dynamicImports, unresolvedImports };
  }
  const decodeHtmlAttribute = (value) => String(value || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'");
  function extractHtmlReferences(html, baseUrl) {
    const refs = [];
    const add = (s, source, resourceType) => { if (s && !/^data:|^javascript:|^#/i.test(s)) refs.push({ url: s, source, resourceType }); };
    const attrs = /<(script|img|source|video|audio|link|image|use|iframe)\b([^>]*)>/gi;
    for (const m of String(html).matchAll(attrs)) {
      const tag = m[1].toLowerCase(), a = m[2];
      const attr = (name) => decodeHtmlAttribute(a.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2]);
      const rel = (attr('rel') || '').toLowerCase();
      const ref = attr('src') || attr('poster') || attr('xlink:href') || (['use', 'image'].includes(tag) ? attr('href') : '') || (tag === 'link' && /stylesheet|preload|modulepreload|icon/.test(rel) ? attr('href') : '');
      const src = ref;
      if (src) {
        const as = (attr('as') || '').toLowerCase();
        const resourceType = tag === 'script' ? 'js' : tag === 'link' && /stylesheet/.test(rel) ? 'css' : tag === 'link' && /(?:preload|modulepreload)/.test(rel) ? ({ script: 'js', style: 'css', font: 'font', image: 'image' })[as] || classify(src) : tag === 'link' && /icon/.test(rel) ? (classify(src) === 'other' ? 'image' : classify(src)) : tag === 'use' ? 'svg' : tag === 'video' ? (attr('src') ? 'media' : 'image') : tag === 'audio' ? 'media' : ['img', 'source', 'image'].includes(tag) ? (classify(src) === 'other' ? 'image' : classify(src)) : classify(src);
        add(src, tag === 'iframe' ? 'unsupported-iframe' : `html-${tag}`, resourceType);
      }
      const srcset = attr('srcset');
      if (srcset) for (const candidate of srcset.split(',')) add(candidate.trim().split(/\s+/)[0], 'html-srcset', 'image');
    }
    for (const m of String(html).matchAll(/style\s*=\s*(["'])(.*?)\1/gi)) for (const ref of extractCssReferences(decodeHtmlAttribute(m[2]))) refs.push(ref);
    for (const m of String(html).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) for (const ref of extractCssReferences(m[1])) refs.push({ ...ref, source: `inline-${ref.source}` });
    return refs.map((x) => ({ ...x, baseUrl }));
  }
  function rewriteReferences(source, baseUrl, registry, parentPath = 'pages/page--docs.html') {
    const relative = (path) => {
      const from = parentPath.split('/').slice(0, -1);
      const to = path.split('/');
      while (from.length && to.length && from[0] === to[0]) { from.shift(); to.shift(); }
      return `${'../'.repeat(from.length)}${to.join('/')}`;
    };
    let output = String(source);
    const rewrite = (value) => {
      const result = registry.register(value, baseUrl);
      return result.accepted && result.entry.localArchivePath ? relative(result.entry.localArchivePath) + (result.fragment || '') : value;
    };
    output = output.replace(/\b(src|href|poster|xlink:href)=(['"])(.*?)\2/gi, (_all, name, quote, value) => `${name}=${quote}${rewrite(value)}${quote}`);
    output = output.replace(/(srcset\s*=\s*['"])(.*?)(['"])/gi, (_all, before, value, after) => `${before}${value.split(',').map((part) => { const [url, ...tail] = part.trim().split(/\s+/); return [rewrite(url), ...tail].join(' '); }).join(', ')}${after}`);
    output = output.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_all, quote, value) => `url(${quote}${rewrite(value)}${quote})`);
    return output;
  }
  function validateOfflineFiles(files) {
    const members = new Set(files.map((file) => file.path));
    const missing = [];
    const checkRef = (filePath, reference) => {
      const value = String(reference || '').trim();
      if (!value || value.startsWith('#') || /^(?:data:|mailto:|tel:|javascript:)/i.test(value)) return;
      if (/^(?:https?:)?\/\//i.test(value)) { missing.push(`${filePath} => remote ${value}`); return; }
      let resolved;
      try { resolved = new URL(value, `https://offline.invalid/${filePath}`).pathname.replace(/^\//, ''); }
      catch { missing.push(`${filePath} => invalid ${value}`); return; }
      if (!members.has(decodeURIComponent(resolved))) missing.push(`${filePath} => ${resolved}`);
    };
    for (const file of files) {
      if (/\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot)$/i.test(file.path) || /\.m?js$/i.test(file.path)) continue;
      const text = file.content ?? (file.bytes ? new TextDecoder().decode(file.bytes) : '');
      for (const match of text.matchAll(/\b(?:src|href|poster|xlink:href)=(['"])(.*?)\1/gi)) checkRef(file.path, match[2]);
      for (const match of text.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) checkRef(file.path, match[2]);
      for (const match of text.matchAll(/@import\s+(['"])(.*?)\1/gi)) checkRef(file.path, match[2]);
      for (const match of text.matchAll(/srcset=(['"])(.*?)\1/gi)) for (const candidate of match[2].split(',')) checkRef(file.path, candidate.trim().split(/\s+/)[0]);
      mapImageSetStrings(text, (reference) => { checkRef(file.path, reference); return reference; });
    }
    return { ok: missing.length === 0, missing };
  }
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  function containsCredentialContent(value) {
    const text = String(value || '');
    return /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/i.test(text)
      || /\b(?:authorization|proxy-authorization|cookie|set-cookie)\s*[:=]\s*["']?\s*(?:Bearer|Basic)\s+[A-Za-z0-9._~+/-]{12,}/i.test(text)
      || /\b(?:access[_-]?token|client[_-]?secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/i.test(text)
      || /[?&](?:token|secret|password|authorization|session|api[_-]?key|auth|jwt|ticket|code)=/i.test(text);
  }
  function safeSnapshot(html) {
    return String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '<!-- Script removed for safe static preview. -->')
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '<!-- Embedded frame omitted from static preview. -->')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, '<!-- Embedded object omitted from static preview. -->')
      .replace(/<embed\b[^>]*\/?>/gi, '<!-- Embedded object omitted from static preview. -->')
      .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, '<!-- Embedded foreign content omitted from static preview. -->')
      .replace(/<meta\b(?=[^>]*http-equiv\s*=\s*["']?refresh)[^>]*>/gi, '')
      .replace(/<form\b[^>]*>/gi, '<div>')
      .replace(/<\/form\s*>/gi, '</div>')
      .replace(/<base\b[^>]*>/gi, '')
      .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{12,}/gi, 'Bearer [REDACTED]')
      .replace(/\b(authorization|proxy-authorization|cookie|set-cookie)\s*([:=])\s*(["']?)(?:Bearer\s+)?[A-Za-z0-9._~+/-]{12,}(["']?)/gi, '$1$2$3[REDACTED]$4')
      .replace(/https?:\/\/[^\s"'<>]+/gi, (reference) => {
        try { const url = new URL(reference); return SECRET_NAME.test(url.href) || [...url.searchParams.keys()].some((key) => SECRET_QUERY.test(key)) ? `${url.origin}${url.pathname}?[redacted]` : reference; } catch { return reference; }
      });
  }
  function localizeReferences(html, baseUrl, registry, pagePath, pageIds) {
    const relative = (target) => {
      const from = pagePath.split('/').slice(0, -1), to = target.split('/');
      while (from.length && to.length && from[0] === to[0]) { from.shift(); to.shift(); }
      return `${'../'.repeat(from.length)}${to.join('/')}`;
    };
    const refPath = (value, isNav = false) => {
      if (String(value).startsWith('#')) return value;
      let resolved;
      try { resolved = new URL(value, baseUrl); } catch { return ''; }
      if (isNav && resolved.origin === new URL(baseUrl).origin) {
        const id = resolved.searchParams.get('path')?.match(/^\/docs\/(.+)$/)?.[1];
        if (id && pageIds.has(id)) return relative(pageIds.get(id)) + resolved.hash;
      }
      const identity = canonicalize(value, baseUrl, new URL(baseUrl).origin);
      if (!identity.ok) return '';
      const entry = registry.get(identity.url);
      return entry?.status === 'DOWNLOADED' && entry.localArchivePath ? relative(entry.localArchivePath) + resolved.hash : '';
    };
    let output = safeSnapshot(html);
    output = output.replace(/<(script|img|source|video|audio|link|image|use|a)\b([^>]*)>/gi, (tagText, tagName, attrs) => {
      const tag = tagName.toLowerCase();
      const attrPattern = /\s+(src|href|poster|xlink:href)=(['"])(.*?)\2/gi;
      let replaced = attrs.replace(attrPattern, (all, name, quote, value) => {
        const decoded = decodeHtmlAttribute(value);
        const isNavigation = tag === 'a' || tag === 'link' && name.toLowerCase() === 'href' && !/rel\s*=\s*['"](?:stylesheet|preload|modulepreload|icon)/i.test(attrs);
        const local = refPath(decoded, isNavigation);
        return local ? ` ${name}=${quote}${escapeHtml(local)}${quote}` : '';
      });
      replaced = replaced.replace(/\s+srcset=(['"])(.*?)\1/gi, (_m, quote, value) => {
        const pairs = decodeHtmlAttribute(value).split(',').map((part) => { const [url, ...descriptor] = part.trim().split(/\s+/); const local = refPath(url); return local ? `${local}${descriptor.length ? ` ${descriptor.join(' ')}` : ''}` : ''; }).filter(Boolean);
        return pairs.length ? ` srcset=${quote}${escapeHtml(pairs.join(', '))}${quote}` : '';
      });
      return `<${tagName}${replaced}>`;
    });
    const rewriteCssText = (css) => {
      let text = mapImageSetStrings(decodeHtmlAttribute(css), (value) => /^(?:data:|#)/i.test(value) ? value : refPath(value));
      text = text.replace(/@import\s+(?:url\(\s*)?(['"]?)([^'";)\s]+)\1\s*\)?\s*;/gi, (_all, quote, value) => {
        const local = refPath(value);
        return local ? `@import url("${local}");` : '/* remote or missing stylesheet import omitted */';
      }).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_all, quote, value) => {
        if (/^(?:data:|#)/i.test(value)) return `url(${quote}${value}${quote})`;
        const local = refPath(value);
        return local ? `url("${local}")` : 'none';
      });
      return text;
    };
    output = output.replace(/\s+style=(['"])(.*?)\1/gi, (_all, quote, css) => ` style=${quote}${escapeHtml(rewriteCssText(css))}${quote}`);
    output = output.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_all, open, css, close) => `${open}${rewriteCssText(css)}${close}`);
    return output;
  }
  function slugId(id) {
    const clean = String(id || '').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'docs';
    const safe = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(clean) ? `_${clean}` : clean;
    return `pages/${safe}.html`;
  }
  function rewriteCss(css, baseUrl, registry, parentPath) {
    const relative = (target) => {
      const from = parentPath.split('/').slice(0, -1), to = target.split('/');
      while (from.length && to.length && from[0] === to[0]) { from.shift(); to.shift(); }
      return `${'../'.repeat(from.length)}${to.join('/')}`;
    };
    let output = mapImageSetStrings(css, (ref) => {
      if (/^(?:data:|#)/i.test(ref)) return ref;
      const checked = canonicalize(ref, baseUrl, new URL(baseUrl).origin);
      const asset = checked.ok && registry.get(checked.url);
      return asset?.status === 'DOWNLOADED' ? relative(asset.localArchivePath) + new URL(ref, baseUrl).hash : '';
    });
    output = output.replace(/@import\s+(?:url\(\s*)?(['"]?)([^'";)\s]+)\1\s*\)?\s*;/gi, (_all, _q, ref) => {
      const checked = canonicalize(ref, baseUrl, new URL(baseUrl).origin);
      const asset = checked.ok && registry.get(checked.url);
      let fragment = ''; try { fragment = new URL(ref, baseUrl).hash; } catch {}
      return asset?.status === 'DOWNLOADED' ? `@import url("${relative(asset.localArchivePath)}${fragment}");` : '/* missing stylesheet import omitted */';
    });
    output = output.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_all, quote, ref) => {
      if (/^(?:data:|#)/i.test(ref)) return `url(${quote}${ref}${quote})`;
      const checked = canonicalize(ref, baseUrl, new URL(baseUrl).origin);
      const asset = checked.ok && registry.get(checked.url);
      let fragment = ''; try { fragment = new URL(ref, baseUrl).hash; } catch {}
      return asset?.status === 'DOWNLOADED' ? `url("${relative(asset.localArchivePath)}${fragment}")` : 'none';
    });
    return output;
  }
  function rewriteJs(js, baseUrl, registry, parentPath) {
    const relative = (target) => {
      const from = parentPath.split('/').slice(0, -1), to = target.split('/');
      while (from.length && to.length && from[0] === to[0]) { from.shift(); to.shift(); }
      const value = `${'../'.repeat(from.length)}${to.join('/')}`;
      return value.startsWith('.') ? value : `./${value}`;
    };
    const replaceLiteral = (all, prefix, quote, specifier) => {
      if (/^(?:data:|#)/i.test(specifier)) return all;
      const checked = canonicalize(specifier, baseUrl, new URL(baseUrl).origin);
      if (!checked.ok) return `${prefix}${quote}data:text/javascript,export%20default%20undefined${quote}`;
      const asset = registry.get(checked.url);
      let fragment = ''; try { fragment = new URL(specifier, baseUrl).hash; } catch {}
      return asset?.status === 'DOWNLOADED' ? `${prefix}${quote}${relative(asset.localArchivePath)}${fragment}${quote}` : `${prefix}${quote}data:text/javascript,export%20default%20undefined${quote}`;
    };
    const replaceAsset = (all, prefix, quote, specifier, suffix = '') => {
      if (/^(?:data:|#)/i.test(specifier)) return all;
      const checked = canonicalize(specifier, baseUrl, new URL(baseUrl).origin);
      const asset = checked.ok && registry.get(checked.url);
      if (asset?.status === 'DOWNLOADED') return `${prefix}${quote}${relative(asset.localArchivePath)}${new URL(specifier, baseUrl).hash}${quote}${suffix}`;
      return `${prefix}${quote}data:application/octet-stream,offline-resource-omitted${quote}${suffix}`;
    };
    return String(js)
      .replace(/((?:import|export)\s+(?:[^'";]*?\s+from\s+)?)(['"])([^'"]+)\2/g, replaceLiteral)
      .replace(/(\bimport\s*\(\s*)(['"])([^'"]+)\2(\s*\))/g, (_all, prefix, quote, specifier, suffix) => `${replaceLiteral('', prefix, quote, specifier)}${suffix}`)
      .replace(/(\b(?:src|href)\s*:\s*)(['"])([^'"]+)\2/g, replaceAsset)
      .replace(/(new\s+URL\(\s*)(['"])([^'"]+)\2(\s*,\s*import\.meta\.url\s*\))/g, replaceAsset);
  }
  function buildOfflineDocuments(pages, registry, { sourceUrl, createdAt = new Date().toISOString(), scope = 'all', discoveredCount = pages.length } = {}) {
    const files = [
      { path: 'pages/', content: '' }, { path: 'assets/', content: '' },
      ...['css', 'js', 'images', 'fonts', 'svg', 'other'].map((directory) => ({ path: `assets/${directory}/`, content: '' })),
    ];
    const usedPagePaths = new Map();
    const pathForPage = (id) => {
      const base = slugId(id);
      const keyFor = (path) => path.toLocaleLowerCase('en-US');
      const baseKey = keyFor(base);
      if (!usedPagePaths.has(baseKey)) { usedPagePaths.set(baseKey, id); return base; }
      if (usedPagePaths.get(baseKey) === id) return base;
      let hash = 2166136261; for (const char of String(id)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      let path;
      let attempt = 0;
      do {
        const suffix = `${(hash >>> 0).toString(16)}${attempt ? `-${attempt}` : ''}`;
        path = base.replace(/\.html$/, `-${suffix}.html`);
        attempt++;
      } while (usedPagePaths.has(keyFor(path)) && usedPagePaths.get(keyFor(path)) !== id);
      usedPagePaths.set(keyFor(path), id); return path;
    };
    const pageIds = new Map(pages.filter((page) => page.status !== 'FAILED').map((page) => [page.id, pathForPage(page.id)]));
    const pageResults = pages.map((page) => {
      if (!page.html || page.status === 'FAILED') { const warnings = [page.error || 'No usable rendered snapshot was captured.']; return { id: page.id, title: page.title || page.id, name: page.entry?.name || '', tags: page.entry?.tags || [], category: page.entry?.category || '', categorySource: page.entry?.categorySource || '', categoryConfidence: page.entry?.categoryConfidence || '', categoryEvidence: page.entry?.categoryEvidence || '', sourceUrl: sanitizeUrl(page.url), path: '', status: 'FAILED', warningCount: warnings.length, failureCount: 1, warnings }; }
      const path = pageIds.get(page.id);
      const failedRefs = registry.values().filter((asset) => asset.referencingPageIds.includes(page.id) && asset.status !== 'DOWNLOADED');
      const missingNavTargets = [];
      for (const match of page.html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(.*?)\1/gi)) {
        try {
          const target = new URL(match[2], page.url);
          const id = target.searchParams.get('path')?.match(/^\/docs\/(.+)$/)?.[1];
          if (target.origin === new URL(page.url).origin && id && !pageIds.has(id) && !missingNavTargets.includes(id)) missingNavTargets.push(id);
        } catch {}
      }
      const status = failedRefs.length || missingNavTargets.length ? 'PARTIAL' : 'STATIC_READY';
      const local = localizeReferences(page.html, page.url, registry, path, pageIds);
      files.push({ path, content: local });
      const warnings = [...failedRefs.map((asset) => `Unresolved ${asset.discoverySources.join(', ') || asset.resourceType}: ${asset.originalUrl || asset.failureReason}`), ...missingNavTargets.map((id) => `Internal Docs navigation target was not included: ${id}`)];
      return { id: page.id, title: page.title || page.id, name: page.entry?.name || '', tags: page.entry?.tags || [], storybookTitle: page.entry?.title && page.entry.title !== page.id ? page.entry.title : (page.title || page.id), category: page.entry?.category || '', categorySource: page.entry?.categorySource || '', categoryConfidence: page.entry?.categoryConfidence || '', categoryEvidence: page.entry?.categoryEvidence || '', sourceUrl: sanitizeUrl(page.url), path, frame: page.readiness || null, status, warningCount: warnings.length, failureCount: failedRefs.filter((asset) => asset.status === 'FAILED').length, warnings };
    });
    for (const entry of registry.values()) if (entry.status === 'DOWNLOADED' && entry.bytes) files.push({ path: entry.localArchivePath, bytes: entry.bytes });
    const tree = { children: new Map(), page: null };
    for (const page of pageResults) {
      const parts = String(page.storybookTitle || page.title).split(/[\\/]/).map((part) => part.trim()).filter(Boolean);
      let node = tree;
      for (const part of parts) { if (!node.children.has(part)) node.children.set(part, { children: new Map(), page: null }); node = node.children.get(part); }
      node.page = page;
    }
    const renderTree = (node) => `<ul>${[...node.children].map(([label, child]) => `<li>${child.page ? (child.page.path ? `<a href="${escapeHtml(child.page.path)}">${escapeHtml(label)}</a>${child.page.status === 'PARTIAL' ? ' <small>Partial</small>' : ''}` : `${escapeHtml(label)} (failed) <small>${child.page.status}</small>`) : escapeHtml(label)}${child.page && child.children.size ? renderTree(child) : child.children.size ? renderTree(child) : ''}</li>`).join('')}</ul>`;
    const nav = renderTree(tree);
    for (const page of pageResults.filter((candidate) => candidate.path)) {
      const file = files.find((candidate) => candidate.path === page.path);
      if (!file) continue;
      const related = pageResults.filter((candidate) => candidate.path && candidate.id !== page.id).map((candidate) => `<a href="${escapeHtml(candidate.path.replace(/^pages\//, ''))}">${escapeHtml(candidate.storybookTitle || candidate.title)}</a>`).join(' · ');
      const pageNav = `<nav aria-label="Offline documentation navigation" style="margin:0 0 1.5rem;padding:.75rem;border-bottom:1px solid #bbb"><a href="../index.html">All Docs</a>${related ? ` · ${related}` : ''}</nav>`;
      const body = /<body\b[^>]*>/i;
      file.content = body.test(file.content) ? file.content.replace(body, (opening) => `${opening}${pageNav}`) : file.content.replace(/<\/html\s*>/i, `<body>${pageNav}</body></html>`);
    }
    files.push({ path: 'index.html', content: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline Storybook Docs</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:1100px;margin:2rem auto;padding:0 1rem}nav li{margin:.4rem 0}small{color:#666}</style><h1>Offline Storybook Docs</h1><p>Static documentation snapshot. Interactive Storybook behavior is not included.</p><nav aria-label="Documentation pages">${nav}</nav></html>` });
    const failedAssets = registry.values().filter((asset) => asset.status !== 'DOWNLOADED');
    const packagedSizeByPath = new Map(registry.values().filter((asset) => asset.status === 'DOWNLOADED' && asset.bytes).map((asset) => [asset.localArchivePath, asset.bytes.byteLength]));
    const manifest = { schemaVersion: 1, format: 'storybook-offline-static', sourceOrigin: (() => { try { return new URL(sourceUrl).origin; } catch { return ''; } })(), capturedAt: createdAt, scope, discoveredPages: discoveredCount, selectedPages: pages.length, completedPages: pageResults.filter((page) => page.status === 'STATIC_READY').length, partialPages: pageResults.filter((page) => page.status === 'PARTIAL').length, failedPages: pageResults.filter((page) => page.status === 'FAILED').length, pages: pageResults, assetsManifest: 'ASSET_MANIFEST.json', limitations: ['Static snapshot only; scripts are removed and interactive behavior is not claimed.'] };
    const assetManifest = registry.values().map(({ assetId, resourceType, originalUrl, canonicalFetchKey, referencingPageIds: referringPageIds, referencingAssetIds: referringAssetIds, discoverySources, status, attempts, mimeType, byteSize, downloadedByteSize, contentHash, localArchivePath, rewriteStatus, failureReason, warnings }) => ({ assetId, type: resourceType, source: sanitizeUrl(originalUrl), canonicalResourceIdentity: sanitizeUrl(canonicalFetchKey), referringPageIds, referringAssetIds, discoveryEvidence: discoverySources, status, attempts, mimeType, byteSize: downloadedByteSize ?? byteSize, packagedByteSize: packagedSizeByPath.get(localArchivePath) || 0, contentHash, localArchivePath, rewriteStatus, error: failureReason, warnings }));
    const totals = { urlReferences: registry.values().reduce((n, a) => n + (a.referenceCount || 1), 0), urlDuplicates: registry.values().reduce((n, a) => n + (a.referenceCount || 1), 0) - registry.values().length, contentDuplicates: registry.values().filter((a) => a.warnings.some((w) => w.includes('shares an archive'))).length, downloadedBytes: registry.values().reduce((n, a) => n + (a.status === 'DOWNLOADED' ? (a.downloadedByteSize ?? a.byteSize) : 0), 0), packagedBytes: files.reduce((n, file) => n + (file.bytes?.byteLength || new TextEncoder().encode(file.content || '').byteLength), 0) };
    const byType = Object.fromEntries(['css', 'js', 'font', 'image', 'svg', 'other'].map((type) => [type, failedAssets.filter((asset) => asset.resourceType === type).length]));
    const dynamicImports = registry.values().flatMap((asset) => asset.warnings.filter((warning) => warning.includes('dynamic import')).map((warning) => `${asset.assetId}: ${warning}`));
    const outcomeLines = pageResults.map((page) => {
      const warnings = page.warnings.slice(0, 8).map((warning) => `  - ${String(warning).replace(/[\r\n]+/g, ' ')}`);
      if (page.warnings.length > 8) warnings.push(`  - ${page.warnings.length - 8} additional warnings are available in manifest.json.`);
      return [`- ${page.status}: ${String(page.storybookTitle || page.title).replace(/[\r\n]+/g, ' ')} (${page.id})${page.path ? ` — pages/${page.path.split('/').pop()}` : ''}`, ...warnings].join('\n');
    }).join('\n');
    const report = `# Offline export report\n\n## Page coverage\n- Discovered Docs: ${discoveredCount}\n- Selected Docs: ${pages.length}\n- STATIC_READY: ${pageResults.filter((p) => p.status === 'STATIC_READY').length}\n- PARTIAL: ${pageResults.filter((p) => p.status === 'PARTIAL').length}\n- FAILED: ${pageResults.filter((p) => p.status === 'FAILED').length}\n- Omitted by the 120-entry safety cap: ${Math.max(0, discoveredCount - pages.length)}\n\n## Page outcomes\n${outcomeLines}\n\n## Asset coverage\n- Resource references observed: ${totals.urlReferences}\n- Unique canonical resources: ${registry.values().length}\n- Duplicate URL fetches avoided: ${Math.max(0, totals.urlDuplicates)}\n- Identical content entries sharing a member: ${totals.contentDuplicates}\n- Downloaded resources: ${registry.values().filter((a) => a.status === 'DOWNLOADED').length}\n- Failed: ${registry.values().filter((a) => a.status === 'FAILED').length}\n- Skipped: ${registry.values().filter((a) => a.status === 'SKIPPED').length}\n- Downloaded resource bytes: ${totals.downloadedBytes}\n- Packaged uncompressed bytes: ${totals.packagedBytes}\n\n## Missing dependencies\n- CSS: ${byType.css}\n- JavaScript: ${byType.js}\n- Fonts: ${byType.font}\n- Images: ${byType.image}\n- SVG/other static resources: ${byType.svg + byType.other}\n- Unsupported iframe references: ${registry.values().filter((asset) => asset.failureReason?.includes('iframe')).length}\n- Dynamic/runtime-only imports observed: ${dynamicImports.length}\n${failedAssets.map((a) => `- ${a.resourceType}: ${sanitizeUrl(a.originalUrl)} — ${a.failureReason || a.status}`).join('\n') || '- No failed dependency records.'}\n${dynamicImports.map((warning) => `- Unsupported dynamic dependency: ${warning}`).join('\n')}\n\n## Offline validation\n- Observed: page metadata, discovered resource references, HTTP responses, and local archive path consistency were checked during export.\n- Inferred: resources not observed during capture may still be required by runtime-only behavior.\n- Generated local index and page-link paths: checked structurally before packaging.\n- Local CSS/image/font paths: rewritten when the resource downloaded; missing references are removed and listed above.\n- Remaining external network references: blocked by same-origin rewriting policy for supported resource attributes.\n- Browser/file:// validation: not established by this archive generator.\n- Static fidelity limitations: stylesheet coverage is best-effort; canvas and runtime-rendered content can be absent.\n- Interactive compatibility: scripts are removed; APIs and interactions are unsupported.\n\n## Security\n- Export scope: ${scope}.\n- Approved origin: ${sanitizeUrl(sourceUrl)}\n- Secret-bearing and off-origin resources are skipped. No cookies or browser storage are read or exported.\n- Review organizational policy and archive handling before storage or transfer.\n`;
    files.push({ path: 'manifest.json', content: JSON.stringify(manifest, null, 2) });
    files.push({ path: 'ASSET_MANIFEST.json', content: JSON.stringify(assetManifest, null, 2) });
    files.push({ path: 'OFFLINE_REPORT.md', content: report });
    files.push({ path: 'README.md', content: '# Offline Storybook Docs\n\nOpen `index.html` to browse the static capture. If `file://` blocks local resources in your browser, serve this directory using a local HTTP server. This is not a complete or interactive Storybook deployment.\n' });
    return { files, manifest, assetManifest, pageResults };
  }
  async function buildOfflineSite(pages, { approvedOrigin, fetchImpl = fetch, signal, pauseRequested = () => false, onPauseState = () => {}, onProgress = () => {}, onAssetDiscovered = () => {}, onPhase = () => {}, loadStagedAsset, stageAsset, maxResourceBytes, maxTotalBytes, concurrency = CONCURRENCY, sourceUrl, scope = 'all', discoveredCount = pages.length } = {}) {
    const registry = createRegistry(approvedOrigin);
    let pageBytes = 0;
    const boundedPages = pages.map((page) => {
      if (!page.html || page.status === 'FAILED') return page;
      const size = new TextEncoder().encode(page.html).byteLength;
      if (size > MAX_PAGE_BYTES) return { ...page, html: '', status: 'FAILED', error: `Rendered Docs snapshot exceeds ${MAX_PAGE_BYTES} byte per-page limit.` };
      if (pageBytes + size > MAX_PAGES_TOTAL_BYTES) return { ...page, html: '', status: 'FAILED', error: `Rendered Docs snapshots exceed ${MAX_PAGES_TOTAL_BYTES} byte total limit.` };
      pageBytes += size;
      return page;
    });
    for (const page of boundedPages) {
    for (const ref of extractHtmlReferences(page.html || '', page.url)) {
        const found = registry.register(ref.url, ref.baseUrl, { pageId: page.id, discoverySource: ref.source, resourceType: ref.resourceType || classify(ref.url) });
        if (ref.source === 'unsupported-iframe' && found.entry) { found.entry.status = 'SKIPPED'; found.entry.failureReason = 'Embedded iframe content is unsupported in static mode.'; }
      }
      for (const resource of page.performanceResources || []) registry.register(resource.url, page.url, { pageId: page.id, discoverySource: `performance:${resource.initiatorType}`, resourceType: classify(resource.url) });
    }
    const notifiedAssets = new Set();
    const notifyDiscovered = () => { for (const asset of registry.values()) if (!notifiedAssets.has(asset.assetId)) { notifiedAssets.add(asset.assetId); onAssetDiscovered(asset); } };
    notifyDiscovered();
    const scheduler = makeScheduler({ concurrency, fetchImpl, signal, pauseRequested, onPauseState, onProgress, loadStagedAsset, stageAsset, maxResourceBytes, maxTotalBytes });
    const scanned = new Set();
    for (let depth = 0; depth < 8; depth++) {
      const todo = registry.values().filter((asset) => asset.status === 'DISCOVERED' && asset.canonicalFetchKey && !scanned.has(asset.canonicalFetchKey));
      if (!todo.length) { if (pauseRequested()) await scheduler.run([], approvedOrigin); break; }
      for (const asset of todo) scanned.add(asset.canonicalFetchKey);
      await scheduler.run(todo, approvedOrigin);
      for (const asset of todo) {
        if (asset.status !== 'DOWNLOADED' || !asset.bytes) continue;
        const text = asset.resourceType === 'css' || asset.resourceType === 'js' ? new TextDecoder().decode(asset.bytes) : '';
        if (asset.resourceType === 'css') for (const ref of extractCssReferences(text)) registry.register(ref.url, asset.originalUrl, { parentAssetId: asset.assetId, discoverySource: ref.source, resourceType: ref.resourceType || classify(ref.url) });
        if (asset.resourceType === 'js') {
          const scannedJs = extractJsReferences(text);
          if (scannedJs.dynamicImports) asset.warnings.push(`${scannedJs.dynamicImports} unresolved non-literal dynamic import(s).`);
          if (scannedJs.unresolvedImports) asset.warnings.push(`${scannedJs.unresolvedImports} bare or non-URL module specifier(s) could not be resolved safely.`);
          for (const ref of scannedJs.refs) registry.register(ref.url, asset.originalUrl, { parentAssetId: asset.assetId, discoverySource: ref.source, resourceType: ref.resourceType || classify(ref.url) });
        }
        if (asset.resourceType === 'svg') for (const ref of extractHtmlReferences(text, asset.originalUrl)) registry.register(ref.url, ref.baseUrl, { parentAssetId: asset.assetId, discoverySource: `svg-${ref.source}`, resourceType: ref.resourceType || classify(ref.url) });
      }
      notifyDiscovered();
    }
    onPhase('rewriting-references');
    for (const asset of registry.values()) if (asset.status === 'DOWNLOADED' && asset.bytes && ['css', 'js', 'svg'].includes(asset.resourceType)) {
      const text = new TextDecoder().decode(asset.bytes);
      const rewritten = asset.resourceType === 'css' ? rewriteCss(text, asset.originalUrl, registry, asset.localArchivePath) : asset.resourceType === 'js' ? rewriteJs(text, asset.originalUrl, registry, asset.localArchivePath) : safeSnapshot(localizeReferences(text, asset.originalUrl, registry, asset.localArchivePath, new Map()));
      asset.bytes = new TextEncoder().encode(rewritten);
      asset.byteSize = asset.bytes.byteLength; asset.rewriteStatus = 'rewritten';
      if (asset.resourceType === 'js' && rewritten.includes('data:text/javascript,export%20default%20undefined')) asset.warnings.push('One or more unresolved/external static imports were replaced with inert empty modules.');
      if (asset.resourceType === 'js' && rewritten.includes('offline-resource-omitted')) asset.warnings.push('One or more unresolved static asset references were replaced with inert data URLs.');
    }
    onPhase('generating-offline-site');
    for (const asset of registry.values()) if (asset.status === 'DOWNLOADED' && asset.rewriteStatus === 'pending') asset.rewriteStatus = asset.resourceType === 'js' ? 'inventoried-static-only' : 'localized';
    const generated = buildOfflineDocuments(boundedPages.map((page) => ({ ...page, references: extractHtmlReferences(page.html || '', page.url) })), registry, { sourceUrl, scope, discoveredCount });
    const localCheck = validateOfflineFiles(generated.files);
    if (!localCheck.ok) throw new Error(`Offline archive contains unresolved local links: ${localCheck.missing.slice(0, 5).join(', ')}`);
    return { ...generated, registry, localCheck, downloadStats: { downloadedBytes: registry.values().reduce((n, a) => n + (a.status === 'DOWNLOADED' ? (a.downloadedByteSize ?? a.byteSize ?? 0) : 0), 0) } };
  }
  const extensionFor = (entry) => {
    const mime = String(entry.mimeType || '').split(';')[0].trim().toLowerCase();
    const byMime = { 'text/css': '.css', 'text/javascript': '.js', 'application/javascript': '.js', 'image/svg+xml': '.svg', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif', 'image/x-icon': '.ico', 'font/woff': '.woff', 'font/woff2': '.woff2', 'font/ttf': '.ttf', 'font/otf': '.otf', 'audio/mpeg': '.mp3', 'audio/ogg': '.ogg', 'video/mp4': '.mp4', 'video/webm': '.webm' };
    if (byMime[mime]) return byMime[mime];
    return (() => { try { const name = new URL(entry.originalUrl).pathname.split('/').pop(); const dot = name.lastIndexOf('.'); return dot > 0 && /^[a-z0-9]{1,8}$/i.test(name.slice(dot + 1)) ? `.${name.slice(dot + 1).toLowerCase()}` : ''; } catch { return ''; } })();
  };
  const pathFor = (entry) => {
    const type = entry.resourceType || classify(entry.originalUrl);
    const ext = extensionFor(entry);
    const pathIdentity = ['css', 'js', 'svg'].includes(type) ? entry.assetId : entry.contentHash || entry.assetId;
    return `assets/${TYPE_DIR[type] || 'other'}/${pathIdentity}${ext}`;
  };
  async function digest(bytes) {
    if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable in this browser context.');
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map((n) => n.toString(16).padStart(2, '0')).join('');
  }
  function makeScheduler({ concurrency = CONCURRENCY, fetchImpl = fetch, signal, pauseRequested = () => false, onPauseState = () => {}, onProgress = () => {}, loadStagedAsset = async () => null, stageAsset = async () => {}, maxResourceBytes = MAX_RESOURCE_BYTES, maxTotalBytes = MAX_TOTAL_BYTES, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    const inflight = new Map();
    const content = new Map();
    let downloadedBytes = 0, transferredBytes = 0, reservedBytes = 0;
    let active = 0, peak = 0, pausedNotified = false;
    async function download(entry, approvedOrigin) {
      if (entry.status === 'DOWNLOADED') return entry;
      if (entry.status === 'SKIPPED' || !entry.canonicalFetchKey) { entry.status = 'SKIPPED'; onProgress(entry); return entry; }
      if (inflight.has(entry.canonicalFetchKey)) return inflight.get(entry.canonicalFetchKey);
      const promise = (async () => {
        entry.status = 'QUEUED'; onProgress(entry);
        try {
          const staged = await loadStagedAsset(entry);
          if (staged?.bytes && staged.contentHash && await digest(staged.bytes) === staged.contentHash) {
            const bytes = new Uint8Array(staged.bytes);
            entry.contentHash = staged.contentHash; entry.mimeType = staged.mimeType; entry.byteSize = bytes.byteLength; entry.downloadedByteSize = bytes.byteLength;
            const contentKey = `${entry.resourceType}:${entry.mimeType}:${entry.contentHash}:${extensionFor(entry)}`;
            if (!['css', 'js', 'svg'].includes(entry.resourceType) && content.has(contentKey)) { entry.bytes = null; entry.localArchivePath = content.get(contentKey).localArchivePath; entry.warnings.push('Identical content shares an archive member.'); }
            else {
              if (downloadedBytes + entry.byteSize > maxTotalBytes) throw new Error('Offline export exceeds total staging size limit.');
              entry.bytes = bytes; entry.localArchivePath = pathFor(entry); downloadedBytes += entry.byteSize;
              if (!['css', 'js', 'svg'].includes(entry.resourceType)) content.set(contentKey, entry);
            }
            entry.status = 'DOWNLOADED'; onProgress(entry); return entry;
          }
        } catch (error) { entry.warnings.push(`Could not restore staged resource: ${String(error.message || error).slice(0, 120)}`); }
        for (let attempt = 0; attempt <= RETRIES; attempt++) {
          if (signal?.aborted) throw new Error('Cancelled');
          entry.status = 'DOWNLOADING'; entry.attempts++; active++; peak = Math.max(peak, active); onProgress(entry);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);
          const relay = () => controller.abort(signal.reason || new Error('Cancelled'));
          signal?.addEventListener('abort', relay, { once: true });
          try {
            const response = await fetchImpl(entry.canonicalFetchKey, { credentials: 'omit', redirect: 'error', signal: controller.signal, cache: 'no-store' });
            const final = new URL(response.url || entry.canonicalFetchKey);
            if (final.origin !== approvedOrigin) throw new Error('Redirect outside approved Storybook origin.');
            if (!response.ok) {
              const error = new Error(`HTTP ${response.status}`); error.status = response.status; error.retryAfter = response.headers.get('Retry-After'); throw error;
            }
            const type = response.headers.get('Content-Type') || '';
            if (/text\/html/i.test(type)) throw new Error('HTML response rejected (possible login/error page).');
            if (!compatibleMime(type, entry.resourceType)) throw new Error(`Unexpected content type for ${entry.resourceType} resource.`);
            const declared = Number(response.headers.get('Content-Length') || 0);
            if (declared > maxResourceBytes) throw new Error('Resource exceeds per-resource size limit.');
            const buffer = await readBounded(response, maxResourceBytes, controller);
            const lead = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 32))).trimStart().toLowerCase();
            if (/^(?:<!doctype\s+html|<html\b)/.test(lead)) throw new Error('HTML response rejected (possible login/error page).');
            if (entry.resourceType === 'other' && /^(?:\{|\[)/.test(lead)) throw new Error('JSON-like response rejected; dynamic/API response bodies are not collected.');
            if (['css', 'js', 'svg'].includes(entry.resourceType) && containsCredentialContent(new TextDecoder().decode(buffer))) throw new Error('Potential embedded credential or secret detected; text asset excluded.');
            if (transferredBytes + reservedBytes + buffer.byteLength > maxTotalBytes) throw new Error('Offline export exceeds total staging size limit.');
            reservedBytes += buffer.byteLength;
            try {
              const hash = await digest(buffer);
              const mime = mimeType(entry.originalUrl, type);
              entry.mimeType = mime; entry.byteSize = buffer.byteLength; entry.downloadedByteSize = buffer.byteLength; entry.contentHash = hash;
              const contentKey = `${entry.resourceType}:${mime}:${hash}:${extensionFor(entry)}`;
              const duplicate = ['css', 'js', 'svg'].includes(entry.resourceType) ? null : content.get(contentKey);
              if (duplicate) {
                entry.localArchivePath = duplicate.localArchivePath;
                entry.status = 'DOWNLOADED'; entry.bytes = null; entry.warnings.push('Identical content shares an archive member.');
              } else {
                if (downloadedBytes + buffer.byteLength > maxTotalBytes) throw new Error('Offline export exceeds total staging size limit.');
                entry.bytes = new Uint8Array(buffer); entry.localArchivePath = pathFor(entry);
                await stageAsset(entry);
                entry.status = 'DOWNLOADED'; if (!['css', 'js', 'svg'].includes(entry.resourceType)) content.set(contentKey, entry); downloadedBytes += buffer.byteLength;
              }
              transferredBytes += buffer.byteLength;
              onProgress(entry); return entry;
            } finally { reservedBytes -= buffer.byteLength; }
          } catch (error) {
            entry.failureReason = String(error.message || error).slice(0, 250);
            if (entry.status !== 'DOWNLOADED') entry.bytes = null;
            const permanent = error.status && error.status < 500 && error.status !== 429 || /redirect outside|HTML response|content type|JSON-like|credential or secret|size limit|staging storage\/quota/i.test(entry.failureReason);
            if (signal?.aborted || permanent || attempt === RETRIES) { entry.status = signal?.aborted ? 'SKIPPED' : 'FAILED'; onProgress(entry); return entry; }
            let delay = Math.min(4000, 250 * 2 ** attempt);
            const retryAfter = Number(error.retryAfter);
            const retryDate = Date.parse(error.retryAfter || '');
            if (Number.isFinite(retryAfter) && retryAfter > 0) delay = Math.min(10000, retryAfter * 1000);
            else if (Number.isFinite(retryDate)) delay = Math.min(10000, Math.max(0, retryDate - Date.now()));
            await new Promise((resolve) => setTimeout(resolve, delay));
          } finally {
            clearTimeout(timer); signal?.removeEventListener('abort', relay); active--;
          }
        }
        entry.status = 'FAILED'; return entry;
      })().finally(() => inflight.delete(entry.canonicalFetchKey));
      inflight.set(entry.canonicalFetchKey, promise);
      return promise;
    }
    async function run(entries, approvedOrigin) {
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.max(1, Math.min(10, concurrency)) }, async () => {
        while (!signal?.aborted) {
          if (pauseRequested()) {
            if (!pausedNotified) { pausedNotified = true; onPauseState(true); }
            await new Promise((resolve) => setTimeout(resolve, 100)); continue;
          }
          if (pausedNotified) { pausedNotified = false; onPauseState(false); }
          const entry = entries[cursor++]; if (!entry) break; await download(entry, approvedOrigin);
        }
      }));
      return { downloadedBytes, peakConcurrency: peak, entries };
    }
    return { run, download, get active() { return active; }, get downloadedBytes() { return downloadedBytes; }, get transferredBytes() { return transferredBytes; } };
  }
  function sanitizeUrl(reference) { try { const u = new URL(reference); if (SECRET_NAME.test(u.href) || [...u.searchParams.keys()].some((key) => SECRET_QUERY.test(key))) return `${u.origin}${u.pathname}?<redacted>`; u.username = ''; u.password = ''; return u.href; } catch { return ''; } }
  const api = { CONCURRENCY, MAX_RESOURCE_BYTES, MAX_TOTAL_BYTES, MAX_PAGE_BYTES, MAX_PAGES_TOTAL_BYTES, createRegistry, canonicalize, classify, extractHtmlReferences, extractCssReferences, extractJsReferences, makeScheduler, pathFor, rewriteReferences, sanitizeUrl, buildOfflineSite, validateOfflineFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.StorybookOffline = api;
})(globalThis);
