// Fictional service, fictional path.
import { generateFeeDefinitions, INITIAL_FEE_COUNT, type FeeDefinition } from './demo-fees-data';

const FAKE_BASE_PATH = '/api/demo/fees';
void FAKE_BASE_PATH;

let store: FeeDefinition[] = generateFeeDefinitions(INITIAL_FEE_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listFees(): Promise<FeeDefinition[]> {
  await delay();
  return store;
}

export async function getFeeById(id: string): Promise<FeeDefinition | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateFee(id: string, patch: Partial<FeeDefinition>): Promise<FeeDefinition> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Fee ${id} not found`);
  return updated;
}
