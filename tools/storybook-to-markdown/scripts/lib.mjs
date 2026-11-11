import { spawnSync } from 'node:child_process';
import { copyFile, lstat, mkdir, readFile, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const posix = path.posix;
const EXCLUDED_SEGMENTS = new Set(['.agents', '.aws', '.codex', '.git', 'checkpoints', 'coverage', 'dist', 'docs', 'local-data', 'node_modules', 'release', 'reports', 'scripts', 'tests']);
const EXCLUDED_FILES = new Set(['.ds_store', 'package-lock.json', 'package.json', 'readme.md']);
const GENERATED_ARCHIVE = /^storybook-to-markdown-v[^/]+\.zip$/;
const MANIFEST_FILENAME = 'manifest.json';
const ZIP_LOCAL_HEADER = 0x04034b50;
const ZIP_CENTRAL_HEADER = 0x02014b50;
const ZIP_END_RECORD = 0x06054b50;
const UTF8_FLAG = 0x0800;

export const extensionRootFromScript = (scriptUrl) => path.resolve(path.dirname(fileURLToPath(scriptUrl)), '..');

export function validateManifest(manifest, label = 'manifest.json') {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error(`${label} must contain a JSON object.`);
  if (manifest.manifest_version !== 3) throw new Error(`${label} must declare manifest_version: 3.`);
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) throw new Error(`${label} must have a nonempty name.`);
  if (typeof manifest.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.version)) throw new Error(`${label} must have a numeric MAJOR.MINOR.PATCH Chrome extension version.`);
  if (!manifest.action || !(typeof manifest.action.default_popup === 'string' && manifest.action.default_popup.trim()) && !(typeof manifest.action.default_title === 'string' && manifest.action.default_title.trim())) throw new Error(`${label} must define an action default_popup or default_title.`);
  if (!manifest.background || typeof manifest.background.service_worker !== 'string' || !manifest.background.service_worker.trim()) throw new Error(`${label} must define background.service_worker.`);
  return manifest;
}

async function readManifest(root) {
  const manifestPath = path.join(root, MANIFEST_FILENAME);
  let text;
  try { text = await readFile(manifestPath, 'utf8'); }
  catch (error) { throw new Error(`Could not read ${manifestPath}: ${error.message}`); }
  let manifest;
  try { manifest = JSON.parse(text); }
  catch (error) { throw new Error(`Invalid ${MANIFEST_FILENAME}: ${error.message}`); }
  return validateManifest(manifest);
}

function isExcludedPath(relativePath) {
  const parts = relativePath.split('/');
  if (parts.some((part) => EXCLUDED_SEGMENTS.has(part.toLowerCase()) || (part.startsWith('.') && part !== '.well-known'))) return true;
  const filename = parts.at(-1).toLowerCase();
  return EXCLUDED_FILES.has(filename) || filename.endsWith('.md') || filename.endsWith('.markdown') || filename === '.env' || filename.startsWith('.env.') || filename === '.ds_store' || /(?:^|[._-])(secret|credential|private|checkpoint|storybook-export|extraction-report)(?:[._-]|$)/i.test(filename);
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference) || reference.startsWith('data:');
}

