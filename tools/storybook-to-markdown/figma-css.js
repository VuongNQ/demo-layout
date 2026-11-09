const MAX_CSS_LENGTH = 2_000_000;
const OBSERVED_GROUPS = {
  dimensions: {
    known: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'inline-size', 'block-size', 'aspect-ratio'],
    matches: (property) => /^(?:width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|aspect-ratio)$/.test(property),
  },
  positioning: {
    known: ['position', 'top', 'right', 'bottom', 'left', 'inset', 'z-index'],
    matches: (property) => /^(?:position|top|right|bottom|left|inset(?:-.+)?|z-index)$/.test(property),
  },
  flexLayout: {
    known: ['display', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'align-content', 'align-self', 'justify-content', 'justify-items', 'justify-self', 'order'],
    matches: (property) => /^(?:display|flex(?:-.+)?|align-.+|justify-.+|order)$/.test(property),
  },
  spacing: {
    known: ['gap', 'row-gap', 'column-gap', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    matches: (property) => /^(?:margin|padding|gap|grid-gap)(?:-.+)?$/.test(property),
  },
  typography: {
    known: ['font-family', 'font-size', 'font-style', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform', 'color'],
    matches: (property) => /^(?:font(?:-.+)?|text(?:-.+)?|line-height|letter-spacing|word-spacing|vertical-align|color)$/.test(property),
  },
  backgrounds: {
    known: ['background', 'background-color', 'background-image', 'background-position', 'background-size', 'background-repeat'],
    matches: (property) => /^background(?:-.+)?$/.test(property),
  },
  borders: {
    known: ['border', 'border-color', 'border-width', 'border-style', 'border-radius', 'outline'],
    matches: (property) => /^(?:border|outline)(?:-.+)?$/.test(property),
  },
  shadows: { known: ['box-shadow', 'text-shadow'], matches: (property) => /^(?:box-shadow|text-shadow)$/.test(property) },
  opacity: { known: ['opacity'], matches: (property) => property === 'opacity' },
  transforms: {
    known: ['transform', 'transform-origin', 'perspective', 'rotate', 'scale', 'translate'],
    matches: (property) => /^(?:transform(?:-.+)?|perspective|rotate|scale|translate)$/.test(property),
  },
};

function lineAt(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (lineStarts[middle] <= offset) low = middle + 1;
    else high = middle;
  }
  return Math.max(1, low);
}

function scanTopLevel(source) {
  const tokens = [];
  const lineStarts = [0];
  for (let index = 0; index < source.length; index++) if (source[index] === '\n') lineStarts.push(index + 1);
  let current = '';
  let tokenOffset = 0;
  let quote = '';
  let escaped = false;
  let round = 0;
  let square = 0;
  let curly = 0;
  let unmatchedClosing = false;
  let index = 0;

  const flush = (endOffset) => {
    if (current.trim()) tokens.push({ type: 'declaration', raw: current, offset: tokenOffset, line: lineAt(lineStarts, tokenOffset), endOffset });
    current = '';
    tokenOffset = endOffset;
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (quote) {
      current += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      const commentEnd = source.indexOf('*/', index + 2);
      if (commentEnd === -1) {
        if (current.trim()) current += source.slice(index);
        else current = source.slice(index);
        tokens.push({ type: 'unterminated-comment', raw: current, offset: index, line: lineAt(lineStarts, index), endOffset: source.length });
        current = '';
        index = source.length;
        break;
      }
      const raw = source.slice(index, commentEnd + 2);
      if (current.trim()) {
        current += raw;
      } else {
        const previous = tokens.at(-1);
        current = '';
        const commentLine = lineAt(lineStarts, index);
        const previousLine = previous?.type === 'declaration' ? lineAt(lineStarts, Math.max(0, previous.endOffset - 1)) : -1;
        tokens.push({ type: previousLine === commentLine ? 'inline-comment' : 'comment', raw, text: source.slice(index + 2, commentEnd), offset: index, line: commentLine, endOffset: commentEnd + 2 });
        tokenOffset = commentEnd + 2;
      }
      index = commentEnd + 2;
      continue;
    }
    if (char === '(') round++;
    else if (char === ')') { if (round === 0) unmatchedClosing = true; else round--; }
    else if (char === '[') square++;
    else if (char === ']') { if (square === 0) unmatchedClosing = true; else square--; }
    else if (char === '{') curly++;
    else if (char === '}') { if (curly === 0) unmatchedClosing = true; else curly--; }
    current += char;
    index++;
    if (char === ';' && round === 0 && square === 0 && curly === 0) flush(index);
  }
  flush(source.length);
  if (quote) tokens.push({ type: 'warning', message: 'Unterminated quoted string; trailing source was retained.', line: lineAt(lineStarts, Math.max(0, source.length - 1)), raw: '' });
  if (round || square || curly) tokens.push({ type: 'warning', message: 'Unbalanced CSS function or bracket delimiter; trailing source was retained.', line: lineAt(lineStarts, Math.max(0, source.length - 1)), raw: '' });
  if (unmatchedClosing) tokens.push({ type: 'warning', message: 'Unmatched closing CSS delimiter; source was retained.', line: lineAt(lineStarts, Math.max(0, source.length - 1)), raw: '' });
  return tokens;
}

