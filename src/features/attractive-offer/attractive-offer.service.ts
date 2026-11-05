// Fictional service, fictional path.
import { generateAttractiveOfferConfig, type AttractiveOfferConfig } from './demo-attractive-offer-data';

const FAKE_BASE_PATH = '/api/demo/attractive-offer';
void FAKE_BASE_PATH;

let state: AttractiveOfferConfig = generateAttractiveOfferConfig();

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function getAttractiveOfferConfig(): Promise<AttractiveOfferConfig> {
  await delay();
  return state;
}

export async function updateAttractiveOfferConfig(
  patch: Pick<AttractiveOfferConfig, 'name' | 'enabled' | 'assignedProductIds'>
): Promise<AttractiveOfferConfig> {
  await delay(400, 800);
  state = {
    ...patch,
    history: [
      ...state.history,
      { id: `ao-h${state.history.length + 1}`, changedAt: new Date().toISOString().slice(0, 10), changedBy: 'bạn', action: 'Cập nhật cấu hình' }
    ]
  };
  return state;
}
