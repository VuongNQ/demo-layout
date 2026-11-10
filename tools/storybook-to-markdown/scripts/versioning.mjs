import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseVersion(value, label = 'version') {
  if (typeof value !== 'string') throw new Error(`${label} must be a MAJOR.MINOR.PATCH string.`);
  const match = value.match(VERSION_PATTERN);
  if (!match) throw new Error(`${label} "${value}" is invalid or unsupported; expected numeric MAJOR.MINOR.PATCH.`);
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) throw new Error(`${label} "${value}" exceeds the supported safe integer range.`);
  return parts;
}

export function bumpVersion(value, mode) {
  const [major, minor, patch] = parseVersion(value);
  if (mode === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (mode === 'minor') return `${major}.${minor + 1}.0`;
  throw new Error(`Unsupported versioning mode "${mode}"; use patch or minor.`);
}

function skipWhitespace(source, from) {
  let cursor = from;
  while (/\s/.test(source[cursor] || '')) cursor++;
  return cursor;
}

function stringEnd(source, start) {
  let escaped = false;
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const char = source[cursor];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === '"') return cursor + 1;
  }
  throw new Error('JSON contains an unterminated string.');
}

function valueEnd(source, start) {
  if (source[start] === '"') return stringEnd(source, start);
  if (source[start] !== '{' && source[start] !== '[') {
    let cursor = start;
    while (cursor < source.length && source[cursor] !== ',' && source[cursor] !== '}') cursor++;
    while (cursor > start && /\s/.test(source[cursor - 1])) cursor--;
    return cursor;
  }
  const closers = [source[start] === '{' ? '}' : ']'];
  let inString = false;
  let escaped = false;
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const char = source[cursor];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') closers.push('}');
    else if (char === '[') closers.push(']');
    else if (char === '}' || char === ']') {
      if (closers.pop() !== char) throw new Error('JSON contains mismatched delimiters.');
      if (!closers.length) return cursor + 1;
    }
  }
  throw new Error('JSON contains an unterminated object or array.');
}

function topLevelStringValueRange(source, wantedKey, label) {
  let cursor = skipWhitespace(source, 0);
  if (source[cursor++] !== '{') throw new Error(`${label} must contain a JSON object.`);
  let found = null;
  let count = 0;
  while (cursor < source.length) {
    cursor = skipWhitespace(source, cursor);
    if (source[cursor] === '}') break;
    if (source[cursor] === ',') { cursor++; continue; }
    if (source[cursor] !== '"') throw new Error(`${label} contains an invalid top-level key.`);
    const keyEnd = stringEnd(source, cursor);
    const key = JSON.parse(source.slice(cursor, keyEnd));
    cursor = skipWhitespace(source, keyEnd);
    if (source[cursor++] !== ':') throw new Error(`${label} has an invalid value for "${key}".`);
    cursor = skipWhitespace(source, cursor);
    const start = cursor;
    const end = valueEnd(source, start);
    if (key === wantedKey) {
      count++;
      if (source[start] !== '"') throw new Error(`${label} top-level "${wantedKey}" must be a string.`);
      found = { start, end };
    }
    cursor = end;
    while (/\s/.test(source[cursor] || '')) cursor++;
    if (source[cursor] === ',') cursor++;
    else if (source[cursor] !== '}') throw new Error(`${label} contains invalid JSON after "${key}".`);
  }
  if (count !== 1 || !found) throw new Error(`${label} must contain exactly one top-level "${wantedKey}" string.`);
  return found;
}

function replaceTopLevelVersion(source, nextVersion, label) {
  const range = topLevelStringValueRange(source, 'version', label);
  return `${source.slice(0, range.start)}${JSON.stringify(nextVersion)}${source.slice(range.end)}`;
}

function parseJsonObject(source, label) {
  let value;
  try { value = JSON.parse(source); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must contain a JSON object.`);
  return value;
}

async function assertRegularJsonFile(filePath, label) {
  let stat;
  try { stat = await lstat(filePath); }
  catch (error) { throw new Error(`Could not read ${label}: ${error.message}`); }
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be a regular file, not a symlink.`);
  return stat;
}

