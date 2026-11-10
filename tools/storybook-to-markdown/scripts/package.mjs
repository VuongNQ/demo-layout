import { packageExtension, extensionRootFromScript } from './lib.mjs';

const extensionRoot = extensionRootFromScript(import.meta.url);
try {
  const result = await packageExtension(extensionRoot);
  console.log(`Packaged ${result.entryCount} extension files (${result.bytes} bytes) at release/${result.filename}.`);
} catch (error) {
  console.error(`Extension packaging failed: ${error.message}`);
  process.exitCode = 1;
}
