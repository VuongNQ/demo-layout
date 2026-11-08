import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const read = (path) => readFile(path, 'utf8');
const chatgptMeta = await read('src/chatgpt/routes/route-meta.ts');
const chatgptRoutes = await read('src/chatgpt/routes/route-config.tsx');
const claudeMeta = await read('src/claude/routes/route-meta.ts');
const claudeRoutes = await read('src/claude/routes/route-config.tsx');
const legacyRoutes = await read('src/routes/legacy-redirects.tsx');

// Browser acceptance tooling was explicitly authorized for Phase 8H. It is
// already present at HEAD in some checkouts, so normalize the same approved
// entries on both sides while still rejecting every unrelated package/script.
const packageJson = JSON.parse(await read('package.json'));
const baselinePackageJson = JSON.parse(execFileSync('git', ['show', 'HEAD:package.json'], { encoding: 'utf8' }));
assert.deepEqual(packageJson.dependencies, baselinePackageJson.dependencies, 'application dependencies remain unchanged');
assert.equal(packageJson.devDependencies['@playwright/test'], '^1.60.0');
const normalizedPackage = (source) => {
  const result = structuredClone(source);
  delete result.devDependencies['@playwright/test'];
  delete result.scripts['test:e2e'];
  delete result.scripts['verify:scenarios2-5'];
  return result;
};
assert.deepEqual(normalizedPackage(packageJson), normalizedPackage(baselinePackageJson), 'only authorized Playwright dependency/script entries may differ from HEAD');
const currentScripts = { ...packageJson.scripts };
const baselineScripts = { ...baselinePackageJson.scripts };
const allowedScripts = {
  'test:e2e': 'playwright test',
  'verify:scenarios2-5': 'node scripts/verify-chatgpt-scenarios-2-5.mjs'
};
for (const [name, command] of Object.entries(allowedScripts)) {
  assert.equal(currentScripts[name], command, `${name} uses its approved command`);
  delete currentScripts[name];
  delete baselineScripts[name];
}
assert.deepEqual(currentScripts, baselineScripts, 'no scripts outside the dedicated browser and scenario verification scripts may differ from HEAD');

const packageLock = JSON.parse(await read('package-lock.json'));
const baselinePackageLock = JSON.parse(execFileSync('git', ['show', 'HEAD:package-lock.json'], { encoding: 'utf8' }));
assert.equal(packageLock.lockfileVersion, baselinePackageLock.lockfileVersion);
const currentLockRoot = { ...packageLock.packages[''] };
currentLockRoot.devDependencies = { ...currentLockRoot.devDependencies };
delete currentLockRoot.devDependencies['@playwright/test'];
const baselineLockRoot = { ...baselinePackageLock.packages[''] };
baselineLockRoot.devDependencies = { ...baselineLockRoot.devDependencies };
delete baselineLockRoot.devDependencies['@playwright/test'];
assert.deepEqual(currentLockRoot, baselineLockRoot, 'lockfile root changes only for the authorized Playwright dependency');
const currentLockedPackages = { ...packageLock.packages };
currentLockedPackages[''] = { ...currentLockedPackages[''], devDependencies: { ...currentLockedPackages[''].devDependencies } };
delete currentLockedPackages[''].devDependencies['@playwright/test'];
const baselineLockedPackages = { ...baselinePackageLock.packages };
baselineLockedPackages[''] = { ...baselineLockedPackages[''], devDependencies: { ...baselineLockedPackages[''].devDependencies } };
delete baselineLockedPackages[''].devDependencies['@playwright/test'];
for (const name of [
  'node_modules/@playwright/test', 'node_modules/playwright', 'node_modules/playwright-core',
  'node_modules/playwright/node_modules/fsevents'
]) {
  delete currentLockedPackages[name];
  delete baselineLockedPackages[name];
}
assert.deepEqual(currentLockedPackages, baselineLockedPackages, 'lockfile contains no changes outside the authorized Playwright dependency graph');

