import { buildExtension, extensionRootFromScript } from './lib.mjs';

const extensionRoot = extensionRootFromScript(import.meta.url);

try {
  const { manifest, files } = await buildExtension(extensionRoot);
  console.log(`Built Storybook to Markdown v${manifest.version} in dist/ (${files.length} runtime files).`);
} catch (error) {
  console.error(`Extension build failed: ${error.message}`);
  process.exitCode = 1;
}