function referencePath(reference, parentPath, preserveGlob = false) {
  const raw = reference.trim();
  if (!raw || isExternalReference(raw)) return null;
  const pathPart = preserveGlob ? raw.split('#', 1)[0] : raw.split(/[?#]/, 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(pathPart); }
  catch { throw new Error(`Runtime resource has invalid URL encoding: ${reference}`); }
  if (!decoded || decoded.includes('\0')) throw new Error(`Runtime resource path is invalid: ${reference}`);
  const absolute = decoded.startsWith('/');
  const baseParts = absolute ? [] : posix.dirname(parentPath).split('/').filter((part) => part && part !== '.');
  for (const part of decoded.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!baseParts.length) throw new Error(`Runtime resource escapes the extension root: ${reference} (from ${parentPath})`);
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  const result = posix.normalize(baseParts.join('/'));
  if (!result || result === '.' || result === '..' || result.startsWith('../') || result.startsWith('/')) {
    throw new Error(`Runtime resource escapes the extension root: ${reference} (from ${parentPath})`);
  }
  if (isExcludedPath(result)) throw new Error(`Runtime resource points to an excluded development/private path: ${result}`);
  return result;
}

function manifestReferences(manifest) {
  const direct = [];
  const add = (value) => { if (typeof value === 'string' && value.trim()) direct.push(value.trim()); };
  const addIconSet = (icons) => {
    if (typeof icons === 'string') add(icons);
    else if (icons && typeof icons === 'object') Object.values(icons).forEach(add);
  };
  add(manifest.action?.default_popup);
  addIconSet(manifest.action?.default_icon);
  addIconSet(manifest.icons);
  add(manifest.background?.service_worker);
  add(manifest.options_page);
  add(manifest.options_ui?.page);
  add(manifest.devtools_page);
  add(manifest.side_panel?.default_path);
  addIconSet(manifest.chrome_url_overrides);
  for (const page of manifest.sandbox?.pages || []) add(page);
  for (const script of manifest.content_scripts || []) {
    for (const file of script.js || []) add(file);
    for (const file of script.css || []) add(file);
  }
  const patterns = [];
  for (const group of manifest.web_accessible_resources || []) {
    for (const resource of group.resources || []) {
      if (typeof resource === 'string' && /[*?]/.test(resource)) patterns.push(resource);
      else add(resource);
    }
  }
  return { direct, patterns };
}

async function listSourceFiles(root) {
  const results = [];
  async function visit(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isExcludedPath(relativePath)) continue;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relativePath);
      else if (entry.isFile()) results.push(relativePath);
    }
  }
  await visit(root);
  return results;
}

function globRegExp(glob) {
  let source = '^';
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      source += '.*';
      index++;
    } else if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else source += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`${source}$`);
}

