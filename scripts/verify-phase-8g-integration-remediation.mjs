import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const read = (path) => readFile(path, 'utf8');

async function loadTypeScript(path) {
  const source = await read(path);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const scenariosModule = await loadTypeScript('src/compare/scenarios.ts');
const routeMeta = await loadTypeScript('src/chatgpt/routes/route-meta.ts');
const compareRecords = await loadTypeScript('src/compare/records.ts');
const scenario = scenariosModule.scenarioById.get('drawer-vs-full-page');
assert(scenario, 'Scenario 1 retains its stable ID');
assert.equal(scenario.title, 'Product Detail Presentation Patterns');
assert.deepEqual(scenario.criteria.map(({ id }) => id), ['completion', 'context', 'keyboard', 'narrow', 'confidence', 'validation', 'deep-link']);
assert.deepEqual(scenariosModule.scenarios.map(({ id }) => id), ['drawer-vs-full-page', 'unsaved-changes', 'reorder-pagination', 'tabs-vs-anchor', 'contextual-save']);

const pilotPaths = [
  ['productLabels', '/chatgpt/product-labels'],
  ['promotionTypes', '/chatgpt/promotion-types'],
  ['promotions', '/chatgpt/promotions'],
  ['promotions', '/chatgpt/promotions']
];
for (const [routeId, expectedPath] of pilotPaths) assert.equal(routeMeta.chatgptPath(routeId), expectedPath);
assert.equal(scenario.chatgpt.url, routeMeta.chatgptPath('productLabels'));
assert.equal(scenario.chatgpt.availability, 'available');
const chatgptRouteMeta = await read('src/chatgpt/routes/route-meta.ts');
for (const expected of ['product-labels', 'promotion-types', 'promotions']) assert(chatgptRouteMeta.includes(`relativePath: '${expected}'`));
assert.doesNotMatch(chatgptRouteMeta, /promotionHistory/, 'Promotion History has no dedicated route');

const compareUi = await read('src/compare/CompareWorkspace.tsx');
assert.match(compareUi, /scenarioPilotLinks\(t\)/);
assert.match(compareUi, /chatgptPath\('productLabels'\)/);
assert.match(compareUi, /chatgptPath\('promotionTypes'\)/);
assert.match(compareUi, /chatgptPath\('promotions'\)/);
assert.match(compareUi, /promotionHistoryHelp/);
assert.match(compareUi, /scenario\.chatgpt\.availability === 'available'/);

const recordSource = await read('src/compare/records.ts');
assert.match(recordSource, /compare-workspace:v1:/);
assert.match(recordSource, /'approved'/);
assert.equal((recordSource.match(/'scenario_id', 'scenario', 'fictional_record', 'task', 'expected_outcome', 'reproduction_steps', 'criterion_id', 'criterion', 'check', 'claude_url', 'claude_current_url', 'claude_availability', 'chatgpt_url', 'chatgpt_availability', 'claude_observation', 'chatgpt_observation', 'evidence', 'decision_status', 'decision_owner', 'decision_date', 'rationale', 'open_questions'/g) ?? []).length, 1);
const header = compareRecords.matrixCsv([scenario], { [scenario.id]: compareRecords.emptyRecord(scenario) }).split('\r\n', 1)[0];
const headers = header.replace(/^\uFEFF/, '').slice(1, -1).split('\",\"');
assert.equal(headers.length, 22);
assert.deepEqual(headers, ['scenario_id', 'scenario', 'fictional_record', 'task', 'expected_outcome', 'reproduction_steps', 'criterion_id', 'criterion', 'check', 'claude_url', 'claude_current_url', 'claude_availability', 'chatgpt_url', 'chatgpt_availability', 'claude_observation', 'chatgpt_observation', 'evidence', 'decision_status', 'decision_owner', 'decision_date', 'rationale', 'open_questions']);
assert.match(recordSource, /'\\uFEFF'/);
assert.match(recordSource, /'\\r\\n'/);
assert.match(recordSource, /compare-matrix-local-draft\.csv/);
execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'src/compare/records.ts'], { stdio: 'inherit' });

const resourcesModule = await loadTypeScript('src/i18n/resources.ts');
const resources = resourcesModule.resources;
assert.notEqual(resources.vi.chatgpt.pages.promotionType, resources.vi.claude.pages.promotionType);
assert.notEqual(resources.vi.chatgpt.pages.promotion, resources.vi.claude.pages.promotion);
assert.notEqual(resources.en.chatgpt.pages.promotionType, resources.en.claude.pages.promotionType);
assert.notEqual(resources.en.chatgpt.pages.promotion, resources.en.claude.pages.promotion);
assert.notEqual(resources.vi.chatgpt.pages.promotion.history, resources.vi.claude.pages.promotion.history);
assert(!/chatgptPilotPages[\s\S]*?composedResources\.(?:vi|en)\.claude\.pages/.test(await read('src/i18n/resources.ts')));

function deepKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object' && !Array.isArray(child) ? [path, ...deepKeys(child, path)] : [path];
  }).sort();
}
for (const path of ['chatgpt', 'compare']) assert.deepEqual(deepKeys(resources.vi[path]), deepKeys(resources.en[path]), `${path} vi/en key parity`);

const shell = await read('src/chatgpt/layout/ChatGPTLayout.tsx');
const fullPage = await read('src/chatgpt/features/promotions/PromotionFullPage.tsx');
assert.equal((shell.match(/<main\b/g) ?? []).length, 1);
assert.equal((fullPage.match(/<main\b/g) ?? []).length, 0, 'Promotion Full Page does not nest a main landmark');
assert.match(shell, /parentRoute/);
assert.match(shell, /aria-current=\{pageId === id \? 'page' : id === menuId && pageId !== id \? 'location' : undefined\}/);
assert.match(shell, /aria-current="page"/);
for (const crumb of ['pages.promotionType.createBreadcrumb', 'pages.promotionType.editBreadcrumb', 'pages.promotion.createBreadcrumb', 'pages.promotion.editBreadcrumb']) assert(chatgptRouteMeta.includes(crumb));
assert.match(shell, /<Link to=\{chatgptMenuItem\(parentRoute\.id\)\.path\}>/);

const historyViewer = await read('src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx');
assert.match(historyViewer, /onSubmitCapture=\{captureCommentSubmit\}/);
assert.match(historyViewer, /event\.preventDefault\(\);\s*event\.stopPropagation\(\)/);
assert.match(historyViewer, /submittingEventIdRef/);
assert.match(historyViewer, /selectedEventIdRef\.current/);
assert.match(historyViewer, /form\.getFieldValue\('comment'\) !== values\.comment/);
assert.match(historyViewer, /onFinishFailed=\{releaseCommentSubmit\}/);
assert.match(historyViewer, /form\.resetFields\(\);\s*setConfirmation\(null\);\s*releaseCommentSubmit\(\)/);
assert.match(historyViewer, /onValuesChange=\{\(\) => setCommentFeedbackEventId\(undefined\)\}/);
assert.match(historyViewer, /setCommentFeedbackEventId\(undefined\);\s*\}, \[event\?\.id\]\)/);
assert.doesNotMatch(historyViewer, /fetch\(|axios\.|deduplicat/i);

const promotionTypeRoute = await read('src/chatgpt/features/promotion-types/PromotionTypeDrawerRoute.tsx');
assert.match(promotionTypeRoute, /form\.isFieldsTouched\(\)/, 'Phase 8B touched-based dirty behavior is preserved');
const promotionsService = await read('src/features/promotions/promotions.service.ts');
const listService = promotionsService.match(/export async function listPromotions\(\)[\s\S]*?\n\}/)?.[0] ?? '';
assert.match(listService, /await/);
assert.match(listService, /store/);
assert.doesNotMatch(listService, /throw|reject|fetch\(/, 'current mock list service has no demonstrated failure path');

const claudeMeta = await read('src/claude/routes/route-meta.ts');
assert.equal((claudeMeta.match(/id: '[A-Za-z]+'/g) ?? []).length, 31);
assert.match(claudeMeta, /relativePath: 'promotion-types'/);
assert.match(claudeMeta, /relativePath: 'promotions'/);
assert.doesNotMatch(claudeMeta, /product-labels|promotionHistory/);
assert.doesNotMatch(await read('src/features/promotions/PromotionsListPage.tsx'), /PromotionHistoryLogViewer/);

for (const path of [
  'scripts/verify-phase-8g-integration-remediation.mjs',
  'docs/reports/2026-11-08/phase-8g-scenario-1-integration-remediation.md'
]) assert.doesNotMatch(await read(path), /[\t ]+$/m, `No trailing whitespace in ${path}`);

console.log('PASS: four ChatGPT pilot links resolve to registered routes; Scenario 1 availability and display title are updated.');
console.log('PASS: Scenario ID, seven criterion IDs, storage namespace, status identifiers, 22 CSV columns and filename contract are preserved.');
console.log('PASS: ChatGPT pilot resources are independent from Claude page objects and vi/en keys are in parity.');
console.log('PASS: one ChatGPT main landmark, parent-aware breadcrumbs/current semantics, and comment submit/feedback source contracts.');
console.log('PASS: Phase 8B touched-based dirty behavior, current Promotions mock failure limitation and 31-route Claude baseline remain intact.');
