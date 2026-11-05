// Fictional service, fictional path.
import { generatePopularLoansConfig, type PopularLoansConfig } from './demo-popular-loans-data';

const FAKE_BASE_PATH = '/api/demo/popular-loans';
void FAKE_BASE_PATH;

let state: PopularLoansConfig = generatePopularLoansConfig();

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function getPopularLoansConfig(): Promise<PopularLoansConfig> {
  await delay();
  return state;
}

export async function updatePopularLoansConfig(assignedProductIds: string[]): Promise<PopularLoansConfig> {
  await delay(400, 800);
  state = {
    assignedProductIds,
    history: [
      ...state.history,
      { id: `pl-h${state.history.length + 1}`, changedAt: new Date().toISOString().slice(0, 10), changedBy: 'bạn', action: 'Cập nhật danh sách sản phẩm' }
    ]
  };
  return state;
}
