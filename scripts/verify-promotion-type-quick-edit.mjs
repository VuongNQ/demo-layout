import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

async function loadTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const fixture = await loadTypeScriptModule('src/features/promotion-types/demo-promotion-types-data.ts');
const records = fixture.generatePromotionTypes(fixture.INITIAL_PROMOTION_TYPE_COUNT);
assert.equal(records.length, 6);
assert.equal(new Set(records.map((record) => record.id)).size, records.length);
assert(records.every((record) => ['name', 'code', 'status', 'id'].every((key) => key in record)));
assert(records.every((record) => ['active', 'inactive'].includes(record.status)));

const serviceSource = await readFile('src/features/promotion-types/promotion-types.service.ts', 'utf8');
const { outputText } = ts.transpileModule(serviceSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
});
const fixtureUrl = `data:text/javascript;base64,${Buffer.from(await readFile('src/features/promotion-types/demo-promotion-types-data.ts', 'utf8').then((source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText)).toString('base64')}`;
const runnableService = outputText.replace("from './demo-promotion-types-data';", `from '${fixtureUrl}';`);
const service = await import(`data:text/javascript;base64,${Buffer.from(runnableService).toString('base64')}`);
const initialList = await service.listPromotionTypes();
assert.equal((await service.getPromotionTypeById(initialList[0].id)).id, initialList[0].id);
const updated = await service.updatePromotionType(initialList[0].id, { name: 'Fictional updated label' });
assert.equal(updated.name, 'Fictional updated label');
assert.equal((await service.listPromotionTypes())[0].name, 'Fictional updated label');
const created = await service.createPromotionType({ name: 'Fictional new type', code: 'PTYPE-TEST', status: 'active' });
assert.equal((await service.listPromotionTypes()).at(-1).id, created.id);
await assert.rejects(() => service.updatePromotionType('unknown-promotion-type', { name: 'Invalid' }), /not found/);

const routeMeta = await readFile('src/chatgpt/routes/route-meta.ts', 'utf8');
const routeConfig = await readFile('src/chatgpt/routes/route-config.tsx', 'utf8');
assert.match(routeMeta, /promotionTypeCreate: \{ id: 'promotionTypeCreate', relativePath: 'promotion-types\/create'/);
assert.match(routeMeta, /promotionTypeDetail: \{ id: 'promotionTypeDetail', relativePath: 'promotion-types\/:id'/);
assert.match(routeConfig, /path: chatgptRouteMeta\.promotionTypes\.relativePath[\s\S]*?path: 'create'[\s\S]*?path: ':id'/);

const list = await readFile('src/chatgpt/features/promotion-types/PromotionTypesListPage.tsx', 'utf8');
const drawer = await readFile('src/chatgpt/features/promotion-types/PromotionTypeDrawerRoute.tsx', 'utf8');
const form = await readFile('src/chatgpt/features/promotion-types/PromotionTypeForm.tsx', 'utf8');
assert.match(list, /promotionTypeDetail',[^\n]*\$\{location\.search\}\$\{location\.hash\}/);
assert.match(list, /activeIdRef\.current \? actionRefs\.current\[activeIdRef\.current\]/);
assert.match(drawer, /const listUrl = `\$\{chatgptPath\('promotionTypes'\)\}\$\{location\.search\}\$\{location\.hash\}`/);
assert.match(drawer, /useBlocker\(/);
assert.match(drawer, /blocker\.proceed\?\./);
assert.match(drawer, /blocker\.reset\?\./);
assert.match(drawer, /beforeunload/);
assert.match(drawer, /baselineRef\.current = getFormValues\(item\)[\s\S]*?form\.setFieldsValue\(baselineRef\.current\)/);
assert.match(drawer, /status="404"/);
assert.match(drawer, /saveFailed/);
assert.match(drawer, /form\.getFieldInstance\(firstError\.name\)\?\.focus/);
assert.match(form, /rules=\{\[\{ required: true/);
assert.doesNotMatch(form, /initialValues/);

const resources = await loadTypeScriptModule('src/i18n/resources.ts');
const keys = (value) => Object.keys(value).sort();
assert.deepEqual(keys(resources.resources.vi.chatgpt.pages.promotionType), keys(resources.resources.en.chatgpt.pages.promotionType));
assert.equal(resources.resources.vi.chatgpt.pages.promotionType.mechanismNote.length > 0, true);
assert.equal(resources.resources.en.chatgpt.pages.promotionType.mechanismNote.length > 0, true);
const claudeMeta = await readFile('src/claude/routes/route-meta.ts', 'utf8');
assert.match(claudeMeta, /relativePath: 'promotion-types'/, 'pre-existing Claude Promotion Type route remains');
const claudeDrawer = await readFile('src/features/promotion-types/PromotionTypeDrawerRoute.tsx', 'utf8');
assert.doesNotMatch(claudeDrawer, /useBlocker|beforeunload/, 'Claude drawer baseline remains separate from pilot guard behavior');
for (const path of [fileURLToPath(import.meta.url), 'docs/reports/2026-11-08/phase-8b-promotion-type-quick-edit.md']) {
  assert.doesNotMatch(await readFile(path, 'utf8'), /[\t ]+$/m, `No trailing whitespace in ${path}`);
}

console.log('PASS: six stable synthetic fixtures and existing field/status contract');
console.log('PASS: in-memory demo service edit/create persistence and unknown-record save failure');
console.log('PASS: ChatGPT owns the pilot routes while the pre-existing Claude Promotion Type baseline remains registered');
console.log('PASS: existing nested route IDs/paths, list query/hash forwarding, and focus-return fallback');
console.log('PASS: route blocker, discard/stay paths, refresh guard, record initialization, unknown-ID and save-error handling');
console.log('PASS: Ant Design field requirements retained and vi/en Promotion Type translation key parity');
console.log('PASS: no trailing whitespace in the new verifier and report');
