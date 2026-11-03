// Fabricated data only — same policy as src/data/demo-data.ts. This
// module is new: a deliberately complex, nested/conditional settings
// form ("Cài đặt sản phẩm"), one record per product line, picked from a
// short list and edited full-page with ContextualSaveBar.

export type CustomerType = 'individual' | 'business';

export type PricingTier = {
  id: string;
  minAmount: number;
  maxAmount: number;
  rate: number;
};

export type DocumentRequirement = {
  id: string;
  name: string;
  required: boolean;
};

export type ProductSettings = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'draft' | 'inactive';
  baseRate: number;
  tiers: PricingTier[];
  customerType: CustomerType;
  // Present only when customerType === 'individual'
  minAge?: number;
  maxAge?: number;
  // Present only when customerType === 'business'
  minRevenue?: number;
  businessTypes?: string[];
  documents: DocumentRequirement[];
  advancedEnabled: boolean;
  // Present only when advancedEnabled === true
  approvalWorkflow?: 'auto' | 'single-approver' | 'committee';
  riskScoreThreshold?: number;
};

const NAMES = ['Vay tiêu dùng tín chấp', 'Vay mua xe trả góp', 'Thẻ tín dụng doanh nghiệp', 'Vay thế chấp nhà đất', 'Vay kinh doanh nhỏ'];
const BUSINESS_TYPES = ['Hộ kinh doanh', 'Công ty TNHH', 'Công ty cổ phần', 'Doanh nghiệp tư nhân'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateProductSettingsList(count: number): ProductSettings[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    const customerType: CustomerType = seed % 2 === 0 ? 'business' : 'individual';
    const advancedEnabled = seed % 3 === 0;
    return {
      id: `product-setting-${seed}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      code: `PS-${String(seed).padStart(3, '0')}`,
      status: seed % 4 === 0 ? 'draft' : 'active',
      baseRate: 8 + (seed % 10),
      tiers: [
        { id: `${seed}-tier-1`, minAmount: 0, maxAmount: 50_000_000, rate: 8 + (seed % 5) },
        { id: `${seed}-tier-2`, minAmount: 50_000_000, maxAmount: 200_000_000, rate: 10 + (seed % 5) },
        { id: `${seed}-tier-3`, minAmount: 200_000_000, maxAmount: 1_000_000_000, rate: 12 + (seed % 5) }
      ],
      customerType,
      ...(customerType === 'individual'
        ? { minAge: 20, maxAge: 60 }
        : { minRevenue: 500_000_000, businessTypes: [BUSINESS_TYPES[seed % BUSINESS_TYPES.length]] }),
      documents: [
        { id: `${seed}-doc-1`, name: 'CMND/CCCD', required: true },
        { id: `${seed}-doc-2`, name: 'Sao kê lương 3 tháng', required: customerType === 'individual' },
        { id: `${seed}-doc-3`, name: 'Giấy phép kinh doanh', required: customerType === 'business' }
      ],
      advancedEnabled,
      ...(advancedEnabled
        ? { approvalWorkflow: pick(['auto', 'single-approver', 'committee'] as const, seed), riskScoreThreshold: 60 + (seed % 30) }
        : {})
    };
  });
}

export const INITIAL_PRODUCT_SETTINGS_COUNT = 5;
