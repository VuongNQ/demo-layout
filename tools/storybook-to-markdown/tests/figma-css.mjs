import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { join } from 'node:path';
import vm from 'node:vm';
import { buildFigmaCssArchive, parseFigmaCss, parseFigmaSelectionUrl } from '../figma-css.js';

const source = await readFile(new URL('./fixtures/figma-copy-css-edge-cases.css', import.meta.url), 'utf8');
const exampleHeadings = ['Banner', 'Banner 5:2', 'Image', 'Gradient Background', 'whiteDot', 'Oval', 'Oval Copy 4', 'MDMC', 'Dots'];
const headingParse = parseFigmaCss(exampleHeadings.map((name) => `/* ${name} */\nwidth: 1px;`).join('\n'));
assert.deepEqual(headingParse.layers.map(({ name }) => name), exampleHeadings);
const parsed = parseFigmaCss(source, 'https://www.figma.com/design/Abc123/file-name?node-id=13-3169');
assert.equal(parsed.selection.kind, 'design');
assert.equal(parsed.selection.nodeId, '13:3169');
assert.match(parsed.selection.url, /node-id=13-3169/);
const prototypeParsed = parseFigmaCss(source, 'https://www.figma.com/proto/File9/prototype?node-id=5-6');
assert.equal(prototypeParsed.selection.kind, 'prototype');
assert.equal(prototypeParsed.selection.nodeId, '5:6');
const emptyUrlParsed = parseFigmaCss(source, '');
assert.equal(emptyUrlParsed.selection, null, 'empty optional Figma source URL does not block CSS parsing');
assert.deepEqual(parsed.layers.map(({ name }) => name), ['Panel', 'Image', 'Item', 'Item', '../CON', 'Carte 漢字', 'Broken declaration layer']);
assert.equal(parsed.layers[0].markdownPath, 'layers/0001-panel.md');
assert.equal(parsed.layers[1].markdownPath, 'layers/0002-image.md');
assert.equal(parsed.layers[2].markdownPath, 'layers/0003-item.md');
assert.equal(parsed.layers[3].markdownPath, 'layers/0004-item.md');
assert.equal(parsed.layers[4].markdownPath, 'layers/0005-layer-con.md');
assert.equal(parsed.layers[5].markdownPath, 'layers/0006-carte-漢字.md');
assert.equal(parsed.layers[6].markdownPath, 'layers/0007-broken-declaration-layer.md');
assert(!parsed.layers.some((layer) => /auto layout|inside auto layout|shadow-md|warning/i.test(layer.name || '')));
assert.deepEqual(parsed.layers[0].annotations.map(({ kind, text }) => [kind, text]), [
  ['css-inline-comment', 'inline color note'],
  ['layout-annotation', 'Auto layout'],
  ['layout-annotation', 'Inside auto layout'],
  ['style-reference', 'Shadows/shadow-md'],
  ['warning', 'warning: gradient preview may differ from the source design'],
]);
assert.equal(parsed.layers[0].declarations.find(({ property }) => property === 'width').value, ' calc(100% - 40px)');
assert.equal(parsed.layers[0].declarations.find(({ property }) => property === 'color').raw, '\ncolor: rgba(20, 30, 40, 0.75);');
assert(parsed.layers[0].annotations.some(({ kind, text }) => kind === 'css-inline-comment' && text === 'inline color note'));
assert.equal(parsed.layers[0].observed.dimensions.width[0], ' calc(100% - 40px)');
assert.equal(parsed.layers[0].observed.dimensions.height[0], ' 320.5px');
assert.equal(parsed.layers[0].observed.positioning.left[0], ' -12.25px');
assert.equal(parsed.layers[0].observed.positioning.top, 'unavailable');
assert.equal(parsed.layers[0].observed.flexLayout.display[0], ' flex');
assert.equal(parsed.layers[0].observed.spacing['margin-top'][0], ' 8px');
assert.equal(parsed.layers[0].observed.typography['font-family'][0], ' "Inter", sans-serif');
assert.notEqual(parsed.layers[0].observed.typography.color, 'unavailable');
assert.equal(parsed.layers[0].observed.backgrounds['background-image'][0].startsWith(' linear-gradient('), true);
assert.equal(parsed.layers[0].observed.shadows['box-shadow'][0].includes(', 0 4px 8px'), true);
assert.equal(parsed.layers[0].observed.transforms.transform[0], ' matrix(1, 0, 0, 1, -2.5, 0)');
assert.equal(parsed.layers[1].declarations[0].value, ' url(https://assets.example.invalid/image.svg) center / cover no-repeat');
assert.equal(parsed.layers[4].markdownPath.includes('..'), false);
assert.equal(parsed.layers[4].markdownPath.toLowerCase().includes('/con.'), false);
assert.equal(parsed.layers[5].observed.opacity.opacity, 'unavailable');
assert(parsed.warnings.some(({ kind }) => kind === 'figma-warning'));
assert(parsed.warnings.some(({ kind, message }) => kind === 'malformed-declaration' && /missing a semicolon/.test(message)));
assert(parsed.warnings.some(({ kind, message }) => kind === 'malformed-declaration' && /property\/value colon/.test(message)));
assert(parsed.layers.at(-1).declarations.some(({ raw, valid }) => !valid && raw.trim() === 'border-radius;'));
assert.equal(source.length, parsed.sourceLength);
assert.throws(() => parseFigmaCss('  '), /Paste Figma Copy CSS/);
assert.throws(() => parseFigmaCss('/* Empty */\ncolor: red;', 'https://evil.example/design/abc/file?node-id=1-2'), /Only https:\/\/www\.figma\.com/);
assert.throws(() => parseFigmaCss('/* Empty */\ncolor: red;', 'not a URL'), /valid Figma Design or Prototype selection URL/);
assert.throws(() => parseFigmaCss('/* Empty */\ncolor: red;', 'https://www.figma.com/community/file/abc'), /must use \/design\/<fileKey>\/<name> or \/proto\//);
assert.throws(() => parseFigmaCss('/* Empty */\ncolor: red;', 'https://www.figma.com/design/Abc/file?node-id=bad'), /node-id must contain two numeric parts/);
assert.equal(parseFigmaSelectionUrl('https://www.figma.com/proto/File9/prototype?node-id=5-6').kind, 'prototype');
assert.equal(parseFigmaSelectionUrl(''), null);
assert.equal(parseFigmaCss('/* CON */\nwidth: 1px;').layers[0].markdownPath, 'layers/0001-layer-con.md');
assert.equal(parseFigmaCss('/* ../outside */\nwidth: 1px;').layers[0].markdownPath, 'layers/0001-outside.md');
const longName = 'A'.repeat(200);
const longPath = parseFigmaCss(`/* ${longName} */\nwidth: 1px;`).layers[0].markdownPath;
assert([...longPath.split('/').at(-1)].length < 80, 'layer filename segment remains bounded');
assert.equal(longPath, parseFigmaCss(`/* ${longName} */\nwidth: 1px;`).layers[0].markdownPath, 'filename is stable on repeated parse');
assert.deepEqual(parseFigmaCss('/* Fallback declarations */\nwidth: 10px;\nwidth: calc(100% - 10px);').layers[0].observed.dimensions.width, [' 10px', ' calc(100% - 10px)']);

const xssLikeSource = '/* <img src=x onerror=alert(1)> */\n--payload: "</textarea><script>alert(1)</script>";';
const xssParsed = parseFigmaCss(xssLikeSource);
assert.equal(xssParsed.layers[0].name, '<img src=x onerror=alert(1)>');
const archive = buildFigmaCssArchive(parsed, source, '../Unsafe Export Name');
const emptyUrlArchive = buildFigmaCssArchive(emptyUrlParsed, source, 'Optional URL');
const prototypeArchive = buildFigmaCssArchive(prototypeParsed, source, 'Prototype URL');
assert.equal(archive.filename, 'figma-css-unsafe-export-name.zip');
const archivePaths = new Set(archive.files.map(({ path }) => path));
for (const file of ['README.md', 'INDEX.md', 'manifest.json', 'EXTRACTION_REPORT.md', 'source/original.css', 'tokens/observed-values.md']) assert(archivePaths.has(file));
assert.equal(archive.files.find(({ path }) => path === 'source/original.css').content, source, 'original source bytes represented as text without parser rewriting');
assert(archive.files.find(({ path }) => path === 'tokens/observed-values.md').content.includes('not verified Figma variables'));
assert(archive.files.find(({ path }) => path === 'tokens/observed-values.md').content.includes('Shadows/shadow-md'));
assert(!('parent' in JSON.parse(archive.files.find(({ path }) => path === 'manifest.json').content).layers[0]));
const parsedManifest = JSON.parse(archive.files.find(({ path }) => path === 'manifest.json').content);
assert.deepEqual(parsedManifest.source, parsed.selection, 'provided Design URL is retained as export source metadata');
assert.equal(JSON.parse(prototypeArchive.files.find(({ path }) => path === 'manifest.json').content).source.kind, 'prototype', 'provided Prototype URL is retained as export source metadata');
assert.match(archive.files.find(({ path }) => path === 'INDEX.md').content, /Selection reference: https:\/\/www\.figma\.com\/design\/Abc123\/file-name\?node-id=13-3169/);
assert.equal(JSON.parse(emptyUrlArchive.files.find(({ path }) => path === 'manifest.json').content).source, null, 'empty URL exports without inventing source metadata');
assert.equal(emptyUrlArchive.files.find(({ path }) => path === 'source/original.css').content, source);
assert(!('component' in parsedManifest) && !('components' in parsedManifest), 'archive does not fabricate component metadata');
assert.match(parsedManifest.hierarchy, /not inferred/);
assert.equal(parsedManifest.layers[0].declarations.find(({ property }) => property === 'width').value, ' calc(100% - 40px)');
assert.equal(parsedManifest.layers[0].observed.dimensions.height[0], ' 320.5px');
assert(parsedManifest.layers.at(-1).declarations.some(({ valid, raw }) => !valid && raw.trim() === 'border-radius;'));
assert.match(archive.files.find(({ path }) => path === 'INDEX.md').content, /\[1\. Panel\]\(layers\/0001-panel\.md\)/);
assert.match(archive.files.find(({ path }) => path === 'EXTRACTION_REPORT.md').content, /\[7\. Broken declaration layer\]\(layers\/0007-broken-declaration-layer\.md\)/);
for (const file of archive.files.filter(({ path }) => path.endsWith('.md'))) {
  for (const [, target] of file.content.matchAll(/\]\(([^)]+\.md)\)/g)) {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), target));
    assert(archivePaths.has(resolved), `${file.path} link resolves to archive member: ${resolved}`);
  }
}
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(await readFile(new URL('../figma-css.js', import.meta.url), 'utf8')));
const popupSource = await readFile(new URL('../popup.js', import.meta.url), 'utf8');
assert(!/\.innerHTML\s*=/.test(popupSource), 'preview uses textContent and DOM nodes, not HTML injection');
assert.match(popupSource, /figma-warning-count'\)\.textContent = String\(parsed\.warnings\.length\)/);
const popupHtml = await readFile(new URL('../popup.html', import.meta.url), 'utf8');
for (const id of ['mode-figma', 'figma-selection-url', 'figma-css-input', 'figma-parse', 'figma-layer-count', 'figma-warning-count', 'figma-export', 'figma-clear']) assert(popupHtml.includes(`id="${id}"`), `popup provides ${id}`);
assert.match(popupHtml, /<label class="figma-field" for="figma-selection-url">Figma Source URL<\/label>/);
assert.match(popupHtml, /id="figma-source-url-help"[^>]*>Optional\. Paste a Figma Design or Prototype URL to preserve the source reference\. CSS is imported from the text you paste, not fetched from Figma\./);
assert.match(popupHtml, /id="figma-selection-url"[^>]+aria-describedby="figma-source-url-help"/);

const offscreenSource = await readFile(new URL('../offscreen.js', import.meta.url), 'utf8');
function memberNames(zip) {
  let end = -1;
  for (let offset = zip.length - 22; offset >= Math.max(0, zip.length - 65557); offset--) {
    if (zip.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  assert(end >= 0, 'ZIP end record exists');
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  const names = [];
  for (let index = 0; index < count; index++) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50, 'central directory member header exists');
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    names.push(zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8'));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}
const listeners = new Set();
const objectUrls = new Map();
const runtime = { onMessage: { addListener: (listener) => listeners.add(listener) } };
const context = vm.createContext({
  chrome: { runtime },
  TextEncoder, Uint8Array, Uint32Array, DataView, Blob,
  URL: {
    createObjectURL: (blob) => { const url = `blob:figma-test-${objectUrls.size + 1}`; objectUrls.set(url, blob); return url; },
    revokeObjectURL: (url) => objectUrls.delete(url),
  },
  Set,
});
vm.runInContext(offscreenSource, context, { filename: 'offscreen.js' });
let response;
listeners.values().next().value({ action: 'MAKE_ZIP', files: archive.files }, {}, (value) => { response = value; });
assert(response?.ok);
const zipBytes = Buffer.from(await objectUrls.get(response.url).arrayBuffer());
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'figma-css-import-'));
try {
  const zipPath = join(temporaryDirectory, archive.filename);
  await writeFile(zipPath, zipBytes);
  const integrity = spawnSync('unzip', ['-t', zipPath], { encoding: 'utf8' });
  assert.equal(integrity.status, 0, integrity.stderr || integrity.stdout);
  assert.equal(execFileSync('unzip', ['-p', zipPath, 'source/original.css'], { encoding: 'utf8' }), source);
  const members = memberNames(zipBytes).sort();
  assert.deepEqual(members, [...archivePaths].sort());
  assert(members.includes('manifest.json'));

  let emptyUrlResponse;
  listeners.values().next().value({ action: 'MAKE_ZIP', files: emptyUrlArchive.files }, {}, (value) => { emptyUrlResponse = value; });
  assert(emptyUrlResponse?.ok, 'Figma CSS ZIP generation works with an empty optional URL');
  const emptyUrlZipPath = join(temporaryDirectory, 'empty-source-url.zip');
  await writeFile(emptyUrlZipPath, Buffer.from(await objectUrls.get(emptyUrlResponse.url).arrayBuffer()));
  const emptyUrlIntegrity = spawnSync('unzip', ['-t', emptyUrlZipPath], { encoding: 'utf8' });
  assert.equal(emptyUrlIntegrity.status, 0, emptyUrlIntegrity.stderr || emptyUrlIntegrity.stdout);
  assert.equal(execFileSync('unzip', ['-p', emptyUrlZipPath, 'manifest.json'], { encoding: 'utf8' }).includes('"source": null'), true);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(JSON.stringify({ result: 'PASS', layers: parsed.layers.length, warningCount: parsed.warnings.length, repeatedNamesStable: true, annotationsPreserved: true, malformedSourceRetained: true, metadataObservedOnly: true, linksResolved: true, noNetworkCalls: true, safePaths: true, independentUnzip: 'PASS' }));