for (const route of ['productLabels', 'productLabelDetail', 'promotionTypes', 'promotionTypeCreate', 'promotionTypeDetail', 'promotions', 'promotionCreate', 'promotionEdit']) {
  assert.match(chatgptMeta, new RegExp(`${route}: \\{ id: '${route}'`), `ChatGPT owns ${route}`);
}
assert.match(chatgptRoutes, /import\('\.\.\/features\/product-labels\/ProductLabelsListPage'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/product-labels\/ProductLabelQuickViewRoute'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/promotion-types\/PromotionTypesListPage'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/promotion-types\/PromotionTypeDrawerRoute'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/promotions\/PromotionsListPage'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/promotions\/PromotionCreatePage'\)/);
assert.match(chatgptRoutes, /import\('\.\.\/features\/promotions\/PromotionEditPage'\)/);
assert.equal((chatgptRoutes.match(/lazy: async/g) ?? []).length, 15, 'overview, showcase, Scenario 1 pilots and Scenarios 2–5 remain lazy');
for (const [route, page] of [
  ['unsavedChanges', 'scenario2/UnsavedChangesPage'],
  ['reorderPagination', 'scenario3/ReorderPaginationPage'],
  ['tabsVsAnchor', 'scenario4/TabsVsAnchorPage'],
  ['productSettings', 'scenario5/ProductSettingsPage']
]) {
  assert.match(chatgptMeta, new RegExp(`${route}: \\{ id: '${route}'`), `ChatGPT owns ${route}`);
  assert.match(chatgptRoutes, new RegExp(`import\\('\\.\\./features/${page}'\\)`), `${route} stays lazy`);
}

assert.doesNotMatch(claudeMeta, /product-labels/);
assert.doesNotMatch(claudeRoutes, /features\/product-labels/);
assert.equal((claudeMeta.match(/id: '[A-Za-z]+'/g) ?? []).length, 31, 'pre-existing Claude canonical routes are retained');
assert.match(claudeMeta, /relativePath: 'promotion-types'/);
assert.match(claudeMeta, /relativePath: 'promotions'/);
assert.doesNotMatch(claudeRoutes, /PromotionFullPage|PromotionHistoryLogViewer/);
assert.doesNotMatch(await read('src/features/promotions/PromotionsListPage.tsx'), /PromotionHistoryLogViewer|history\.view/);
assert.doesNotMatch(await read('src/features/promotion-types/PromotionTypeDrawerRoute.tsx'), /useBlocker|beforeunload/);
assert.match(legacyRoutes, /Object\.values\(claudeRouteMeta\)/);

for (const path of [
  'src/chatgpt/features/product-labels/ProductLabelsListPage.tsx',
  'src/chatgpt/features/product-labels/ProductLabelQuickViewRoute.tsx',
  'src/chatgpt/features/promotion-types/PromotionTypesListPage.tsx',
  'src/chatgpt/features/promotion-types/PromotionTypeDrawerRoute.tsx',
  'src/chatgpt/features/promotions/PromotionsListPage.tsx',
  'src/chatgpt/features/promotions/PromotionFullPage.tsx',
  'src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx'
]) {
  const source = await read(path);
  assert.doesNotMatch(source, /@\/claude\/|claudePath/, `${path} does not depend on Claude routing`);
}
assert.match(await read('src/chatgpt/features/product-labels/ProductLabelsListPage.tsx'), /location\.search, hash: location\.hash/);
assert.match(await read('src/chatgpt/features/promotion-types/PromotionTypeDrawerRoute.tsx'), /location\.search\}\$\{location\.hash/);
assert.match(await read('src/chatgpt/features/promotions/PromotionFullPage.tsx'), /location\.search\}\$\{location\.hash/);

const resourcesSource = await read('src/i18n/resources.ts');
const { outputText } = ts.transpileModule(resourcesSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
});
const resources = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
assert.deepEqual(Object.keys(resources.resources.vi.chatgpt.scenario1).sort(), Object.keys(resources.resources.en.chatgpt.scenario1).sort());
for (const key of ['productLabels', 'promotionType', 'promotion']) {
  assert.deepEqual(Object.keys(resources.resources.vi.chatgpt.scenario1[key]).sort(), Object.keys(resources.resources.en.chatgpt.scenario1[key]).sort());
}
assert.deepEqual(Object.keys(resources.resources.vi.chatgpt.pages.promotion.history).sort(), Object.keys(resources.resources.en.chatgpt.pages.promotion.history).sort());
for (const key of ['scenario2', 'scenario3', 'scenario4', 'scenario5']) {
  assert.deepEqual(Object.keys(resources.resources.vi.chatgpt.pages[key]).sort(), Object.keys(resources.resources.en.chatgpt.pages[key]).sort());
}

const scenariosSource = await read('src/compare/scenarios.ts');
const { outputText: scenariosOutput } = ts.transpileModule(scenariosSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
});
const scenariosModule = await import(`data:text/javascript;base64,${Buffer.from(scenariosOutput).toString('base64')}`);
const scenarioOne = scenariosModule.scenarioById.get('drawer-vs-full-page');
assert.equal(scenarioOne.title, 'Product Detail Presentation Patterns');
assert.deepEqual(scenarioOne.criteria.map(({ id }) => id), ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'validation', 'deep-link']);
assert.deepEqual(scenariosModule.scenarios.map(({ id }) => id), ['drawer-vs-full-page', 'unsaved-changes', 'reorder-pagination', 'tabs-vs-anchor', 'contextual-save']);
assert.equal(scenarioOne.chatgpt.availability, 'available');
assert.equal(scenarioOne.chatgpt.url, '/chatgpt/product-labels');
for (const [id, url] of [
  ['unsaved-changes', '/chatgpt/experiments/unsaved-changes'],
  ['reorder-pagination', '/chatgpt/experiments/reorder-pagination'],
  ['tabs-vs-anchor', '/chatgpt/experiments/tabs-vs-anchor'],
  ['contextual-save', '/chatgpt/product-settings/product-setting-1']
]) {
  const scenario = scenariosModule.scenarioById.get(id);
  assert.equal(scenario.chatgpt.url, url);
  assert.equal(scenario.chatgpt.availability, 'available');
}
assert.match(await read('src/compare/CompareWorkspace.tsx'), /scenarioPilotLinks\(t\)/);
for (const route of ['productLabels', 'promotionTypes', 'promotions']) {
  assert.match(await read('src/chatgpt/routes/route-meta.ts'), new RegExp(`${route}: \\{ id: '${route}'`));
}
assert.match(await read('src/compare/CompareWorkspace.tsx'), /promotionHistoryHelp/);
assert.doesNotMatch(await read('src/chatgpt/routes/route-meta.ts'), /promotionHistory:/, 'History remains a route-less Modal entry from Promotions');

execFileSync('git', ['diff', '--quiet', 'HEAD', '--',
  'src/compare/records.ts', 'src/routes/router.tsx', 'src/routes/legacy-redirects.tsx', 'src/App.tsx'
], { stdio: 'inherit' });
execFileSync('git', ['diff', '--quiet', 'HEAD', '--',
  'src/features/promotion-types/demo-promotion-types-data.ts',
  'src/features/promotion-types/promotion-types.service.ts',
  'src/features/promotion-types/promotion-types.queries.hook.ts',
  'src/features/promotions/demo-promotions-data.ts',
  'src/features/promotions/promotions.service.ts',
  'src/features/promotions/promotions.queries.hook.ts',
  'src/features/product-labels/demo-product-labels-data.ts'
], { stdio: 'inherit' });

console.log('PASS: Scenario 1 route ownership is ChatGPT-only; legacy Claude Promotions and Promotion Types remain registered.');
console.log('PASS: Claude retains 31 canonical route patterns; Product Label pilot is removed without cross-platform redirects.');
console.log('PASS: lazy route modules, path isolation, query-state contracts, and vi/en pilot key parity.');
console.log('PASS: Compare identifiers and persistent record/export implementation are unchanged; Scenario 1 destination presentation is available.');
