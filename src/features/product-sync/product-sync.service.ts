// Fictional service, fictional path — same policy as offer-type.service.ts.
import {
  generateSyncHistory,
  generateSyncRows,
  INITIAL_SYNC_ROW_COUNT,
  type SyncHistoryEntry,
  type SyncRow
} from './demo-sync-data';

const FAKE_BASE_PATH = '/api/demo/product-sync';
void FAKE_BASE_PATH;

let rows: SyncRow[] = generateSyncRows(INITIAL_SYNC_ROW_COUNT);
const history: SyncHistoryEntry[] = generateSyncHistory(8);

function delay(min = 300, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export type SyncKpis = {
  matched: number;
  mismatched: number;
  pending: number;
};

export async function listSyncRows(): Promise<SyncRow[]> {
  await delay();
  return rows;
}

export async function getSyncKpis(): Promise<SyncKpis> {
  await delay(150, 300);
  return {
    matched: rows.filter((r) => r.status === 'matched').length,
    mismatched: rows.filter((r) => r.status === 'mismatched').length,
    pending: rows.filter((r) => r.status === 'pending').length
  };
}

export async function getSyncHistory(): Promise<SyncHistoryEntry[]> {
  await delay(150, 300);
  return history;
}

// Simulates triggering a sync run: resolves every mismatched/pending row to
// "matched". Returns after an artificial delay so the UI can show a
// progress state in a modal while this is pending.
export async function triggerSync(): Promise<{ changedCount: number }> {
  await delay(1200, 1800);
  const changedCount = rows.filter((r) => r.status !== 'matched').length;
  rows = rows.map((r) => ({ ...r, status: 'matched', diff: [], lastSyncedAt: new Date().toISOString().slice(0, 10) }));
  return { changedCount };
}
