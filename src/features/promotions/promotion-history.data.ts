import { generatePromotions, INITIAL_PROMOTION_COUNT } from './demo-promotions-data';

export type PromotionHistoryField = 'name' | 'code' | 'offerType' | 'status' | 'assignedProducts';
export type PromotionHistoryAction = 'created' | 'productsAssigned';
export type PromotionHistoryValue = string | readonly string[] | null;

export type PromotionHistoryChange = Readonly<{
  field: PromotionHistoryField;
  before: PromotionHistoryValue;
  after: PromotionHistoryValue;
}>;

export type PromotionHistoryEvent = Readonly<{
  id: string;
  promotionId: string;
  occurredAt: string;
  action: PromotionHistoryAction;
  actor: string;
  source: string;
  changes: readonly PromotionHistoryChange[];
}>;

const promotions = generatePromotions(INITIAL_PROMOTION_COUNT);

// Fictional, fixed events derived only from the local fictional fixture.
// These records are examples for the playground and do not claim to be a
// production audit log or evidence of a real operation.
const historyByPromotion: Readonly<Record<string, readonly PromotionHistoryEvent[]>> = Object.freeze(
  Object.fromEntries(promotions.map((promotion, index) => {
    const day = String(index + 1).padStart(2, '0');
    const created: PromotionHistoryEvent = Object.freeze({
      id: `promotion-history-${promotion.id}-created`,
      promotionId: promotion.id,
      occurredAt: `2026-10-${day}T09:30:00.000Z`,
      action: 'created',
      actor: 'Demo operator',
      source: 'Local prototype',
      changes: Object.freeze([
        Object.freeze({ field: 'name' as const, before: null, after: promotion.name }),
        Object.freeze({ field: 'code' as const, before: null, after: promotion.code }),
        Object.freeze({ field: 'offerType' as const, before: null, after: promotion.offerType }),
        Object.freeze({ field: 'status' as const, before: null, after: promotion.status })
      ])
    });
    const productsAssigned: PromotionHistoryEvent = Object.freeze({
      id: `promotion-history-${promotion.id}-products`,
      promotionId: promotion.id,
      occurredAt: `2026-10-${String(index + 2).padStart(2, '0')}T10:15:00.000Z`,
      action: 'productsAssigned',
      actor: 'Demo operator',
      source: 'Local prototype',
      changes: Object.freeze([
        Object.freeze({ field: 'assignedProducts' as const, before: Object.freeze([]) as readonly string[], after: Object.freeze([...promotion.assignedProducts]) })
      ])
    });
    return [promotion.id, Object.freeze([productsAssigned, created])];
  }))
);

function copyValue(value: PromotionHistoryValue): PromotionHistoryValue {
  return Array.isArray(value) ? [...value] : value;
}

function copyEvent(event: PromotionHistoryEvent): PromotionHistoryEvent {
  return {
    ...event,
    changes: event.changes.map((change) => ({
      ...change,
      before: copyValue(change.before),
      after: copyValue(change.after)
    }))
  };
}

export function getPromotionHistoryEvents(promotionId: string): PromotionHistoryEvent[] | undefined {
  const events = historyByPromotion[promotionId];
  return events?.map(copyEvent).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id));
}

export function findPromotionHistoryEvent(promotionId: string, eventId: string): PromotionHistoryEvent | undefined {
  return getPromotionHistoryEvents(promotionId)?.find((event) => event.id === eventId);
}
