// Fictional service, fictional path.
import { generateAddOnProducts, INITIAL_ADD_ON_COUNT, type AddOnProduct } from './demo-add-ons-data';

const FAKE_BASE_PATH = '/api/demo/add-ons';
void FAKE_BASE_PATH;

let store: AddOnProduct[] = generateAddOnProducts(INITIAL_ADD_ON_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listAddOnProducts(): Promise<AddOnProduct[]> {
  await delay();
  return store;
}

export async function getAddOnProductById(id: string): Promise<AddOnProduct | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateAddOnProduct(id: string, patch: Partial<AddOnProduct>): Promise<AddOnProduct> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Add-on product ${id} not found`);
  return updated;
}

export async function batchSetAddOnProductsStatus(ids: string[], status: AddOnProduct['status']): Promise<void> {
  await delay(300, 500);
  const idSet = new Set(ids);
  store = store.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
}
