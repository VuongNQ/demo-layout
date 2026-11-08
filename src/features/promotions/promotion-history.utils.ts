import type { PromotionHistoryEvent, PromotionHistoryField, PromotionHistoryValue } from './promotion-history.data';

export type PromotionHistoryComment = Readonly<{
  id: string;
  eventId: string;
  body: string;
  author: string;
  createdAt: string;
  sequence: number;
}>;

export type PromotionHistoryCopyLabels = Readonly<{
  eventId: string;
  promotionId: string;
  action: string;
  eventAction: string;
  timestamp: string;
  actor: string;
  source: string;
  changes: string;
  before: string;
  after: string;
  notApplicable: string;
  fields: Readonly<Record<PromotionHistoryField, string>>;
}>;

export function isValidPromotionHistoryComment(value: string): boolean {
  return value.trim().length > 0;
}

export function appendPromotionHistoryComment(
  current: readonly PromotionHistoryComment[],
  comment: PromotionHistoryComment
): PromotionHistoryComment[] {
  return [...current, comment].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.sequence - right.sequence);
}

function formatValue(value: PromotionHistoryValue, notApplicable: string): string {
  if (value === null) return notApplicable;
  if (typeof value === 'string') return value;
  return value.length ? value.join(', ') : notApplicable;
}

export function formatPromotionHistoryCopyText(
  event: PromotionHistoryEvent,
  labels: PromotionHistoryCopyLabels
): string {
  const lines = [
    `${labels.eventId}: ${event.id}`,
    `${labels.promotionId}: ${event.promotionId}`,
    `${labels.action}: ${labels.eventAction}`,
    `${labels.timestamp}: ${event.occurredAt}`,
    `${labels.actor}: ${event.actor}`,
    `${labels.source}: ${event.source}`,
    labels.changes
  ];
  for (const change of event.changes) {
    lines.push(`- ${labels.fields[change.field]}`);
    lines.push(`  ${labels.before}: ${formatValue(change.before, labels.notApplicable)}`);
    lines.push(`  ${labels.after}: ${formatValue(change.after, labels.notApplicable)}`);
  }
  return lines.join('\n');
}