function staticReferences(text, type, relativePath) {
  const references = [];
  const append = (match, executable = false) => {
    const value = match?.[2];
    if (value) references.push({ value, executable });
  };
  if (type === '.html') {
    for (const tag of text.matchAll(/<(script|link)\b[^>]*>/gi)) {
      const attr = tag[1].toLowerCase() === 'script' ? 'src' : 'href';
      const expression = new RegExp(`\\b${attr}\\s*=\\s*(["'])(.*?)\\1`, 'i');
      append(tag[0].match(expression), tag[1].toLowerCase() === 'script');
    }
    for (const tag of text.matchAll(/<(?:img|source|audio|video|iframe|object|embed)\b[^>]*>/gi)) {
      for (const attr of ['src', 'poster', 'data']) {
        const expression = new RegExp(`\\b${attr}\\s*=\\s*(["'])(.*?)\\1`, 'i');
        append(tag[0].match(expression));
      }
      const srcset = tag[0].match(/\bsrcset\s*=\s*(["'])(.*?)\1/i)?.[2];
      if (srcset) for (const candidate of srcset.split(',')) references.push({ value: candidate.trim().split(/\s+/)[0], executable: false });
    }
  } else if (type === '.js' || type === '.mjs') {
    for (const call of text.matchAll(/\bimportScripts\s*\(([^)]*)\)/g)) {
      for (const literal of call[1].matchAll(/["']([^"']+)["']/g)) references.push({ value: literal[1], executable: true });
    }
    for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?(["'])([^"']+)\1/g)) append(match, true);
    for (const match of text.matchAll(/\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g)) append(match, true);
    for (const match of text.matchAll(/\bchrome\.runtime\.getURL\s*\(\s*(["'])([^"']+)\1\s*\)/g)) append(match, true);
  } else if (type === '.css') {
    for (const match of text.matchAll(/@import\s+(?:url\()?\s*(["'])([^"']+)\1\s*\)?/gi)) append(match);
    for (const match of text.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) append(match);
  }
  return references.filter(({ value }) => value && !value.startsWith('#'));
}

function assertRegularFile(filePath, relativePath) {
  if (!filePath.isFile() || filePath.isSymbolicLink()) throw new Error(`Runtime resource is not a regular file: ${relativePath}`);
}

function assertSafeArchivePath(entryPath) {
  if (typeof entryPath !== 'string' || !entryPath || entryPath.includes('\\') || entryPath.startsWith('/') || entryPath.includes('\0')) {
    throw new Error(`Unsafe archive entry path: ${String(entryPath)}`);
  }
  const isDirectory = entryPath.endsWith('/');
  const segments = entryPath.split('/');
  if (isDirectory) segments.pop();
  if (segments.some((segment) => {
    const deviceName = segment.split('.')[0].replace(/[. ]+$/g, '');
    return !segment || segment === '.' || segment === '..' || /[<>:"|?*\u0000-\u001f]/.test(segment) || /[. ]$/.test(segment) || [...segment].length > 255 || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(deviceName);
  })) {
    throw new Error(`Unsafe archive entry path: ${entryPath}`);
  }
  return entryPath;
}

function assertOutputDirectory(extensionRoot, targetDirectory, name) {
  const resolvedRoot = path.resolve(extensionRoot);
  const expected = path.resolve(resolvedRoot, name);
  if (path.resolve(targetDirectory) !== expected || path.dirname(expected) !== resolvedRoot) {
    throw new Error(`Refusing to modify a directory outside the extension's generated ${name}/ path.`);
  }
  return expected;
}

async function removeGeneratedDirectory(target, name) {
  let stat;
  try { stat = await lstat(target); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Refusing to remove ${name}: expected a real generated directory.`);
  await rm(target, { recursive: true, force: false });
}

async function resolvePattern(pattern, files, from = MANIFEST_FILENAME) {
  const resolvedPattern = referencePath(pattern, from, true);
  if (!resolvedPattern) throw new Error(`Manifest runtime resources must be local extension files: ${pattern}`);
  if (!/[*?]/.test(resolvedPattern)) return [resolvedPattern];
  const expression = globRegExp(resolvedPattern);
  const matches = files.filter((file) => expression.test(file));
  if (!matches.length) throw new Error(`Manifest resource pattern matched no files: ${pattern}`);
  return matches;
}

export async function collectRuntimeGraph(root) {
  const manifest = await readManifest(root);
  const { direct, patterns } = manifestReferences(manifest);
  const sourceFiles = await listSourceFiles(root);
  const included = new Set([MANIFEST_FILENAME]);
  const pending = [];
  for (const reference of direct) {
    const resolved = referencePath(reference, MANIFEST_FILENAME);
    if (!resolved) throw new Error(`Manifest runtime resources must be local extension files: ${reference}`);
    pending.push(resolved);
  }
  for (const pattern of patterns) pending.push(...await resolvePattern(pattern, sourceFiles));

  while (pending.length) {
    const relativePath = pending.pop();
    if (included.has(relativePath)) continue;
    if (isExcludedPath(relativePath)) throw new Error(`Runtime resource is excluded from extension builds: ${relativePath}`);
    const sourcePath = path.join(root, ...relativePath.split('/'));
    let stat;
    try { stat = await lstat(sourcePath); }
    catch (error) { if (error.code === 'ENOENT') throw new Error(`Required runtime resource is missing: ${relativePath}`); throw error; }
    assertRegularFile(stat, relativePath);
    included.add(relativePath);
    const extension = path.extname(relativePath).toLowerCase();
    const source = await readFile(sourcePath, 'utf8');
    if (['.js', '.mjs'].includes(extension)) {
      const syntax = spawnSync(process.execPath, ['--check', sourcePath], { encoding: 'utf8', cwd: root });
      if (syntax.error || syntax.status !== 0) throw new Error(`JavaScript syntax check failed for ${relativePath}: ${syntax.stderr || syntax.error?.message || 'node --check returned a failure status.'}`);
    }
    for (const reference of staticReferences(source, extension, relativePath)) {
      if (isExternalReference(reference.value)) {
        if (reference.executable) throw new Error(`Remote executable runtime reference is not allowed: ${relativePath} → ${reference.value}`);
        continue;
      }
      const resolved = referencePath(reference.value, relativePath);
      if (resolved) pending.push(resolved);
    }
  }
  return { manifest, files: [...included].sort() };
}

export async function buildExtension(extensionRoot, distDirectory = path.join(extensionRoot, 'dist')) {
  const root = path.resolve(extensionRoot);
  const dist = assertOutputDirectory(root, distDirectory, 'dist');
  const graph = await collectRuntimeGraph(root);
  await removeGeneratedDirectory(dist, 'dist');
  await mkdir(dist, { recursive: true });
  for (const relativePath of graph.files) {
    if (relativePath === MANIFEST_FILENAME) continue;
    const destination = path.join(dist, ...relativePath.split('/'));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(root, ...relativePath.split('/')), destination);
  }
  await copyFile(path.join(root, MANIFEST_FILENAME), path.join(dist, MANIFEST_FILENAME));
  return graph;
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZip(entries) {
  if (entries.length > 65535) throw new Error('Extension ZIP has too many files for the supported classic ZIP format.');
  const sorted = [...entries].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const names = new Set();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of sorted) {
    assertSafeArchivePath(entry.path);
    if (names.has(entry.path)) throw new Error(`Duplicate extension ZIP entry: ${entry.path}`);
    names.add(entry.path);
    const name = Buffer.from(entry.path, 'utf8');
    const data = Buffer.from(entry.bytes);
    if (name.length > 65535 || data.length > 0xffffffff || offset > 0xffffffff) throw new Error(`Extension ZIP entry exceeds classic ZIP limits: ${entry.path}`);
    const checksum = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(ZIP_LOCAL_HEADER, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(ZIP_CENTRAL_HEADER, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((0o100644 * 0x10000) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  if (offset + centralSize > 0xffffffff) throw new Error('Extension ZIP exceeds the supported classic ZIP size limit.');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END_RECORD, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

export function readZip(buffer) {
  if (buffer.length < 22) throw new Error('ZIP archive is too short to contain an end-of-central-directory record.');
  const minimum = Math.max(0, buffer.length - 22 - 65535);
  let endOffset = -1;
  for (let offset = buffer.length - 22; offset >= minimum; offset--) {
    if (buffer.readUInt32LE(offset) === ZIP_END_RECORD) { endOffset = offset; break; }
  }
  if (endOffset < 0) throw new Error('ZIP end-of-central-directory record was not found.');
  const disk = buffer.readUInt16LE(endOffset + 4);
  const centralDisk = buffer.readUInt16LE(endOffset + 6);
  const diskEntries = buffer.readUInt16LE(endOffset + 8);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralSize = buffer.readUInt32LE(endOffset + 12);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  const commentLength = buffer.readUInt16LE(endOffset + 20);
  if (disk || centralDisk || diskEntries !== entryCount) throw new Error('Multi-disk ZIP archives are not supported.');
  if (endOffset + 22 + commentLength !== buffer.length || centralOffset + centralSize !== endOffset) throw new Error('ZIP directory bounds or trailing data are invalid.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries = [];
  const names = new Set();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > endOffset || buffer.readUInt32LE(cursor) !== ZIP_CENTRAL_HEADER) throw new Error('ZIP central directory entry is malformed.');
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const checksum = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const filenameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const entryCommentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const centralEnd = cursor + 46 + filenameLength + extraLength + entryCommentLength;
    if (centralEnd > endOffset) throw new Error('ZIP central directory entry exceeds its bounds.');
    const entryPath = decoder.decode(buffer.subarray(cursor + 46, cursor + 46 + filenameLength));
    assertSafeArchivePath(entryPath);
    if (names.has(entryPath)) throw new Error(`ZIP contains duplicate archive path: ${entryPath}`);
    names.add(entryPath);
    if ((flags & UTF8_FLAG) === 0 || method !== 0 || compressedSize !== uncompressedSize) throw new Error(`ZIP entry is not a supported UTF-8 STORE entry: ${entryPath}`);
    if (localOffset + 30 > centralOffset || buffer.readUInt32LE(localOffset) !== ZIP_LOCAL_HEADER) throw new Error(`ZIP local header is invalid: ${entryPath}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const localNameStart = localOffset + 30;
    const dataStart = localNameStart + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    const localName = decoder.decode(buffer.subarray(localNameStart, localNameStart + localNameLength));
    if (localName !== entryPath || dataEnd > centralOffset) throw new Error(`ZIP local entry bounds or name are invalid: ${entryPath}`);
    if (buffer.readUInt16LE(localOffset + 6) !== flags || buffer.readUInt16LE(localOffset + 8) !== method || buffer.readUInt32LE(localOffset + 14) !== checksum || buffer.readUInt32LE(localOffset + 18) !== compressedSize || buffer.readUInt32LE(localOffset + 22) !== uncompressedSize) {
      throw new Error(`ZIP local and central metadata differ: ${entryPath}`);
    }
    const bytes = Buffer.from(buffer.subarray(dataStart, dataEnd));
    if (crc32(bytes) !== checksum) throw new Error(`ZIP CRC-32 validation failed: ${entryPath}`);
    entries.push({ path: entryPath, bytes });
    cursor = centralEnd;
  }
  if (cursor !== endOffset) throw new Error('ZIP central directory size does not match its entries.');
  return entries;
}

async function filesUnder(root) {
  const result = [];
  async function visit(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Generated output contains a symbolic link: ${relativePath}`);
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relativePath);
      else if (entry.isFile()) result.push(relativePath);
      else throw new Error(`Generated output contains a non-file resource: ${relativePath}`);
    }
  }
  await visit(root);
  return result.sort();
}

async function ensureOutputGraph(root) {
  const graph = await collectRuntimeGraph(root);
  const actual = await filesUnder(root);
  const unexpected = actual.filter((file) => !graph.files.includes(file));
  const missing = graph.files.filter((file) => !actual.includes(file));
  if (missing.length || unexpected.length) {
    throw new Error(`Built extension file graph differs from the manifest. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }
  return graph;
}

export async function packageExtension(extensionRoot, distDirectory = path.join(extensionRoot, 'dist'), releaseDirectory = path.join(extensionRoot, 'release')) {
  const root = path.resolve(extensionRoot);
  const dist = assertOutputDirectory(root, distDirectory, 'dist');
  const release = assertOutputDirectory(root, releaseDirectory, 'release');
  const graph = await ensureOutputGraph(dist);
  const files = await Promise.all(graph.files.map(async (relativePath) => ({ path: relativePath, bytes: await readFile(path.join(dist, ...relativePath.split('/'))) })));
  if (!files.some((file) => file.path === MANIFEST_FILENAME)) throw new Error('Cannot package an extension without manifest.json at the archive root.');
  const zipBytes = createZip(files);
  const filename = `storybook-to-markdown-v${graph.manifest.version}.zip`;
  try {
    const releaseStat = await lstat(release);
    if (releaseStat.isSymbolicLink() || !releaseStat.isDirectory()) throw new Error(`Refusing to package into a non-directory release path: ${release}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(release, { recursive: true });
  const output = path.join(release, filename);
  try {
    const existing = await lstat(output);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new Error(`Refusing to replace non-file package output: ${output}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = path.join(release, `.${filename}.tmp-${process.pid}`);
  try {
    await writeFile(temporary, zipBytes, { flag: 'w' });
    await rename(temporary, output);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
  return { filename, output, entryCount: files.length, bytes: zipBytes.length };
}

export async function verifyArtifacts(extensionRoot, distDirectory = path.join(extensionRoot, 'dist'), releaseDirectory = path.join(extensionRoot, 'release')) {
  const root = path.resolve(extensionRoot);
  const dist = assertOutputDirectory(root, distDirectory, 'dist');
  const release = assertOutputDirectory(root, releaseDirectory, 'release');
  const graph = await ensureOutputGraph(dist);
  const expectedZipName = `storybook-to-markdown-v${graph.manifest.version}.zip`;
  const archivePath = path.join(release, expectedZipName);
  let archive;
  try { archive = await readFile(archivePath); }
  catch (error) { if (error.code === 'ENOENT') throw new Error(`Expected package archive is missing: release/${expectedZipName}`); throw error; }
  const entries = readZip(archive);
  const expectedNames = [...graph.files].sort();
  const actualNames = entries.map((entry) => entry.path).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`Package contents differ from dist/. Missing: ${expectedNames.filter((name) => !actualNames.includes(name)).join(', ') || 'none'}; unexpected: ${actualNames.filter((name) => !expectedNames.includes(name)).join(', ') || 'none'}.`);
  }
  if (!entries.some((entry) => entry.path === MANIFEST_FILENAME)) throw new Error('Package ZIP does not contain manifest.json at its root.');
  for (const entry of entries) {
    const diskBytes = await readFile(path.join(dist, ...entry.path.split('/')));
    if (!diskBytes.equals(entry.bytes)) throw new Error(`Package entry differs from dist/: ${entry.path}`);
    if (isExcludedPath(entry.path)) throw new Error(`Package contains an excluded development/private file: ${entry.path}`);
  }
  return { version: graph.manifest.version, archivePath, entryCount: entries.length, files: actualNames };
}

export async function cleanGeneratedArtifacts(extensionRoot) {
  const root = path.resolve(extensionRoot);
  const dist = assertOutputDirectory(root, path.join(root, 'dist'), 'dist');
  const release = assertOutputDirectory(root, path.join(root, 'release'), 'release');
  await removeGeneratedDirectory(dist, 'dist');
  let stat;
  try { stat = await lstat(release); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Refusing to clean release: expected a real generated directory.');
  for (const entry of await readdir(release, { withFileTypes: true })) {
    if (!GENERATED_ARCHIVE.test(entry.name)) continue;
    if (entry.isSymbolicLink()) continue;
    if (!entry.isFile()) continue;
    await rm(path.join(release, entry.name), { force: false });
  }
  if ((await readdir(release)).length === 0) await rmdir(release);
}
