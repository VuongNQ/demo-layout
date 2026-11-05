// Fabricated data only — same policy as src/data/demo-data.ts. Field
// shape mirrors the real repo's Fees submodule (docs/modules/products/fees.md:
// code/name/applicationType/feeType/value/unit/effectiveDate/status/history),
// kept under a fictional route and service path per the naming-policy
// decision (public personal repo — no real path/permission/module name).

export type FeeApplicationType = 'cash-loan' | 'credit-card';
export type FeeUnit = 'percent' | 'fixed';

export type FeeHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
};

export type FeeDefinition = {
  id: string;
  code: string;
  name: string;
  applicationType: FeeApplicationType;
  feeType: string;
  value: number;
  unit: FeeUnit;
  effectiveDate: string;
  status: 'active' | 'inactive';
  history: FeeHistoryEntry[];
};

const FEE_TYPES = ['Phí thẩm định', 'Phí trả nợ trước hạn', 'Phí phạt chậm trả', 'Phí thường niên', 'Phí phát hành lại thẻ'];
const EDITORS = ['admin1', 'admin2', 'ops.user'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateFeeDefinitions(count: number): FeeDefinition[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    const applicationType: FeeApplicationType = seed % 2 === 0 ? 'credit-card' : 'cash-loan';
    const unit: FeeUnit = seed % 3 === 0 ? 'fixed' : 'percent';
    return {
      id: `fee-${seed}`,
      code: `FEE-${String(seed).padStart(3, '0')}`,
      name: `${pick(FEE_TYPES, seed)} #${seed}`,
      applicationType,
      feeType: pick(FEE_TYPES, seed),
      value: unit === 'percent' ? 1 + (seed % 5) : 50_000 + seed * 10_000,
      unit,
      effectiveDate: '2026-01-01',
      status: seed % 5 === 0 ? 'inactive' : 'active',
      history: [
        { id: `${seed}-h1`, changedAt: '2026-01-01', changedBy: pick(EDITORS, seed), action: 'Tạo mới' },
        ...(seed % 3 === 0 ? [{ id: `${seed}-h2`, changedAt: '2026-03-01', changedBy: pick(EDITORS, seed + 1), action: 'Cập nhật giá trị' }] : [])
      ]
    };
  });
}

export const INITIAL_FEE_COUNT = 8;
