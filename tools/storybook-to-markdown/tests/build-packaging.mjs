import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildExtension, cleanGeneratedArtifacts, collectRuntimeGraph, packageExtension, readZip, verifyArtifacts } from '../scripts/lib.mjs';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'storybook-extension-build-test-'));
const fixtureRoot = path.join(temporaryRoot, 'fixture');
const sourceFiles = ['manifest.json', 'background.js', 'extractor.js', 'offline-static.js', 'popup.html', 'popup.css', 'popup.js', 'figma-css.js', 'offscreen.html', 'offscreen.js'];

async function makeFixture(root = fixtureRoot) {
  await mkdir(root, { recursive: true });
  for (const file of sourceFiles) await copyFile(path.join(extensionRoot, file), path.join(root, file));
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'assets', 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>');
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  manifest.icons = { '16': 'assets/icon.svg' };
  await writeFile(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await mkdir(path.join(root, 'tests'), { recursive: true });
  await writeFile(path.join(root, 'tests', 'development-test.mjs'), 'throw new Error("test files must not be packaged");');
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await writeFile(path.join(root, 'scripts', 'dev.mjs'), 'throw new Error("development scripts must not be packaged");');
  await mkdir(path.join(root, 'docs', 'reports'), { recursive: true });
  await writeFile(path.join(root, 'docs', 'reports', 'private-report.md'), 'must not be packaged');
  await mkdir(path.join(root, 'local-data'), { recursive: true });
  await writeFile(path.join(root, 'local-data', 'storybook-export.md'), 'generated Storybook data must not be packaged');
  await writeFile(path.join(root, 'README.md'), 'Development readme must not be packaged.');
  return root;
}

try {
  await makeFixture();
  const fixtureManifest = JSON.parse(await readFile(path.join(fixtureRoot, 'manifest.json'), 'utf8'));
  const expectedVersion = fixtureManifest.version;
  const expectedRuntimeFiles = [...sourceFiles, 'assets/icon.svg'].sort();

  const firstBuild = await buildExtension(fixtureRoot);
  assert.deepEqual(firstBuild.files, expectedRuntimeFiles, 'build contains manifest and the complete referenced runtime graph only');
  for (const file of ['background.js', 'extractor.js', 'offline-static.js', 'popup.html', 'popup.css', 'popup.js', 'figma-css.js', 'offscreen.html', 'offscreen.js']) {
    assert(firstBuild.files.includes(file), `referenced runtime resource is in dist: ${file}`);
  }
  assert(firstBuild.files.includes('assets/icon.svg'), 'manifest-referenced static icon asset is copied');
  const firstOutput = await Promise.all(firstBuild.files.map(async (file) => [file, await readFile(path.join(fixtureRoot, 'dist', file))]));
  await writeFile(path.join(fixtureRoot, 'dist', 'stale-generated-file.txt'), 'old output');
  const secondBuild = await buildExtension(fixtureRoot);
  assert(!secondBuild.files.includes('stale-generated-file.txt'));
  const secondOutput = await Promise.all(secondBuild.files.map(async (file) => [file, await readFile(path.join(fixtureRoot, 'dist', file))]));
  assert.deepEqual(secondOutput.map(([file, bytes]) => [file, bytes.toString('base64')]), firstOutput.map(([file, bytes]) => [file, bytes.toString('base64')]), 'repeated builds are deterministic and recreate dist');

  const graph = await collectRuntimeGraph(path.join(fixtureRoot, 'dist'));
  assert.deepEqual(graph.files, expectedRuntimeFiles);
  assert(!graph.files.some((file) => /^(tests|scripts|docs|local-data)\//.test(file)));
  assert(!graph.files.includes('README.md'));

  const packaged = await packageExtension(fixtureRoot);
  assert.equal(packaged.filename, `storybook-to-markdown-v${expectedVersion}.zip`);
  const archiveBytes = await readFile(packaged.output);
  const zipEntries = readZip(archiveBytes);
  const names = zipEntries.map((entry) => entry.path).sort();
  assert.deepEqual(names, expectedRuntimeFiles, 'ZIP contains exactly dist contents and no dist/ prefix');
  assert(names.includes('manifest.json'), 'manifest.json is at the ZIP root');
  const zipManifest = JSON.parse(zipEntries.find((entry) => entry.path === 'manifest.json').bytes.toString('utf8'));
  assert.equal(zipManifest.version, expectedVersion, 'ZIP manifest uses the fixture manifest version');
  assert(!names.some((name) => /(^|\/)(tests|scripts|docs|reports|local-data|dist)(\/|$)/.test(name)));
  assert(!names.some((name) => /(?:storybook-export|checkpoint|private-report)/i.test(name)));
  for (const entry of zipEntries) assert(entry.bytes.equals(await readFile(path.join(fixtureRoot, 'dist', entry.path))));
  const verified = await verifyArtifacts(fixtureRoot);
  assert.equal(verified.version, expectedVersion);
  assert.equal(verified.entryCount, expectedRuntimeFiles.length);

  const packagedAgain = await packageExtension(fixtureRoot);
  assert((await readFile(packagedAgain.output)).equals(archiveBytes), 'repeated packaging produces byte-identical output');

  const unzip = spawnSync('unzip', ['-t', packaged.output], { encoding: 'utf8' });
  const independentZipCheck = unzip.error?.code === 'ENOENT' ? 'unavailable' : unzip.status === 0 ? 'PASS' : 'FAIL';
  if (independentZipCheck === 'FAIL') throw new Error(`Independent unzip check failed: ${unzip.stderr || unzip.stdout}`);

  const invalidRoot = path.join(temporaryRoot, 'invalid-manifest');
  await mkdir(path.join(invalidRoot, 'dist'), { recursive: true });
  await writeFile(path.join(invalidRoot, 'dist', 'preserve-me.txt'), 'build must validate before deleting dist');
  await writeFile(path.join(invalidRoot, 'manifest.json'), '{ invalid json');
  await assert.rejects(buildExtension(invalidRoot), /Invalid manifest\.json/);
  assert.equal(await readFile(path.join(invalidRoot, 'dist', 'preserve-me.txt'), 'utf8'), 'build must validate before deleting dist');

  const invalidStructureRoot = path.join(temporaryRoot, 'invalid-structure');
  await mkdir(invalidStructureRoot, { recursive: true });
  await writeFile(path.join(invalidStructureRoot, 'manifest.json'), JSON.stringify({ manifest_version: 2, name: 'Invalid', version: '1.0' }));
  await assert.rejects(buildExtension(invalidStructureRoot), /must declare manifest_version: 3/);

  const missingRoot = path.join(temporaryRoot, 'missing-runtime');
  await makeFixture(missingRoot);
  const missingManifest = JSON.parse(await readFile(path.join(missingRoot, 'manifest.json'), 'utf8'));
  missingManifest.background.service_worker = 'missing-worker.js';
  await writeFile(path.join(missingRoot, 'manifest.json'), `${JSON.stringify(missingManifest, null, 2)}\n`);
  await mkdir(path.join(missingRoot, 'dist'), { recursive: true });
  await writeFile(path.join(missingRoot, 'dist', 'preserve-me.txt'), 'missing resource must fail before dist removal');
  await assert.rejects(buildExtension(missingRoot), /Required runtime resource is missing: missing-worker\.js/);
  assert.equal(await readFile(path.join(missingRoot, 'dist', 'preserve-me.txt'), 'utf8'), 'missing resource must fail before dist removal');

  const releaseDirectory = path.join(fixtureRoot, 'release');
  await writeFile(path.join(releaseDirectory, 'unrelated.zip'), 'keep');
  await writeFile(path.join(releaseDirectory, 'notes.txt'), 'keep');
  await writeFile(path.join(releaseDirectory, 'storybook-to-markdown-v0.2.0.zip'), 'generated older extension package');
  await cleanGeneratedArtifacts(fixtureRoot);
  await assert.rejects(readFile(path.join(fixtureRoot, 'dist', 'manifest.json')), { code: 'ENOENT' });
  const remainingReleaseFiles = (await readdir(releaseDirectory)).sort();
  assert.deepEqual(remainingReleaseFiles, ['notes.txt', 'unrelated.zip'], 'clean preserves unrelated release files');

  console.log(JSON.stringify({ result: 'PASS', fixtureRuntimeFileCount: expectedRuntimeFiles.length, repeatedBuild: true, malformedAndInvalidManifestsRejected: true, missingRuntimeRejected: true, manifestResourcesAndStaticIconCopied: true, packageRootManifest: true, excludesDevelopmentAndStorybookData: true, deterministicPackage: true, independentUnzip: independentZipCheck, cleanPreservesUnrelatedFiles: true }));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
