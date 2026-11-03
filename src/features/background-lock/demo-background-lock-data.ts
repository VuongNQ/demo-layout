// Fabricated data only — same policy as src/data/demo-data.ts. This module
// stands in for the real repo's background-main-lock feature (locking a
// background image to a customer segment for a date range, with
// drag-drop priority). Small dataset, deliberately NOT paginated — unlike
// offer-type's 120 rows, this is the "no pagination" reorder mode from
// experiment 2.

export type BackgroundLock = {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'inactive';
  priority: number;
  imagePreviewColor: string; // stands in for an uploaded image's dominant color
  customerSegments: string[];
  effectiveFrom: string;
  effectiveTo: string;
};

const NAMES = ['Ảnh nền Tết', 'Ảnh nền mùa hè', 'Ảnh nền khai trương', 'Ảnh nền mặc định', 'Ảnh nền Black Friday'];
const SEGMENTS = ['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp'];
const COLORS = ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1677ff', '#722ed1'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(arr[(seed + i) % arr.length]);
  return [...new Set(out)];
}

export function generateBackgroundLocks(count: number): BackgroundLock[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `bg-lock-${seed}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      status: seed % 4 === 0 ? 'inactive' : seed % 3 === 0 ? 'draft' : 'active',
      priority: seed,
      imagePreviewColor: pick(COLORS, seed),
      customerSegments: pickMany(SEGMENTS, seed, 1 + (seed % 2)),
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31'
    };
  });
}

export const INITIAL_BACKGROUND_LOCK_COUNT = 10;
