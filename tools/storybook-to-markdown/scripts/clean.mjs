import { cleanGeneratedArtifacts, extensionRootFromScript } from './lib.mjs';

const extensionRoot = extensionRootFromScript(import.meta.url);

try {
  await cleanGeneratedArtifacts(extensionRoot);
  console.log('Removed generated extension dist/ and versioned package ZIPs.');
} catch (error) {
  console.error(`Extension clean failed: ${error.message}`);
  process.exitCode = 1;
}