function findTopLevelColon(raw) {
  let quote = '';
  let escaped = false;
  let round = 0;
  let square = 0;
  let curly = 0;
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    const next = raw[index + 1];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '/' && next === '*') {
      const end = raw.indexOf('*/', index + 2);
      if (end === -1) return -1;
      index = end + 1;
      continue;
    }
    if (char === '(') round++;
    else if (char === ')') round = Math.max(0, round - 1);
    else if (char === '[') square++;
    else if (char === ']') square = Math.max(0, square - 1);
    else if (char === '{') curly++;
    else if (char === '}') curly = Math.max(0, curly - 1);
    else if (char === ':' && round === 0 && square === 0 && curly === 0) return index;
  }
  return -1;
}

function isNextDeclarationInsideValue(value) {
  let quote = '';
  let escaped = false;
  let round = 0;
  let square = 0;
  let curly = 0;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    const next = value[index + 1];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '/' && next === '*') {
      const end = value.indexOf('*/', index + 2);
      if (end === -1) break;
      index = end + 1;
      continue;
    }
    if (char === '(') round++;
    else if (char === ')') round = Math.max(0, round - 1);
    else if (char === '[') square++;
    else if (char === ']') square = Math.max(0, square - 1);
    else if (char === '{') curly++;
    else if (char === '}') curly = Math.max(0, curly - 1);
    if ((char === '\n' || char === '\r') && round === 0 && square === 0 && curly === 0) {
      const rest = value.slice(index + 1);
      if (/^\s*(?:--[\w-]+|[a-zA-Z_][\w-]*)\s*:/.test(rest)) return true;
    }
  }
  return false;
}

function classifyComment(text) {
  const value = text.trim();
  const lower = value.toLocaleLowerCase('en-US');
  if (/^warning\b\s*:/.test(lower)) return { kind: 'warning', text: value, message: value.replace(/^warning\s*:\s*/i, '') };
  if (/^(auto layout|inside auto layout)$/i.test(value)) return { kind: 'layout-annotation', text: value };
  if (value.includes('..') || value.includes('\\')) return { kind: 'layer', text: value };
  if (/^(?:style(?: reference)?\s*:\s*|[^/]+\/[^/]+$)/i.test(value)) return { kind: 'style-reference', text: value };
  return { kind: 'layer', text: value };
}

function sanitizeLayerName(name) {
  let slug = String(name || '')
    .normalize('NFKC')
    .replace(/[\\/]+/g, '-')
    .replace(/\.\.+/g, '-')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase('en-US');
  slug = Array.from(slug).slice(0, 64).join('').replace(/-+$/g, '');
  if (!slug) slug = 'layer';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(slug)) slug = `layer-${slug}`;
  return slug;
}

function createLayer(index, name, headingComment, line) {
  const slug = sanitizeLayerName(name);
  return {
    order: index + 1,
    name: name || null,
    headingComment,
    line,
    markdownPath: `layers/${String(index + 1).padStart(4, '0')}-${slug}.md`,
    declarations: [],
    annotations: [],
    warnings: [],
    observed: {},
  };
}

function addWarning(warnings, layer, warning) {
  warnings.push(warning);
  if (layer) layer.warnings.push(warning);
}

function parseDeclaration(token, layer, warnings) {
  const body = token.raw.endsWith(';') ? token.raw.slice(0, -1) : token.raw;
  const colon = findTopLevelColon(body);
  const prefix = colon < 0 ? '' : body.slice(0, colon).trim();
  const property = /^--[\w-]+$/.test(prefix) || /^[a-zA-Z_][\w-]*$/.test(prefix) ? prefix.toLowerCase() : '';
  let reason = '';
  let value = '';
  if (!property) reason = colon < 0 ? 'Declaration has no property/value colon.' : 'Declaration property name is malformed.';
  else {
    value = body.slice(colon + 1);
    if (!value.trim()) reason = 'Declaration value is empty.';
    else if (isNextDeclarationInsideValue(value)) reason = 'A following declaration appears to be missing a semicolon separator.';
  }
  const record = { property: property || null, value: property ? value : null, raw: token.raw, line: token.line, valid: !reason, error: reason || null };
  layer.declarations.push(record);
  if (reason) addWarning(warnings, layer, { kind: 'malformed-declaration', line: token.line, message: reason, raw: token.raw });
}

