// Fabricated data only. Shape mirrors a real admin list (plausible name
// lengths, currency formatting, status distribution) without containing
// anything real. This file is committed and deployed — see README for
// where actual data belongs instead (nowhere in this repo).

export type OfferStatus = 'active' | 'draft' | 'inactive';

export type OfferType = {
  id: string;
  name: string;
  status: OfferStatus;
  priority: number;
  // "Settings" fields, grouped, to simulate a long settings form (~30
  // fields across 3 groups) for the Drawer-vs-Page threshold experiment.
  general: {
    description: string;
    code: string;
    effectiveFrom: string;
    effectiveTo: string;
    maxUsagePerCustomer: number;
    maxUsageTotal: number;
    discountPercent: number;
    discountAmount: number;
    currency: string;
    minOrderAmount: number;
  };
  eligibility: {
    customerSegments: string[];
    productLines: string[];
    channels: string[];
    requiresApproval: boolean;
    combinable: boolean;
    firstTimeOnly: boolean;
    regionCodes: string[];
    minTenureMonths: number;
    maxRedemptions: number;
    blacklistedProductIds: string[];
  };
  notification: {
    notifyOnExpiry: boolean;
    notifyChannel: 'email' | 'sms' | 'push' | 'none';
    reminderDaysBefore: number;
    ownerEmail: string;
    escalationEmail: string;
    tags: string[];
    internalNote: string;
    lastReviewedBy: string;
    lastReviewedAt: string;
    autoDisableOnBudgetExceeded: boolean;
  };
};

const NAME_FRAGMENTS = [
  'Ưu đãi vay tiêu dùng',
  'Ưu đãi thẻ tín dụng',
  'Ưu đãi chào mừng',
  'Ưu đãi khách hàng thân thiết',
  'Ưu đãi theo mùa',
  'Ưu đãi giới thiệu',
  'Ưu đãi sinh nhật',
  'Ưu đãi hoàn tiền'
];

const SEGMENTS = ['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp', 'Khách hàng cá nhân'];
const PRODUCT_LINES = ['Vay tiêu dùng', 'Thẻ tín dụng', 'Vay mua xe', 'Vay thế chấp'];
const CHANNELS = ['App', 'Website', 'Chi nhánh', 'Call center'];
const REGIONS = ['HN', 'HCM', 'DN', 'CT'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) result.push(arr[(seed + i) % arr.length]);
  return [...new Set(result)];
}

function generateOfferType(index: number): OfferType {
  const seed = index + 1;
  const status: OfferStatus = seed % 5 === 0 ? 'inactive' : seed % 3 === 0 ? 'draft' : 'active';
  return {
    id: `offer-${seed}`,
    name: `${pick(NAME_FRAGMENTS, seed)} #${seed}`,
    status,
    priority: seed,
    general: {
      description: `Mô tả nội bộ cho chương trình ưu đãi số ${seed}, dùng cho mục đích demo giao diện.`,
      code: `OFFER-${String(seed).padStart(4, '0')}`,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      maxUsagePerCustomer: (seed % 5) + 1,
      maxUsageTotal: 1000 + seed * 37,
      discountPercent: (seed % 20) + 1,
      discountAmount: 50_000 + seed * 1000,
      currency: 'VND',
      minOrderAmount: 500_000 + seed * 2000
    },
    eligibility: {
      customerSegments: pickMany(SEGMENTS, seed, 2),
      productLines: pickMany(PRODUCT_LINES, seed, 2),
      channels: pickMany(CHANNELS, seed, 2),
      requiresApproval: seed % 4 === 0,
      combinable: seed % 3 !== 0,
      firstTimeOnly: seed % 7 === 0,
      regionCodes: pickMany(REGIONS, seed, 2),
      minTenureMonths: seed % 12,
      maxRedemptions: 5 + (seed % 10),
      blacklistedProductIds: seed % 6 === 0 ? [`product-${seed}`] : []
    },
    notification: {
      notifyOnExpiry: seed % 2 === 0,
      notifyChannel: pick(['email', 'sms', 'push', 'none'] as const, seed),
      reminderDaysBefore: 3 + (seed % 7),
      ownerEmail: `owner${seed}@example.test`,
      escalationEmail: `escalation${seed}@example.test`,
      tags: pickMany(['beta', 'seasonal', 'high-priority', 'legacy'], seed, 2),
      internalNote: 'Ghi chú nội bộ demo, không phải dữ liệu thật.',
      lastReviewedBy: 'demo-user',
      lastReviewedAt: '2026-10-01',
      autoDisableOnBudgetExceeded: seed % 3 === 0
    }
  };
}

export function generateDemoOfferTypes(count: number): OfferType[] {
  return Array.from({ length: count }, (_, i) => generateOfferType(i));
}

export const INITIAL_OFFER_TYPE_COUNT = 120;
