// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Promotion type submodule (docs/modules/products/
// promotion-management/promotion-type.md: name/code/status, no delete),
// kept under a fictional route/service path per the naming-policy decision.

export type PromotionType = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
};

const NAMES = ['Giảm lãi suất', 'Hoàn tiền', 'Miễn phí thường niên', 'Tặng điểm thưởng', 'Quà tặng khai trương'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generatePromotionTypes(count: number): PromotionType[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `promotion-type-${seed}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      code: `PTYPE-${String(seed).padStart(3, '0')}`,
      status: seed % 4 === 0 ? 'inactive' : 'active'
    };
  });
}

export const INITIAL_PROMOTION_TYPE_COUNT = 6;
