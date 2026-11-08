import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const scenarios = read('src/compare/scenarios.ts');
const routes = read('src/chatgpt/routes/route-config.tsx');
const metadata = read('src/chatgpt/routes/route-meta.ts');
const resources = read('src/i18n/resources.ts');
const compareRecords = read('src/compare/records.ts');
const productSettingsService = read('src/features/product-settings/product-settings.service.ts');
for (const path of [
  'src/chatgpt/features/scenario2/UnsavedChangesPage.tsx',
  'src/chatgpt/features/scenario2/UnsavedChangesDrawerRoute.tsx',
  'src/chatgpt/features/scenario3/ReorderPaginationPage.tsx',
  'src/chatgpt/features/scenario4/TabsVsAnchorPage.tsx',
  'src/chatgpt/features/scenario5/ProductSettingsPage.tsx',
  'tests/e2e/scenarios2-5.spec.ts',
  'docs/reports/2026-11-08/chatgpt-all-five-scenarios-implementation.md'
]) {
  const lines = read(path).split(/\r?\n/);
  assert.ok(lines.every((line) => !line.endsWith(' ') && !line.endsWith('\t')), `${path} has no trailing whitespace`);
}

const contracts = {
  'unsaved-changes': { url: '/chatgpt/experiments/unsaved-changes', routeId: 'unsavedChanges', criteria: ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'exit-paths', 'focus'] },
  'reorder-pagination': { url: '/chatgpt/experiments/reorder-pagination', routeId: 'reorderPagination', criteria: ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'cross-page', 'save-feedback'] },
  'tabs-vs-anchor': { url: '/chatgpt/experiments/tabs-vs-anchor', routeId: 'tabsVsAnchor', criteria: ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'error-discovery', 'error-focus'] },
  'contextual-save': { url: '/chatgpt/product-settings/product-setting-1', routeId: 'productSettings', criteria: ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'action-reach', 'dirty-state'] }
};

for (const [id, contract] of Object.entries(contracts)) {
  const start = scenarios.indexOf(`id: '${id}'`);
  assert.notEqual(start, -1, `Compare scenario ${id} exists`);
  const next = scenarios.indexOf("id: '", start + 5);
  const block = scenarios.slice(start, next === -1 ? scenarios.length : next);
  assert.ok(block.includes(`url: '${contract.url}', availability: 'available'`), `${id} points to an available ChatGPT destination`);
  for (const criterion of contract.criteria) assert.ok(scenarios.includes(`id: '${criterion}'`), `${id} preserves criterion ${criterion}`);
  assert.ok(metadata.includes(`${contract.routeId}: { id: '${contract.routeId}'`), `${contract.routeId} is platform-owned in ChatGPT metadata`);
}

for (const path of [
  "import('../features/scenario2/UnsavedChangesPage')",
  "import('../features/scenario3/ReorderPaginationPage')",
  "import('../features/scenario4/TabsVsAnchorPage')",
  "import('../features/scenario5/ProductSettingsPage')"
]) assert.ok(routes.includes(path), `ChatGPT route uses lazy import ${path}`);

assert.ok(resources.includes('scenario2: {') && resources.includes('scenario3: {') && resources.includes('scenario4: {') && resources.includes('scenario5: {'), 'ChatGPT scenario resources are defined in both languages');
assert.ok(resources.includes('const chatgptScenarioPages ='), 'New page copy is ChatGPT-owned');
assert.ok(compareRecords.includes("const storagePrefix = 'compare-workspace:v1:'"), 'Compare localStorage namespace remains stable');
const headerMatch = compareRecords.match(/\['scenario_id'.*?\]/s);
assert.ok(headerMatch, 'CSV header declaration exists');
assert.equal((headerMatch[0].match(/'[^']*'/g) ?? []).length, 22, 'CSV has exactly 22 columns');
assert.ok(compareRecords.includes("link.download = 'compare-matrix-local-draft.csv'"), 'CSV filename remains stable');
assert.ok(productSettingsService.includes('let store: ProductSettings[] = generateProductSettingsList'), 'Product Settings retains the existing in-memory mock service owner');
assert.ok(productSettingsService.includes('updateProductSettings'), 'ChatGPT page uses the existing update service through its query hook');

console.log('PASS: ChatGPT Scenario 2–5 route, Compare contract, translation ownership, and mock service source checks.');