function buildObservedMetadata(layer) {
  const observed = {};
  for (const [group, spec] of Object.entries(OBSERVED_GROUPS)) {
    const records = layer.declarations.filter((declaration) => declaration.valid && spec.matches(declaration.property));
    const propertyNames = new Set([...spec.known, ...records.map(({ property }) => property)]);
    observed[group] = Object.fromEntries([...propertyNames].map((property) => {
      const values = records.filter((record) => record.property === property).map(({ value }) => value);
      return [property, values.length ? values : 'unavailable'];
    }));
  }
  layer.observed = observed;
}

export function parseFigmaSelectionUrl(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  let url;
  try { url = new URL(value); }
  catch { throw new Error('Enter a valid Figma Design or Prototype selection URL.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'www.figma.com' || url.username || url.password) throw new Error('Only https://www.figma.com Design or Prototype links are accepted.');
  const match = url.pathname.match(/^\/(design|proto)\/([A-Za-z0-9]+)\/([^/]+)\/?$/);
  if (!match) throw new Error('Figma URL must use /design/<fileKey>/<name> or /proto/<fileKey>/<name>.');
  const rawNodeId = url.searchParams.get('node-id') || '';
  let nodeId = null;
  if (rawNodeId) {
    const nodeMatch = rawNodeId.match(/^(\d+)[-:](\d+)$/);
    if (!nodeMatch) throw new Error('Figma node-id must contain two numeric parts, such as 13-3169.');
    nodeId = `${nodeMatch[1]}:${nodeMatch[2]}`;
  }
  const normalizedUrl = new URL(`https://www.figma.com/${match[1]}/${match[2]}/${match[3]}`);
  if (nodeId) normalizedUrl.search = `?node-id=${nodeId.replace(':', '-')}`;
  return { url: normalizedUrl.toString(), kind: match[1] === 'design' ? 'design' : 'prototype', fileKey: match[2], nodeId };
}

export function parseFigmaCss(source, selectionUrl = '') {
  if (typeof source !== 'string' || !source.trim()) throw new Error('Paste Figma Copy CSS before parsing.');
  if (source.length > MAX_CSS_LENGTH) throw new Error(`Figma CSS exceeds the ${MAX_CSS_LENGTH.toLocaleString()} character local-import limit.`);
  const selection = parseFigmaSelectionUrl(selectionUrl);
  const tokens = scanTopLevel(source);
  const layers = [];
  const warnings = [];
  const fileAnnotations = [];
  let current = null;

  const ensureUnnamedLayer = (line) => {
    if (!current) {
      current = createLayer(layers.length, '', null, line);
      layers.push(current);
    }
    return current;
  };

  for (const token of tokens) {
    if (token.type === 'inline-comment') {
      const annotation = { kind: 'css-inline-comment', text: token.text.trim(), raw: token.raw, line: token.line };
      if (current) current.annotations.push(annotation);
      else fileAnnotations.push(annotation);
      continue;
    }
    if (token.type === 'comment') {
      const classification = classifyComment(token.text);
      if (classification.kind === 'layer') {
        current = createLayer(layers.length, classification.text, token.raw, token.line);
        layers.push(current);
      } else {
        const annotation = { ...classification, raw: token.raw, line: token.line };
        if (current) current.annotations.push(annotation);
        else fileAnnotations.push(annotation);
        if (classification.kind === 'warning') addWarning(warnings, current, { kind: 'figma-warning', line: token.line, message: classification.message, raw: token.raw });
      }
      continue;
    }
    if (token.type === 'unterminated-comment') {
      const layer = ensureUnnamedLayer(token.line);
      layer.declarations.push({ property: null, value: null, raw: token.raw, line: token.line, valid: false, error: 'Unterminated CSS comment.' });
      addWarning(warnings, layer, { kind: 'malformed-comment', line: token.line, message: 'Unterminated CSS comment was retained in the original source and layer data.', raw: token.raw });
      continue;
    }
    if (token.type === 'warning') {
      addWarning(warnings, current, { kind: 'malformed-css', line: token.line, message: token.message, raw: token.raw });
      continue;
    }
    const layer = ensureUnnamedLayer(token.line);
    parseDeclaration(token, layer, warnings);
  }
  for (const layer of layers) buildObservedMetadata(layer);
  return { schemaVersion: 1, selection, layers, warnings, fileAnnotations, sourceLength: source.length, hierarchy: 'Flat source order only; parent-child relationships are unavailable and are not inferred.' };
}

function longestRun(text, character) {
  let longest = 0;
  const pattern = new RegExp(`${character === '`' ? '`' : '~'}+`, 'g');
  for (const match of text.matchAll(pattern)) longest = Math.max(longest, match[0].length);
  return longest;
}

function fenced(text, language = '') {
  const fence = '`'.repeat(Math.max(3, longestRun(text, '`') + 1));
  return `${fence}${language}\n${text}\n${fence}`;
}

function markdownText(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]<>])/g, '\\$1');
}

