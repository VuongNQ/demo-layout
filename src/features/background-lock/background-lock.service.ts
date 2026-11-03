// Fictional service, fictional path.
import {
  generateBackgroundLocks,
  INITIAL_BACKGROUND_LOCK_COUNT,
  type BackgroundLock
} from './demo-background-lock-data';

const FAKE_BASE_PATH = '/api/demo/background-locks';
void FAKE_BASE_PATH;

let store: BackgroundLock[] = generateBackgroundLocks(INITIAL_BACKGROUND_LOCK_COUNT);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export async function listBackgroundLocks(): Promise<BackgroundLock[]> {
  await delay();
  return [...store].sort((a, b) => a.priority - b.priority);
}

export async function getBackgroundLockById(id: string): Promise<BackgroundLock | undefined> {
  await delay();
  return store.find((item) => item.id === id);
}

export async function updateBackgroundLock(id: string, patch: Partial<BackgroundLock>): Promise<BackgroundLock> {
  await delay();
  store = store.map((item) => (item.id === id ? { ...item, ...patch } : item));
  const updated = store.find((item) => item.id === id);
  if (!updated) throw new Error(`Background lock ${id} not found`);
  return updated;
}

export async function reorderBackgroundLocks(orderedIds: string[]): Promise<void> {
  await delay(150, 300);
  const priorityById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  store = store.map((item) => {
    const next = priorityById.get(item.id);
    return next ? { ...item, priority: next } : item;
  });
}
