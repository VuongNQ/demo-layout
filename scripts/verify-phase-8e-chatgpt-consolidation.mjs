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
assert.equal((chatgptRoutes.match(/lazy: async/g) ?? []).length, 10, 'overview, showcase and all pilot pages remain lazy');

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
assert.match(await read('src/compare/CompareWorkspace.tsx'), /scenarioPilotLinks\(t\)/);
for (const route of ['productLabels', 'promotionTypes', 'promotions']) {
  assert.match(await read('src/chatgpt/routes/route-meta.ts'), new RegExp(`${route}: \\{ id: '${route}'`));
}
assert.match(await read('src/compare/CompareWorkspace.tsx'), /promotionHistoryHelp/);
assert.doesNotMatch(await read('src/chatgpt/routes/route-meta.ts'), /promotionHistory:/, 'History remains a route-less Modal entry from Promotions');

execFileSync('git', ['diff', '--quiet', 'HEAD', '--',
  'src/compare/records.ts', 'src/routes/router.tsx', 'src/routes/legacy-redirects.tsx', 'src/App.tsx', 'package.json', 'package-lock.json'
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