function metadataMarkdown(layer) {
  const names = {
    dimensions: 'Dimensions', positioning: 'Positioning', flexLayout: 'Flex layout', spacing: 'Spacing',
    typography: 'Typography', backgrounds: 'Backgrounds', borders: 'Borders', shadows: 'Shadows', opacity: 'Opacity', transforms: 'Transforms',
  };
  return Object.entries(names).map(([key, label]) => {
    const properties = layer.observed[key];
    const observed = Object.entries(properties).filter(([, values]) => values !== 'unavailable');
    if (!observed.length) return `- **${label}:** unavailable`;
    return `- **${label}:**\n${Object.entries(properties).map(([property, values]) => values === 'unavailable'
      ? `  - \`${property}\`: unavailable`
      : `  - \`${property}\` (${values.length} observed):\n${values.map((value) => `\n${fenced(value).split('\n').map((line) => `    ${line}`).join('\n')}`).join('\n')}`).join('\n')}`;
  });
}

function layerMarkdown(layer) {
  const heading = layer.name ? `# ${markdownText(layer.name)}` : '# Unnamed layer (source heading unavailable)';
  const lines = [heading, '', `Source order: ${layer.order}`, '', '> Layers are listed in source order only. Parent-child hierarchy is unavailable and was not inferred.', '', '## Observed style metadata', '', ...metadataMarkdown(layer), '', '## Declarations', ''];
  const rawDeclarations = layer.declarations.map((declaration) => declaration.raw).join('\n');
  lines.push(rawDeclarations ? fenced(rawDeclarations, 'css') : 'No declarations were present under this layer heading.', '');
  if (layer.annotations.length) lines.push('## Annotations', '', ...layer.annotations.map((annotation) => `- ${fenced(annotation.raw)}`), '');
  if (layer.warnings.length) lines.push('## Parser and source warnings', '', ...layer.warnings.map((warning) => `- Line ${warning.line}: ${markdownText(warning.message)}${warning.raw ? `\n\n  ${fenced(warning.raw)}` : ''}`), '');
  return lines.join('\n');
}

function observedValuesMarkdown(parsed) {
  const values = [];
  for (const layer of parsed.layers) {
    for (const declaration of layer.declarations) {
      if (declaration.valid && declaration.property?.startsWith('--')) values.push({ layer, kind: 'CSS custom property', label: declaration.property, value: declaration.value, line: declaration.line });
    }
    for (const annotation of layer.annotations) {
      if (annotation.kind === 'style-reference') values.push({ layer, kind: 'observed style-reference annotation', label: annotation.text, value: null, line: annotation.line });
    }
  }
  for (const annotation of parsed.fileAnnotations) {
    if (annotation.kind === 'style-reference') values.push({ layer: null, kind: 'observed style-reference annotation', label: annotation.text, value: null, line: annotation.line });
  }
  const lines = ['# Observed CSS values and style references', '', '> These entries are copied CSS observations or annotations. They are not verified Figma variables and are not canonical design tokens.', ''];
  if (!values.length) lines.push('No CSS custom properties or style-reference annotations were observed.', '');
  else for (const item of values) {
    const provenance = item.layer
      ? `Layer ${item.layer.order} (${item.layer.name ? markdownText(item.layer.name) : 'unnamed'}), line ${item.line} ([page](../${item.layer.markdownPath}))`
      : `File-level annotation, line ${item.line} (layer unavailable)`;
    lines.push(`- ${provenance}: **${markdownText(item.kind)}** \`${markdownText(item.label)}\`${item.value === null ? '' : ` = ${fenced(item.value)}`}`);
  }
  return lines.join('\n');
}

