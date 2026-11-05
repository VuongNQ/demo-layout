// Fictional service, fictional path.
import {
  generateDisplayInformationSets,
  INITIAL_DISPLAY_INFORMATION_SET_COUNT,
  type DisplayInformationSet
} from './demo-display-information-sets-data';

const FAKE_BASE_PATH = '/api/demo/display-information-sets';
void FAKE_BASE_PATH;

let store: DisplayInformationSet[] = generateDisplayInformationSets(INITIAL_DISPLAY_INFORMATION_SET_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listDisplayInformationSets(): Promise<DisplayInformationSet[]> {
  await delay();
  return store;
}

export async function getDisplayInformationSetById(id: string): Promise<DisplayInformationSet | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateDisplayInformationSet(
  id: string,
  patch: Partial<DisplayInformationSet>
): Promise<DisplayInformationSet> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Display information set ${id} not found`);
  return updated;
}
