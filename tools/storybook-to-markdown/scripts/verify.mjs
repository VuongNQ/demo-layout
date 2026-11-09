import { spawnSync } from 'node:child_process';
import { extensionRootFromScript, verifyArtifacts } from './lib.mjs';

const extensionRoot = extensionRootFromScript(import.meta.url);

try {
  const result = await verifyArtifacts(extensionRoot);
  const unzip = spawnSync('unzip', ['-t', result.archivePath], { encoding: 'utf8' });
  if (unzip.error?.code === 'ENOENT') {
    console.log('System unzip is unavailable; built-in archive path, bounds, version, and CRC verification passed.');
  } else if (unzip.error || unzip.status !== 0) {
    throw new Error(`Independent unzip verification failed: ${unzip.stderr || unzip.error?.message || unzip.stdout}`);
  } else {
    console.log('Independent system unzip integrity check passed.');
  }
  console.log(`Verified extension v${result.version}: ${result.files.length} files in ${result.archivePath}.`);
} catch (error) {
  console.error(`Extension verification failed: ${error.message}`);
  process.exitCode = 1;
}
