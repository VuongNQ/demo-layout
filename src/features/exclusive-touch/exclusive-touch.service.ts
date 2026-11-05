// Fictional service, fictional path.
import { generateExclusiveTouchState, type ExclusiveTouchPreview, type LayoutType } from './demo-exclusive-touch-data';

const FAKE_BASE_PATH = '/api/demo/exclusive-touch';
void FAKE_BASE_PATH;

let state = generateExclusiveTouchState();

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listLayoutTypes(): Promise<LayoutType[]> {
  await delay();
  return state.layoutTypes;
}

export async function getExclusiveTouchPreview(): Promise<ExclusiveTouchPreview> {
  await delay();
  return state.preview;
}

export async function assignProductsToLayoutType(layoutTypeId: string, productIds: string[]): Promise<LayoutType[]> {
  await delay(400, 800);
  state = {
    ...state,
    layoutTypes: state.layoutTypes.map((item) => (item.id === layoutTypeId ? { ...item, assignedProductIds: productIds } : item))
  };
  return state.layoutTypes;
}

export async function updateExclusiveTouchPreview(preview: ExclusiveTouchPreview): Promise<ExclusiveTouchPreview> {
  await delay(300, 500);
  state = { ...state, preview };
  return state.preview;
}
