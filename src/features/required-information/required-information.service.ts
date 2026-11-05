// Fictional service, fictional path.
import {
  generateRequiredInformation,
  INITIAL_REQUIRED_INFORMATION_COUNT,
  type RequiredInformation
} from './demo-required-information-data';

const FAKE_BASE_PATH = '/api/demo/required-information';
void FAKE_BASE_PATH;

let store: RequiredInformation[] = generateRequiredInformation(INITIAL_REQUIRED_INFORMATION_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listRequiredInformation(): Promise<RequiredInformation[]> {
  await delay();
  return store;
}

export async function getRequiredInformationById(id: string): Promise<RequiredInformation | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateRequiredInformation(
  id: string,
  patch: Partial<RequiredInformation>
): Promise<RequiredInformation> {
  await delay(400, 800);
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Required information ${id} not found`);
  return updated;
}
