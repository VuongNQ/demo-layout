// Fictional service layer, fictional base path. This does NOT mirror any
// real HDS Admin endpoint — it exists only so the demo has an async,
// paginated, mutable data source behind TanStack Query, the way a real
// ApiFetcher-backed service would.
import { generateDemoOfferTypes, INITIAL_OFFER_TYPE_COUNT, type OfferType } from '@/data/demo-data';
import { getLocalDataOverride } from '@/local-data-loader/local-data.store';

const FAKE_BASE_PATH = '/api/demo/offer-types';
void FAKE_BASE_PATH; // documents the fictional path; no real fetch uses it

let store: OfferType[] = generateDemoOfferTypes(INITIAL_OFFER_TYPE_COUNT);

function currentData(): OfferType[] {
  return getLocalDataOverride() ?? store;
}

function delay(min = 300, max = 600) {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type OfferTypeListParams = {
  page: number;
  pageSize: number;
};

export type OfferTypeListResult = {
  items: OfferType[];
  total: number;
};

export async function listOfferTypes(params: OfferTypeListParams): Promise<OfferTypeListResult> {
  await delay();
  const data = [...currentData()].sort((a, b) => a.priority - b.priority);
  const start = (params.page - 1) * params.pageSize;
  return {
    items: data.slice(start, start + params.pageSize),
    total: data.length
  };
}

export async function getOfferTypeById(id: string): Promise<OfferType | undefined> {
  await delay();
  return currentData().find((item) => item.id === id);
}

export async function createOfferType(input: Omit<OfferType, 'id' | 'priority'>): Promise<OfferType> {
  await delay();
  // Demo simplification: writes always land in the generated in-memory
  // store, even while a local-data override is active for reads. A
  // real service would not have this split; this sketch does not need
  // write-through for an imported JSON snapshot.
  const maxPriority = Math.max(0, ...store.map((item) => item.priority));
  const created: OfferType = { ...input, id: `offer-${Date.now()}`, priority: maxPriority + 1 };
  store = [...store, created];
  return created;
}

export async function updateOfferType(id: string, patch: Partial<OfferType>): Promise<OfferType> {
  await delay();
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Offer type ${id} not found`);
  return updated;
}

export async function reorderOfferTypes(orderedIds: string[]): Promise<void> {
  await delay(150, 300);
  const priorityById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  store = store.map((item) => {
    const nextPriority = priorityById.get(item.id);
    return nextPriority ? { ...item, priority: nextPriority } : item;
  });
}
