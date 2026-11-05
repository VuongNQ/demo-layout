// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Add-on products submodule (docs/modules/products/
// add-ons.md: name/code, 4 distribution variants, fee, associated partner,
// status with batch activate/deactivate, update-history tab), kept under a
// fictional route/service path per the naming-policy decision.

export type AddOnDistribution = 'standalone' | 'cash-loan' | 'credit-card' | 'offset-loan';

export type AddOnHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
};

export type AddOnProduct = {
  id: string;
  code: string;
  name: string;
  distribution: AddOnDistribution;
  feeValue: number;
  associatedPartner: string;
  status: 'active' | 'inactive';
  history: AddOnHistoryEntry[];
};

const NAMES = ['Bảo hiểm khoản vay', 'Dịch vụ tư vấn tài chính', 'Gói hỗ trợ pháp lý', 'Bảo hiểm thẻ tín dụng', 'Dịch vụ cảnh báo giao dịch'];
const PARTNERS = ['Đối tác A', 'Đối tác B', 'Đối tác C'];
const EDITORS = ['admin1', 'admin2', 'ops.user'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateAddOnProducts(count: number): AddOnProduct[] {
  const distributions: AddOnDistribution[] = ['standalone', 'cash-loan', 'credit-card', 'offset-loan'];
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `add-on-${seed}`,
      code: `ADDON-${String(seed).padStart(3, '0')}`,
      name: `${pick(NAMES, seed)} #${seed}`,
      distribution: pick(distributions, seed),
      feeValue: 20_000 + seed * 5_000,
      associatedPartner: pick(PARTNERS, seed),
      status: seed % 4 === 0 ? 'inactive' : 'active',
      history: [{ id: `${seed}-h1`, changedAt: '2026-01-01', changedBy: pick(EDITORS, seed), action: 'Tạo mới' }]
    };
  });
}

export const INITIAL_ADD_ON_COUNT = 8;
export { PARTNERS };
