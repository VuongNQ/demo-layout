import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bumpVersionFiles } from '../scripts/versioning.mjs';
import { readZip } from '../scripts/lib.mjs';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(extensionRoot, '../..');
const tempRoot = await mkdtemp(path.join(tmpdir(), 'storybook-extension-version-test-'));
const sourceManifestBytes = await readFile(path.join(extensionRoot, 'manifest.json'));
const sourcePackageBytes = await readFile(path.join(extensionRoot, 'package.json'));
const packageFiles = ['package.json', 'manifest.json', 'background.js', 'extractor.js', 'offline-static.js', 'popup.html', 'popup.css', 'popup.js', 'figma-css.js', 'offscreen.html', 'offscreen.js'];
const scriptFiles = ['build.mjs', 'package.mjs', 'verify.mjs', 'clean.mjs', 'lib.mjs', 'versioning.mjs', 'bump-version.mjs'];

async function createFixture(name = 'fixture', initialVersion = '0.3.0') {
  const root = path.join(tempRoot, name);
  await mkdir(root, { recursive: true });
  for (const filename of packageFiles) await copyFile(path.join(extensionRoot, filename), path.join(root, filename));
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  for (const filename of scriptFiles) await copyFile(path.join(extensionRoot, 'scripts', filename), path.join(root, 'scripts', filename));
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  manifest.icons = undefined;
  delete manifest.icons;
  manifest.version = initialVersion;
  await writeFile(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  packageJson.version = initialVersion;
  await writeFile(path.join(root, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  return root;
}

function runNpm(root, ...args) {
  const result = process.env.npm_execpath
    ? spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: root, encoding: 'utf8' })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.error || result.status !== 0) throw new Error(`npm ${args.join(' ')} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout;
}

async function versions(root) {
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.version, manifest.version, 'package.json and manifest.json remain synchronized');
  return manifest.version;
}

try {
  const fixture = await createFixture();
  assert.equal(await versions(fixture), '0.3.0');
  runNpm(fixture, 'run', 'build');
  assert.equal(await versions(fixture), '0.3.1', 'default local build bumps PATCH once');
  runNpm(fixture, 'run', 'build:patch');
  assert.equal(await versions(fixture), '0.3.2', 'explicit patch build bumps PATCH once');
  runNpm(fixture, 'run', 'build:minor');
  assert.equal(await versions(fixture), '0.4.0', 'minor build resets PATCH');
  runNpm(fixture, 'run', 'build:raw');
  assert.equal(await versions(fixture), '0.4.0', 'raw build does not bump');
  runNpm(fixture, 'run', 'build:raw');
  runNpm(fixture, 'run', 'package');
  assert.equal(await versions(fixture), '0.4.0', 'package does not bump and rebuilds through build:raw');
  const zipPath = path.join(fixture, 'release', 'storybook-to-markdown-v0.4.0.zip');
  const zipEntries = readZip(await readFile(zipPath));
  const zipManifest = JSON.parse(zipEntries.find((entry) => entry.path === 'manifest.json').bytes.toString('utf8'));
  assert.equal(zipManifest.version, '0.4.0', 'ZIP manifest version matches ZIP filename');
  runNpm(fixture, 'run', 'verify');
  assert.equal(await versions(fixture), '0.4.0', 'verify does not bump');
  runNpm(fixture, 'run', 'clean');
  assert.equal(await versions(fixture), '0.4.0', 'clean does not bump');

  for (const version of ['0.3.0', '0.3.1', '0.4.0']) {
    const root = await createFixture(`version-${version}`, version);
    runNpm(root, 'run', 'build:raw');
    runNpm(root, 'run', 'package');
    assert.equal(await versions(root), version, `raw build and package preserve ${version}`);
    const zipPath = path.join(root, 'release', `storybook-to-markdown-v${version}.zip`);
    const archiveEntries = readZip(await readFile(zipPath));
    const archivedManifest = JSON.parse(archiveEntries.find((entry) => entry.path === 'manifest.json').bytes.toString('utf8'));
    assert.equal(archivedManifest.version, version, `ZIP filename and manifest agree for ${version}`);
    runNpm(root, 'run', 'verify');
    assert.equal(await versions(root), version, `verification preserves ${version}`);
  }

  const preserving = await createFixture('format-preservation');
  const manifestText = await readFile(path.join(preserving, 'manifest.json'), 'utf8');
  const packageText = await readFile(path.join(preserving, 'package.json'), 'utf8');
  const formattedPackage = packageText.replace('  "version": "0.3.0",', '  "metadata": { "version": "nested" },\n  "version": "0.3.0",');
  await writeFile(path.join(preserving, 'package.json'), formattedPackage);
  await bumpVersionFiles(preserving, 'patch');
  assert.equal(await readFile(path.join(preserving, 'manifest.json'), 'utf8'), manifestText.replace('"version": "0.3.0"', '"version": "0.3.1"'));
  assert.equal(await readFile(path.join(preserving, 'package.json'), 'utf8'), formattedPackage.replace('"version": "0.3.0"', '"version": "0.3.1"'));

  for (const [name, manifestVersion, packageVersion] of [
    ['invalid-short', '0.3', '0.3'],
    ['invalid-mismatch', '0.3.0', '0.3.1'],
    ['invalid-leading-zero', '00.3.0', '00.3.0'],
  ]) {
    const root = await createFixture(name);
    const manifestPath = path.join(root, 'manifest.json');
    const packagePath = path.join(root, 'package.json');
    const originalManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const originalPackage = JSON.parse(await readFile(packagePath, 'utf8'));
    originalManifest.version = manifestVersion;
    originalPackage.version = packageVersion;
    const manifestText = `${JSON.stringify(originalManifest, null, 2)}\n`;
    const packageText = `${JSON.stringify(originalPackage, null, 2)}\n`;
    await writeFile(manifestPath, manifestText);
    await writeFile(packagePath, packageText);
    await assert.rejects(bumpVersionFiles(root, 'minor'));
    assert.equal(await readFile(manifestPath, 'utf8'), manifestText, 'invalid version leaves manifest unchanged');
    assert.equal(await readFile(packagePath, 'utf8'), packageText, 'invalid version leaves package unchanged');
  }
  await assert.rejects(bumpVersionFiles(fixture, 'major'), /Unsupported versioning mode/);

  const workflow = (await readFile(path.join(repositoryRoot, '.github/workflows/build-storybook-extension.yml'), 'utf8')).replace(/\r\n/g, '\n');
  const packageJson = JSON.parse(await readFile(path.join(extensionRoot, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts.package, /build:raw/);
  assert.doesNotMatch(packageJson.scripts.package, /npm run build(?:\s|$)/, 'package never invokes the auto-bumping build alias');
  assert.match(workflow, /workflow_dispatch:[\s\S]*?version_mode:[\s\S]*?options:\s*\n\s*- raw\s*\n\s*- minor[\s\S]*?default: raw/);
  assert.match(workflow, /name: Build extension without changing version\n[\s\S]*?run: npm run build:raw/);
  assert.match(workflow, /if \[\[ "\$EVENT_NAME" == "push" \]\]; then\n\s+node scripts\/bump-version\.mjs minor/, 'push to main selects one MINOR bump');
  assert.match(workflow, /EVENT_NAME" == "workflow_dispatch" && "\$VERSION_MODE" == "minor"/);
  assert.match(workflow, /npm run build:raw[\s\S]*?npm run package[\s\S]*?npm run verify/);
  assert.doesNotMatch(workflow, /npm run build(?:\s|$)/, 'workflow never invokes the auto-bumping build alias');
  assert.match(workflow, /storybook-to-markdown-v\$\{\{ steps\.archive\.outputs\.version \}\}-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  const bumpOffset = workflow.indexOf('node scripts/bump-version.mjs minor');
  const postBumpTestsOffset = workflow.indexOf('node tests/smoke.mjs && npm test', bumpOffset);
  assert(bumpOffset >= 0 && postBumpTestsOffset > bumpOffset, 'packaging job reruns smoke and npm tests after the transient bump');
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /contents:\s*write|gh release|git tag|git push/);
  assert.match(workflow, /if: github\.event_name != 'pull_request'/, 'PR validation does not upload artifacts');
  const readme = await readFile(path.join(extensionRoot, 'README.md'), 'utf8');
  assert.match(readme, /Repeated main builds from the same committed base version can therefore produce the same MINOR version/);
  assert.match(readme, /durable monotonically increasing release-version strategy is \*\*NEEDS-TEAM-DECISION\*\*/);

  assert.deepEqual(await readFile(path.join(extensionRoot, 'manifest.json')), sourceManifestBytes, 'tests do not modify the real manifest version');
  assert.deepEqual(await readFile(path.join(extensionRoot, 'package.json')), sourcePackageBytes, 'tests do not modify real package metadata');

  console.log(JSON.stringify({ result: 'PASS', localPatch: true, explicitPatch: true, minorResetsPatch: true, rawAndPackageAndVerifyAndCleanDoNotBump: true, zipManifestMatchesFilename: true, synchronizedMetadata: true, invalidVersionsLeaveFilesUnchanged: true, JSONFormattingPreserved: true, workflowContracts: true, sourceVersionFilesUntouched: true }));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
