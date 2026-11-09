import { spawnSync } from 'node:child_process';
import { packageExtension, extensionRootFromScript } from './lib.mjs';

const extensionRoot = extensionRootFromScript(import.meta.url);
const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: extensionRoot, encoding: 'utf8', stdio: 'inherit' });
if (build.error || build.status !== 0) {
  console.error(`Packaging stopped because the extension build failed${build.error ? `: ${build.error.message}` : '.'}`);
  process.exitCode = build.status || 1;
} else {
  try {
    const result = await packageExtension(extensionRoot);
    console.log(`Packaged ${result.entryCount} extension files (${result.bytes} bytes) at release/${result.filename}.`);
  } catch (error) {
    console.error(`Extension packaging failed: ${error.message}`);
    process.exitCode = 1;
  }
}
