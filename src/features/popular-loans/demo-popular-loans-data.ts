// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Popular Loans submodule (docs/modules/products/
// popular-loans.md: view/edit a single cash-loan collection, select/
// reorder assignable products, save configuration, view history), kept
// under a fictional route/service path per the naming-policy decision.
// No :id — this is a single config record, not a list of records.

import type { ProductCatalogItem } from '@/components/AssignedProductsEditor';

export type PopularLoansHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
};

export type PopularLoansConfig = {
  assignedProductIds: string[];
  history: PopularLoansHistoryEntry[];
};

export const CASH_LOAN_CATALOG: ProductCatalogItem[] = [
  { id: 'cl-1', name: 'Vay tiêu dùng tín chấp' },
  { id: 'cl-2', name: 'Vay mua xe trả góp' },
  { id: 'cl-3', name: 'Vay thế chấp nhà đất' },
  { id: 'cl-4', name: 'Vay kinh doanh nhỏ' },
  { id: 'cl-5', name: 'Vay tín chấp lương' },
  { id: 'cl-6', name: 'Vay cầm cố sổ tiết kiệm' }
];

export function generatePopularLoansConfig(): PopularLoansConfig {
  return {
    assignedProductIds: ['cl-1', 'cl-2', 'cl-4'],
    history: [
      { id: 'pl-h1', changedAt: '2026-01-10', changedBy: 'admin1', action: 'Tạo cấu hình ban đầu' },
      { id: 'pl-h2', changedAt: '2026-03-02', changedBy: 'admin2', action: 'Thêm Vay kinh doanh nhỏ' }
    ]
  };
}