function tempPath(filePath, suffix) {
  return path.join(path.dirname(filePath), `.${path.basename(filePath)}.version-${process.pid}-${Math.random().toString(36).slice(2)}-${suffix}.tmp`);
}

async function writeStaged(filePath, contents, mode, suffix) {
  const stagedPath = tempPath(filePath, suffix);
  await writeFile(stagedPath, contents, { flag: 'wx', mode });
  return stagedPath;
}

export async function bumpVersionFiles(extensionRoot, mode) {
  if (!['patch', 'minor'].includes(mode)) throw new Error(`Unsupported versioning mode "${mode}"; use patch or minor.`);
  const root = path.resolve(extensionRoot);
  const manifestPath = path.join(root, 'manifest.json');
  const packagePath = path.join(root, 'package.json');
  const [manifestStat, packageStat] = await Promise.all([
    assertRegularJsonFile(manifestPath, 'manifest.json'),
    assertRegularJsonFile(packagePath, 'package.json'),
  ]);
  const [manifestText, packageText] = await Promise.all([readFile(manifestPath, 'utf8'), readFile(packagePath, 'utf8')]);
  const manifest = parseJsonObject(manifestText, 'manifest.json');
  const packageJson = parseJsonObject(packageText, 'package.json');
  const current = parseVersion(manifest.version, 'manifest.json version');
  const packageVersion = parseVersion(packageJson.version, 'package.json version');
  if (manifest.version !== packageJson.version) throw new Error(`Version metadata mismatch: manifest.json is ${manifest.version}, package.json is ${packageJson.version}. No files were changed.`);
  const nextVersion = mode === 'patch'
    ? `${current[0]}.${current[1]}.${current[2] + 1}`
    : `${current[0]}.${current[1] + 1}.0`;
  parseVersion(nextVersion, `next ${mode} version`);
  if (packageVersion.join('.') !== current.join('.')) throw new Error('Version metadata could not be synchronized. No files were changed.');

  const nextManifestText = replaceTopLevelVersion(manifestText, nextVersion, 'manifest.json');
  const nextPackageText = replaceTopLevelVersion(packageText, nextVersion, 'package.json');
  if (parseJsonObject(nextManifestText, 'updated manifest.json').version !== nextVersion || parseJsonObject(nextPackageText, 'updated package.json').version !== nextVersion) {
    throw new Error('Staged version metadata failed validation. No files were changed.');
  }

  let manifestStage = '';
  let packageStage = '';
  let manifestReplaced = false;
  try {
    manifestStage = await writeStaged(manifestPath, nextManifestText, manifestStat.mode, 'manifest');
    packageStage = await writeStaged(packagePath, nextPackageText, packageStat.mode, 'package');
    await rename(manifestStage, manifestPath);
    manifestStage = '';
    manifestReplaced = true;
    await rename(packageStage, packagePath);
    packageStage = '';
  } catch (error) {
    if (manifestReplaced) {
      let rollbackPath = '';
      try {
        rollbackPath = await writeStaged(manifestPath, manifestText, manifestStat.mode, 'rollback');
        await rename(rollbackPath, manifestPath);
        rollbackPath = '';
      } catch (rollbackError) {
        throw new Error(`Could not complete version update or restore manifest.json: ${error.message}; rollback failed: ${rollbackError.message}`);
      } finally {
        if (rollbackPath) await rm(rollbackPath, { force: true }).catch(() => {});
      }
    }
    throw new Error(`Could not update version metadata; original files were restored: ${error.message}`);
  } finally {
    if (manifestStage) await rm(manifestStage, { force: true }).catch(() => {});
    if (packageStage) await rm(packageStage, { force: true }).catch(() => {});
  }
  return { previousVersion: manifest.version, version: nextVersion, mode };
}