function createArchiveFiles(parsed, source, exportName) {
  const manifest = {
    schemaVersion: parsed.schemaVersion,
    format: 'figma-copy-css-import',
    exportName: exportName || null,
    source: parsed.selection,
    sourceFile: 'source/original.css',
    layers: parsed.layers.map((layer) => ({
      id: layer.order,
      order: layer.order,
      name: layer.name,
      headingComment: layer.headingComment,
      sourceLine: layer.line,
      path: layer.markdownPath,
      declarations: layer.declarations,
      annotations: layer.annotations,
      warnings: layer.warnings,
      observed: layer.observed,
      declarationCount: layer.declarations.length,
      malformedCount: layer.declarations.filter((declaration) => !declaration.valid).length,
      warningCount: layer.warnings.length,
    })),
    fileAnnotations: parsed.fileAnnotations,
    parserWarnings: parsed.warnings,
    hierarchy: parsed.hierarchy,
  };
  const links = parsed.layers.map((layer) => `- [${layer.order}. ${layer.name ? markdownText(layer.name) : 'Unnamed layer'}](${layer.markdownPath})`);
  const index = ['# Figma Copy CSS import', '', 'This archive represents a flat ordered list of copied CSS layer comments. Hierarchy is unavailable and was not inferred.', '', ...(parsed.selection ? [`Selection reference: ${parsed.selection.url}`, ''] : []), '## Layers', '', ...(links.length ? links : ['No layer headings were found.']), '', '## Parser warnings', '', ...(parsed.warnings.length ? parsed.warnings.map((warning) => `- Line ${warning.line}: ${markdownText(warning.message)}`) : ['None.']), ''].join('\n');
  const reportLines = ['# Extraction report', '', `Layer count: ${parsed.layers.length}`, `Parser warning count: ${parsed.warnings.length}`, '', '> Pasted CSS is treated as untrusted text. This importer does not execute it, fetch URL values, inspect a Figma session, or infer hierarchy.', '', '## Layer pages', '', ...(links.length ? links : ['No layer pages were generated.']), '', '## Warnings', '', ...(parsed.warnings.length ? parsed.warnings.map((warning) => `- Line ${warning.line} (${warning.kind}): ${markdownText(warning.message)}${warning.raw ? `\n\n  ${fenced(warning.raw)}` : ''}`) : ['None.']), ''].join('\n');
  const readme = ['# Figma Copy CSS export', '', ...(exportName ? [`Export name: ${markdownText(exportName)}`, ''] : []), 'This archive stores pasted Figma Copy CSS as local text and structured observations. It does not verify Figma variables or infer component metadata.', '', `Layers: ${parsed.layers.length}`, `Parser and source warning records: ${parsed.warnings.length}`, '', ...(parsed.selection ? [`Selection reference: ${parsed.selection.url}`, ''] : []), 'The original input is preserved at `source/original.css`. Layer pages are flat and ordered; parent-child relationships are unavailable.', '', 'See [INDEX.md](INDEX.md), [EXTRACTION_REPORT.md](EXTRACTION_REPORT.md), and [observed values](tokens/observed-values.md).', ''].join('\n');
  return [
    { path: 'README.md', content: readme },
    { path: 'INDEX.md', content: index },
    { path: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` },
    { path: 'EXTRACTION_REPORT.md', content: reportLines },
    { path: 'source/original.css', content: source },
    ...parsed.layers.map((layer) => ({ path: layer.markdownPath, content: layerMarkdown(layer) })),
    { path: 'tokens/observed-values.md', content: observedValuesMarkdown(parsed) },
  ];
}

function resolveMarkdownReference(fromPath, reference) {
  const segments = fromPath.split('/').slice(0, -1);
  for (const segment of reference.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') segments.pop();
    else segments.push(segment);
  }
  return segments.join('/');
}

export function buildFigmaCssArchive(parsed, source, exportName = '') {
  if (typeof source !== 'string' || !source.trim()) throw new Error('Paste Figma Copy CSS before exporting.');
  const cleanName = sanitizeLayerName(exportName || 'export');
  const baseName = `figma-css-${cleanName}`;
  const files = createArchiveFiles(parsed, source, exportName.trim());
  const archivePaths = new Set(files.map(({ path }) => path));
  for (const file of files) {
    if (file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error(`Unsafe generated archive path: ${file.path}`);
  }
  for (const file of files.filter(({ path: filePath }) => filePath.endsWith('.md'))) {
    for (const [, link] of file.content.matchAll(/\]\(([^)]+\.md)\)/g)) {
      const resolved = resolveMarkdownReference(file.path, link);
      if (!archivePaths.has(resolved)) throw new Error(`Generated Markdown link has no archive member: ${file.path} → ${link}`);
    }
  }
  return { filename: `${baseName}.zip`, files };
}

export const FIGMA_CSS_MAX_LENGTH = MAX_CSS_LENGTH;
