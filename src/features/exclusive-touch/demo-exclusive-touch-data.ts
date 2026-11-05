// Fabricated data only — same policy as src/data/demo-data.ts. Field shape
// mirrors the real repo's Exclusive Touch submodule (docs/modules/
// products/exclusive-touch.md: bulk-assigns products to a home-screen
// "layout" product type — browse by type with counts, keyword/status
// filter, server sort/paginate — plus a mobile preview with audience +
// start date, and a static layout-sample grid; no create/edit/view flow
// for an individual entity), kept under a fictional route/service path
// per the naming-policy decision.

export type LayoutType = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  assignedProductIds: string[];
};

export type ExclusiveTouchPreview = {
  audienceSegment: string;
  startDate: string;
};

export const PRODUCT_CATALOG = [
  { id: 'p-1', name: 'Vay tiêu dùng tín chấp' },
  { id: 'p-2', name: 'Vay mua xe trả góp' },
  { id: 'p-3', name: 'Thẻ tín dụng doanh nghiệp' },
  { id: 'p-4', name: 'Vay thế chấp nhà đất' },
  { id: 'p-5', name: 'Thẻ tín dụng cá nhân' },
  { id: 'p-6', name: 'Vay kinh doanh nhỏ' }
];

export const AUDIENCE_SEGMENTS = ['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp', 'Tất cả khách hàng'];

function generateLayoutTypes(): LayoutType[] {
  return [
    { id: 'layout-1', name: 'Loại 1 — Nổi bật trang chủ', status: 'active', assignedProductIds: ['p-1', 'p-3'] },
    { id: 'layout-2', name: 'Loại 2 — Gợi ý theo hành vi', status: 'active', assignedProductIds: ['p-2'] },
    { id: 'layout-3', name: 'Loại 3 — Ưu đãi giới hạn', status: 'inactive', assignedProductIds: [] },
    { id: 'layout-4', name: 'Loại 4 — Khách hàng doanh nghiệp', status: 'active', assignedProductIds: ['p-3', 'p-5'] }
  ];
}

export function generateExclusiveTouchState(): { layoutTypes: LayoutType[]; preview: ExclusiveTouchPreview } {
  return {
    layoutTypes: generateLayoutTypes(),
    preview: { audienceSegment: AUDIENCE_SEGMENTS[0], startDate: '2026-01-01' }
  };
}
