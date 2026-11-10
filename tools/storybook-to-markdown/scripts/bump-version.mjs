import { bumpVersionFiles } from './versioning.mjs';
import { extensionRootFromScript } from './lib.mjs';

const mode = process.argv[2];

try {
  const result = await bumpVersionFiles(extensionRootFromScript(import.meta.url), mode);
  process.stdout.write(`${result.previousVersion} -> ${result.version} (${result.mode})\n`);
} catch (error) {
  process.stderr.write(`Version bump failed: ${error.message}\n`);
  process.exitCode = 1;
}
