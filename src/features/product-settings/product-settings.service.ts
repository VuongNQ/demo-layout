// Fictional service, fictional path.
import {
  generateProductSettingsList,
  INITIAL_PRODUCT_SETTINGS_COUNT,
  type ProductSettings
} from './demo-product-settings-data';

const FAKE_BASE_PATH = '/api/demo/product-settings';
void FAKE_BASE_PATH;

let store: ProductSettings[] = generateProductSettingsList(INITIAL_PRODUCT_SETTINGS_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listProductSettings(): Promise<ProductSettings[]> {
  await delay();
  return store;
}

export async function getProductSettingsById(id: string): Promise<ProductSettings | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateProductSettings(id: string, patch: Partial<ProductSettings>): Promise<ProductSettings> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Product settings ${id} not found`);
  return updated;
}
