// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Promotion submodule (docs/modules/products/
// promotion-management/promotion.md: name/code/offerType/startDate/endDate/
// status/assignedProducts), kept under a fictional route/service path per
// the naming-policy decision.

export type PromotionStatus = 'active' | 'draft' | 'expired';

export type Promotion = {
  id: string;
  name: string;
  code: string;
  offerType: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  assignedProducts: string[];
};

const NAMES = ['Ưu đãi lãi suất đầu năm', 'Khuyến mãi mùa hè', 'Giảm phí thường niên', 'Ưu đãi khách hàng mới', 'Hoàn tiền sinh nhật'];
const OFFER_TYPES = ['Giảm lãi suất', 'Hoàn tiền', 'Miễn phí thường niên', 'Tặng điểm thưởng'];
const PRODUCTS = ['Vay tiêu dùng tín chấp', 'Thẻ tín dụng doanh nghiệp', 'Vay mua xe trả góp', 'Vay thế chấp nhà đất'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(arr[(seed + i) % arr.length]);
  return [...new Set(out)];
}

export function generatePromotions(count: number): Promotion[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `promotion-${seed}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      code: `PROMO-${String(seed).padStart(3, '0')}`,
      offerType: pick(OFFER_TYPES, seed),
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: seed % 5 === 0 ? 'expired' : seed % 3 === 0 ? 'draft' : 'active',
      assignedProducts: pickMany(PRODUCTS, seed, 1 + (seed % 2))
    };
  });
}

export function emptyPromotion(): Omit<Promotion, 'id'> {
  return {
    name: '',
    code: '',
    offerType: OFFER_TYPES[0],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'draft',
    assignedProducts: []
  };
}

export const INITIAL_PROMOTION_COUNT = 6;
export { OFFER_TYPES, PRODUCTS };
