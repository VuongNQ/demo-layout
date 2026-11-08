import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const utils = await loadTypeScriptModule('src/features/product-labels/product-labels.utils.ts');
const { DEMO_PRODUCT_LABELS } = await loadTypeScriptModule('src/features/product-labels/demo-product-labels-data.ts');

assert.equal(DEMO_PRODUCT_LABELS.length, 12);
assert.deepEqual(utils.filterProductLabels(DEMO_PRODUCT_LABELS, { query: 'pl-cashback', productLine: '', status: '', page: 1 }).map((x) => x.id), ['product-label-004']);
const filtered = utils.filterProductLabels(DEMO_PRODUCT_LABELS, { query: '', productLine: 'cash-loan', status: 'active', page: 1 });
assert(filtered.every((x) => x.productLine === 'cash-loan' && x.status === 'active'));
assert.equal(utils.getProductLabelPage(DEMO_PRODUCT_LABELS, 1).length, 8);
assert.equal(utils.getProductLabelPage(DEMO_PRODUCT_LABELS, 2).length, 4);
assert.deepEqual(utils.parseProductLabelFilters('?q=abc&line=invalid&status=active&page=3'), { query: 'abc', productLine: '', status: 'active', page: 3 });
const updated = new URLSearchParams(utils.updateProductLabelSearch('?keep=yes&q=old&page=2', { query: 'new name&code', productLine: 'credit-card', status: 'inactive', page: 1 }));
assert.equal(updated.get('keep'), 'yes');
assert.equal(updated.get('q'), 'new name&code');
assert.equal(updated.get('line'), 'credit-card');
assert.equal(updated.get('status'), 'inactive');
assert.equal(updated.get('page'), '1');
assert.equal(utils.findProductLabel(DEMO_PRODUCT_LABELS, 'product-label-001')?.id, 'product-label-001');
assert.equal(utils.findProductLabel(DEMO_PRODUCT_LABELS, 'missing'), undefined);

const routeMeta = await readFile('src/chatgpt/routes/route-meta.ts', 'utf8');
const routeConfig = await readFile('src/chatgpt/routes/route-config.tsx', 'utf8');
const extractPaths = (source) => [...source.matchAll(/relativePath: '([^']+)'/g)].map((match) => match[1]);
const chatgptPaths = extractPaths(routeMeta);
assert(chatgptPaths.includes('product-labels') && chatgptPaths.includes('product-labels/:id'));
assert(routeConfig.includes('chatgptRouteMeta.productLabels.relativePath') && routeConfig.includes("path: ':id'"));
assert(routeConfig.includes("import('../features/product-labels/ProductLabelsListPage')") && routeConfig.includes("import('../features/product-labels/ProductLabelQuickViewRoute')"));
const claudeMeta = await readFile('src/claude/routes/route-meta.ts', 'utf8');
assert.doesNotMatch(claudeMeta, /product-labels/);
const claudeRoutes = await readFile('src/claude/routes/route-config.tsx', 'utf8');
assert.doesNotMatch(claudeRoutes, /features\/product-labels/);
const legacy = await readFile('src/routes/legacy-redirects.tsx', 'utf8');
assert(legacy.includes('Object.values(claudeRouteMeta)'), 'legacy routes derive from the expanded platform registry');
const viteConfig = await readFile('vite.config.ts', 'utf8');
const router = await readFile('src/routes/router.tsx', 'utf8');
assert(viteConfig.includes("'/demo-layout/'") && router.includes('basename: import.meta.env.BASE_URL'));
const spaFallback = await readFile('scripts/spa-fallback.mjs', 'utf8');
assert(spaFallback.includes("copyFile('dist/index.html', 'dist/404.html')"));

console.log('PASS: filter/pagination determinism, query round-trip, valid/invalid lookup');
console.log('PASS: Product Label pilot is ChatGPT-owned with a nested lazy drawer and no Claude registration');
console.log('PASS: configured Pages basename and SPA fallback source');
