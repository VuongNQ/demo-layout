// Fictional service, fictional path.
import { generatePromotionTypes, INITIAL_PROMOTION_TYPE_COUNT, type PromotionType } from './demo-promotion-types-data';

const FAKE_BASE_PATH = '/api/demo/promotion-types';
void FAKE_BASE_PATH;

let store: PromotionType[] = generatePromotionTypes(INITIAL_PROMOTION_TYPE_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listPromotionTypes(): Promise<PromotionType[]> {
  await delay();
  return store;
}

export async function getPromotionTypeById(id: string): Promise<PromotionType | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function createPromotionType(patch: Omit<PromotionType, 'id'>): Promise<PromotionType> {
  await delay(300, 500);
  const created: PromotionType = { ...patch, id: `promotion-type-${store.length + 1}-${Date.now()}` };
  store = [...store, created];
  return created;
}

export async function updatePromotionType(id: string, patch: Partial<PromotionType>): Promise<PromotionType> {
  await delay(300, 500);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Promotion type ${id} not found`);
  return updated;
}

export async function togglePromotionTypeStatus(id: string): Promise<PromotionType> {
  await delay(200, 400);
  store = store.map((item) =>
    item.id === id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item
  );
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Promotion type ${id} not found`);
  return updated;
}
