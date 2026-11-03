// Fabricated data only — see src/data/demo-data.ts for the same policy.
// This module stands in for the real repo's scheme-sync feature (a
// product-configuration sync screen with KPI cards, a results table, and
// comparison/status/history shown in modals — never a form). Everything
// here is fictional: no real product names, no real sync fields.

export type SyncRowStatus = 'matched' | 'mismatched' | 'pending';

export type SyncDiffField = {
  field: string;
  sourceValue: string;
  targetValue: string;
};

export type SyncRow = {
  id: string;
  productName: string;
  status: SyncRowStatus;
  lastSyncedAt: string;
  diff: SyncDiffField[];
};

export type SyncHistoryEntry = {
  id: string;
  startedAt: string;
  finishedAt: string;
  result: 'success' | 'failed';
  changedCount: number;
  triggeredBy: string;
};

const PRODUCT_NAMES = [
  'Gói vay tiêu dùng A',
  'Gói vay tiêu dùng B',
  'Thẻ tín dụng Chuẩn',
  'Thẻ tín dụng Vàng',
  'Gói vay mua xe',
  'Gói vay thế chấp',
  'Combo thẻ + vay',
  'Sản phẩm trả góp'
];

const FIELD_NAMES = ['Lãi suất', 'Hạn mức tối đa', 'Thời hạn vay', 'Phí phạt trả sớm', 'Điều kiện thu nhập'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function generateRow(index: number): SyncRow {
  const seed = index + 1;
  const status: SyncRowStatus = seed % 4 === 0 ? 'mismatched' : seed % 7 === 0 ? 'pending' : 'matched';
  const diffFieldCount = status === 'mismatched' ? 1 + (seed % 3) : 0;
  return {
    id: `sync-${seed}`,
    productName: `${pick(PRODUCT_NAMES, seed)} #${seed}`,
    status,
    lastSyncedAt: '2026-10-2' + (seed % 9),
    diff: Array.from({ length: diffFieldCount }, (_, i) => ({
      field: FIELD_NAMES[(seed + i) % FIELD_NAMES.length],
      sourceValue: `${10 + ((seed + i) % 15)}%`,
      targetValue: `${10 + ((seed + i + 2) % 15)}%`
    }))
  };
}

export function generateSyncRows(count: number): SyncRow[] {
  return Array.from({ length: count }, (_, i) => generateRow(i));
}

export function generateSyncHistory(count: number): SyncHistoryEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `sync-run-${seed}`,
      startedAt: `2026-10-${String(20 - seed).padStart(2, '0')} 08:0${seed % 6}`,
      finishedAt: `2026-10-${String(20 - seed).padStart(2, '0')} 08:1${seed % 6}`,
      result: seed % 5 === 0 ? 'failed' : 'success',
      changedCount: seed * 3,
      triggeredBy: seed % 2 === 0 ? 'demo-user' : 'scheduler'
    };
  });
}

export const INITIAL_SYNC_ROW_COUNT = 40;
