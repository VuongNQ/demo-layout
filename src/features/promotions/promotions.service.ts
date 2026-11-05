// Fictional service, fictional path.
import { generatePromotions, INITIAL_PROMOTION_COUNT, type Promotion } from './demo-promotions-data';

const FAKE_BASE_PATH = '/api/demo/promotions';
void FAKE_BASE_PATH;

let store: Promotion[] = generatePromotions(INITIAL_PROMOTION_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listPromotions(): Promise<Promotion[]> {
  await delay();
  return store;
}

export async function getPromotionById(id: string): Promise<Promotion | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function createPromotion(patch: Omit<Promotion, 'id'>): Promise<Promotion> {
  await delay(400, 800);
  const created: Promotion = { ...patch, id: `promotion-${store.length + 1}-${Date.now()}` };
  store = [...store, created];
  return created;
}

export async function updatePromotion(id: string, patch: Partial<Promotion>): Promise<Promotion> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Promotion ${id} not found`);
  return updated;
}
