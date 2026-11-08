import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
}

async function loadTypeScriptModule(path) {
  return import(`data:text/javascript;base64,${Buffer.from(transpile(await readFile(path, 'utf8'))).toString('base64')}`);
}

const fixtureSource = await readFile('src/features/promotions/demo-promotions-data.ts', 'utf8');
const fixtureUrl = `data:text/javascript;base64,${Buffer.from(transpile(fixtureSource)).toString('base64')}`;
const historySource = transpile(await readFile('src/features/promotions/promotion-history.data.ts', 'utf8'))
  .replace("from './demo-promotions-data';", `from '${fixtureUrl}';`);
const history = await import(`data:text/javascript;base64,${Buffer.from(historySource).toString('base64')}`);
const promotion = (await loadTypeScriptModule('src/features/promotions/demo-promotions-data.ts'))
  .generatePromotions(6)[0];
const events = history.getPromotionHistoryEvents(promotion.id);
assert.equal(events.length, 2);
assert.deepEqual(events.map((event) => event.id), [
  `promotion-history-${promotion.id}-products`,
  `promotion-history-${promotion.id}-created`
]);
assert.equal(history.findPromotionHistoryEvent(promotion.id, events[1].id).id, events[1].id);
assert.equal(history.findPromotionHistoryEvent(promotion.id, 'missing-event'), undefined);
assert.equal(history.getPromotionHistoryEvents('missing-promotion'), undefined);
assert.equal(events[0].promotionId, promotion.id);

const originalCreatedValue = events[1].changes[0].after;
events[1].changes[0].after = 'caller mutation';
assert.equal(history.getPromotionHistoryEvents(promotion.id)[1].changes[0].after, originalCreatedValue);

const utils = await loadTypeScriptModule('src/features/promotions/promotion-history.utils.ts');
assert.equal(utils.isValidPromotionHistoryComment(' \t\n '), false);
assert.equal(utils.isValidPromotionHistoryComment('  sample note  '), true);
const firstComment = { id: 'c1', eventId: events[1].id, body: 'first', author: 'Demo operator', createdAt: '2026-10-01T10:00:00.000Z', sequence: 1 };
const secondComment = { id: 'c2', eventId: events[1].id, body: 'second', author: 'Demo operator', createdAt: '2026-10-01T10:00:00.000Z', sequence: 2 };
const orderedComments = utils.appendPromotionHistoryComment([secondComment], firstComment);
assert.deepEqual(orderedComments.map((comment) => comment.id), ['c1', 'c2']);
assert(orderedComments.every((comment) => comment.eventId === events[1].id));

const copyLabels = {
  eventId: 'Event ID', promotionId: 'Promotion ID', action: 'Action', eventAction: 'Promotion created (sample)',
  timestamp: 'Timestamp', actor: 'Actor', source: 'Source', changes: 'Changes', before: 'Before', after: 'After',
  notApplicable: 'Not applicable',
  fields: { name: 'Promotion name', code: 'Code', offerType: 'Offer type', status: 'Status', assignedProducts: 'Applicable products' }
};
const copied = utils.formatPromotionHistoryCopyText(history.findPromotionHistoryEvent(promotion.id, events[1].id), copyLabels);
assert(copied.includes(`Event ID: ${events[1].id}`));
assert(copied.includes('Promotion name'));
assert(copied.includes(promotion.name));
assert(!copied.includes(firstComment.body), 'copy contains event fields only, not comments');

const resources = await loadTypeScriptModule('src/i18n/resources.ts');
assert.deepEqual(
  Object.keys(resources.resources.vi.chatgpt.pages.promotion.history).sort(),
  Object.keys(resources.resources.en.chatgpt.pages.promotion.history).sort()
);

const viewerSource = await readFile('src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx', 'utf8');
const listSource = await readFile('src/chatgpt/features/promotions/PromotionsListPage.tsx', 'utf8');
assert.match(viewerSource, /<Modal[\s\S]*?aria-labelledby="promotion-history-modal-title"/);
assert.match(viewerSource, /afterOpenChange=\{\(visible\) => \{ if \(!visible\) onAfterClose\(\); \}\}/);
assert.match(viewerSource, /navigator\.clipboard\?\.writeText/);
assert.match(viewerSource, /catch \{[\s\S]*?kind: 'failure'/);
assert.match(viewerSource, /commentsByEvent\[event\.id\]/);
assert.match(viewerSource, /eventId: submissionEvent\.id/);
assert.match(viewerSource, /submissionEventId !== selectedEventIdRef\.current/);
assert.match(viewerSource, /hasMeaningfulDraft[\s\S]*?setConfirmation\(\{ kind: 'close' \}\)/);
assert.match(viewerSource, /discardDraftAndContinue/);
assert.match(viewerSource, /Form\.useForm<CommentFormValues>/);
assert.match(listSource, /pages\.promotion\.history\.viewFor/);
assert.match(listSource, /getPromotionHistoryEvents\(record\.id\)/);
assert.match(listSource, /PromotionHistoryLogViewer/);

for (const path of [
  'src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx',
  'src/chatgpt/features/promotions/PromotionHistoryLogViewer.module.scss',
  'src/features/promotions/promotion-history.data.ts',
  'src/features/promotions/promotion-history.utils.ts',
  'scripts/verify-promotion-history-log-viewer.mjs',
  'docs/reports/2026-11-08/phase-8d-promotion-history-log-viewer.md'
]) {
  assert.doesNotMatch(await readFile(path, 'utf8'), /[\t ]+$/m, `No trailing whitespace in ${path}`);
}

console.log('PASS: stable event IDs, descending order, lookup and unknown event/promotion handling');
console.log('PASS: event records are exposed as copies; caller mutation does not alter fixture payload');
console.log('PASS: comment validation, event association and deterministic insertion ordering');
console.log('PASS: copied text includes labeled event data only and excludes comment content');
console.log('PASS: vi/en history translation-key parity and modal/focus/copy/draft source contracts');
console.log('PASS: new Phase 8D source, verifier, and report contain no trailing whitespace');
