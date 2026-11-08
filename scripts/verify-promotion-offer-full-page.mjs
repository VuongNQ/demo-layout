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

const formUtils = await loadTypeScriptModule('src/features/promotions/promotion-form.utils.ts');
const data = await loadTypeScriptModule('src/features/promotions/demo-promotions-data.ts');
const initial = data.generatePromotions(data.INITIAL_PROMOTION_COUNT)[0];
const baseline = formUtils.getPromotionFormValues(initial);
assert(formUtils.arePromotionFormValuesEqual(baseline, formUtils.copyPromotionFormValues(baseline)));
assert(!formUtils.arePromotionFormValuesEqual({ ...baseline, name: `${baseline.name} changed` }, baseline));
assert(!formUtils.arePromotionFormValuesEqual({ ...baseline, assignedProducts: [...baseline.assignedProducts].reverse() }, baseline));
assert(formUtils.arePromotionFormValuesEqual({ ...baseline, assignedProducts: [...baseline.assignedProducts] }, baseline));

const fixtureSource = await readFile('src/features/promotions/demo-promotions-data.ts', 'utf8');
const serviceSource = await readFile('src/features/promotions/promotions.service.ts', 'utf8');
const fixtureUrl = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(fixtureSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText).toString('base64')}`;
const serviceOutput = ts.transpileModule(serviceSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText.replace("from './demo-promotions-data';", `from '${fixtureUrl}';`);
const service = await import(`data:text/javascript;base64,${Buffer.from(serviceOutput).toString('base64')}`);
const list = await service.listPromotions();
assert.equal(list.length, data.INITIAL_PROMOTION_COUNT);
const loaded = await service.getPromotionById(initial.id);
assert.equal(loaded.id, initial.id);
const saved = await service.updatePromotion(initial.id, { name: 'Fictional verified edit' });
assert.equal(saved.name, 'Fictional verified edit');
assert.equal((await service.getPromotionById(initial.id)).name, 'Fictional verified edit');
const created = await service.createPromotion({ ...formUtils.getPromotionFormValues(initial), code: 'PROMO-VERIFY' });
assert.equal((await service.getPromotionById(created.id)).code, 'PROMO-VERIFY');
await assert.rejects(() => service.updatePromotion('unknown-promotion', { name: 'Invalid' }), /not found/);

const routeMeta = await readFile('src/chatgpt/routes/route-meta.ts', 'utf8');
const routeConfig = await readFile('src/chatgpt/routes/route-config.tsx', 'utf8');
assert.match(routeMeta, /promotionCreate: \{ id: 'promotionCreate', relativePath: 'promotions\/create'/);
assert.match(routeMeta, /promotionEdit: \{ id: 'promotionEdit', relativePath: 'promotions\/:id\/edit'/);
assert.match(routeConfig, /chatgptRouteMeta\.promotions\.relativePath[\s\S]*?PromotionsListPage/);
assert.match(routeConfig, /chatgptRouteMeta\.promotionCreate\.relativePath[\s\S]*?PromotionCreatePage/);
assert.match(routeConfig, /chatgptRouteMeta\.promotionEdit\.relativePath[\s\S]*?PromotionEditPage/);
assert.match(routeConfig, /import\('\.\.\/features\/promotions\//);

const fullPage = await readFile('src/chatgpt/features/promotions/PromotionFullPage.tsx', 'utf8');
const form = await readFile('src/chatgpt/features/promotions/PromotionForm.tsx', 'utf8');
const listPage = await readFile('src/chatgpt/features/promotions/PromotionsListPage.tsx', 'utf8');
assert.match(fullPage, /Form\.useForm<PromotionFormValues>\(\)/);
assert.match(fullPage, /useBlocker\(/);
assert.match(fullPage, /beforeunload/);
assert.match(fullPage, /arePromotionFormValuesEqual\(currentValues, baselineRef\.current\)/);
assert.match(fullPage, /location\.search\}\$\{location\.hash/);
assert.match(fullPage, /item\.id !== id/);
assert.match(fullPage, /blocker\.proceed\?\./);
assert.match(fullPage, /blocker\.reset\?\./);
assert.match(fullPage, /validationSummary/);
assert.match(fullPage, /scrollToField/);
assert.match(fullPage, /mutateAsync/);
assert.match(form, /name="name"[\s\S]*?name="code"[\s\S]*?name="offerType"[\s\S]*?name="startDate"[\s\S]*?name="endDate"[\s\S]*?name="status"[\s\S]*?name="assignedProducts"/);
assert.match(form, /rules=\{\[\{ required: true/);
assert.match(listPage, /promotionCreate'[\s\S]*?location\.search\}\$\{location\.hash/);
assert.match(listPage, /promotionEdit'[\s\S]*?location\.search\}\$\{location\.hash/);

const resources = await loadTypeScriptModule('src/i18n/resources.ts');
assert.deepEqual(
  Object.keys(resources.resources.vi.chatgpt.pages.promotion).sort(),
  Object.keys(resources.resources.en.chatgpt.pages.promotion).sort()
);

const claudeMeta = await readFile('src/claude/routes/route-meta.ts', 'utf8');
assert.match(claudeMeta, /relativePath: 'promotions\/create'/, 'pre-existing Claude Promotion Offer create route remains');
const claudeForm = await readFile('src/features/promotions/PromotionForm.tsx', 'utf8');
assert.doesNotMatch(claudeForm, /promotion-details|sectionNavigation/, 'Claude retains its pre-Phase-8C form baseline');

for (const path of [
  'src/chatgpt/features/promotions/PromotionFullPage.tsx',
  'src/chatgpt/features/promotions/PromotionFullPage.module.scss',
  'src/chatgpt/features/promotions/PromotionForm.module.scss',
  'src/features/promotions/promotion-form.utils.ts',
  'scripts/verify-promotion-offer-full-page.mjs',
  'docs/reports/2026-11-08/phase-8c-promotion-offer-full-page.md'
]) {
  assert.doesNotMatch(await readFile(path, 'utf8'), /[\t ]+$/m, `No trailing whitespace in ${path}`);
}

console.log('PASS: semantic dirty comparison detects edits and returns to baseline, including product selection order');
console.log('PASS: fictional fixture/service read, update, cache-owner contract and unknown-record failure');
console.log('PASS: ChatGPT owns the Full Page pilot; original Claude create/edit routes and simple form baseline remain');
console.log('PASS: stable create/edit routes, lazy route exports, query/hash return path and navigation/unload guards');
console.log('PASS: existing fields and required validation retained; no additional business fields asserted');
console.log('PASS: Promotion page vi/en translation-key parity');
console.log('PASS: new source, verifier, and report contain no trailing whitespace');
