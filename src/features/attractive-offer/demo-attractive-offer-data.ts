// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Attractive Offer submodule (docs/modules/
// products/attractive-offer.md: cash-loan-scoped config — name, on/off,
// ordered assigned products — plus an update-history tab, no create
// route), kept under a fictional route/service path per the naming-policy
// decision. No :id — single config record, same shape as Popular Loans
// (the real repo's two modules share byte-identical catalog/mapper code,
// flagged NEEDS-TEAM-DECISION in the doc — this sketch mirrors that by
// reusing AssignedProductsEditor rather than writing a second copy).

import type { ProductCatalogItem } from '@/components/AssignedProductsEditor';

export type AttractiveOfferHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
};

export type AttractiveOfferConfig = {
  name: string;
  enabled: boolean;
  assignedProductIds: string[];
  history: AttractiveOfferHistoryEntry[];
};

export const CASH_LOAN_CATALOG: ProductCatalogItem[] = [
  { id: 'cl-1', name: 'Vay tiêu dùng tín chấp' },
  { id: 'cl-2', name: 'Vay mua xe trả góp' },
  { id: 'cl-3', name: 'Vay thế chấp nhà đất' },
  { id: 'cl-4', name: 'Vay kinh doanh nhỏ' },
  { id: 'cl-5', name: 'Vay tín chấp lương' },
  { id: 'cl-6', name: 'Vay cầm cố sổ tiết kiệm' }
];

export function generateAttractiveOfferConfig(): AttractiveOfferConfig {
  return {
    name: 'Ưu đãi nổi bật tháng này',
    enabled: true,
    assignedProductIds: ['cl-3', 'cl-5'],
    history: [{ id: 'ao-h1', changedAt: '2026-02-01', changedBy: 'admin1', action: 'Tạo cấu hình ban đầu' }]
  };
}
