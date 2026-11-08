export type ClaudeRouteId =
  | 'offerTypes' | 'offerTypeCreate' | 'offerTypeDetail' | 'offerTypeEdit'
  | 'productSync' | 'productSettings' | 'productSettingsEdit'
  | 'backgroundLocks' | 'backgroundLockDetail' | 'fees' | 'feesEdit'
  | 'promotions' | 'promotionCreate' | 'promotionEdit'
  | 'promotionTypes' | 'promotionTypeCreate' | 'promotionTypeDetail'
  | 'requiredInformation' | 'requiredInformationEdit'
  | 'displayInformationSets' | 'displayInformationSetEdit'
  | 'addOns' | 'addOnEdit' | 'popularLoans' | 'attractiveOffer'
  | 'exclusiveTouch' | 'unsavedChanges' | 'unsavedChangesEdit'
  | 'reorderPagination' | 'tabsVsAnchor' | 'decisions';

export type ClaudeRouteMeta = {
  id: ClaudeRouteId;
  relativePath: string;
  title: string;
  navigationGroup?: 'products' | 'system';
  breadcrumbLabel?: string;
  menuVisible: boolean;
};

// Matching paths and menu paths are derived from this Claude-owned registry.
// Drawer and full-page routes intentionally have no menu entry.
export const claudeRouteMeta: Record<ClaudeRouteId, ClaudeRouteMeta> = {
  offerTypes: { id: 'offerTypes', relativePath: 'offer-types', title: 'Loại ưu đãi', navigationGroup: 'products', breadcrumbLabel: 'Loại ưu đãi', menuVisible: true },
  offerTypeCreate: { id: 'offerTypeCreate', relativePath: 'offer-types/create', title: 'Tạo loại ưu đãi', menuVisible: false },
  offerTypeDetail: { id: 'offerTypeDetail', relativePath: 'offer-types/:id', title: 'Cài đặt loại ưu đãi', menuVisible: false },
  offerTypeEdit: { id: 'offerTypeEdit', relativePath: 'offer-types/:id/edit', title: 'Sửa loại ưu đãi toàn trang', menuVisible: false },
  productSync: { id: 'productSync', relativePath: 'product-sync', title: 'Đồng bộ sản phẩm', navigationGroup: 'products', menuVisible: true },
  productSettings: { id: 'productSettings', relativePath: 'product-settings', title: 'Cài đặt sản phẩm', navigationGroup: 'products', menuVisible: true },
  productSettingsEdit: { id: 'productSettingsEdit', relativePath: 'product-settings/:id', title: 'Sửa cài đặt sản phẩm', menuVisible: false },
  backgroundLocks: { id: 'backgroundLocks', relativePath: 'background-locks', title: 'Cài đặt ảnh nền', navigationGroup: 'system', menuVisible: true },
  backgroundLockDetail: { id: 'backgroundLockDetail', relativePath: 'background-locks/:id', title: 'Sửa cài đặt ảnh nền', menuVisible: false },
  fees: { id: 'fees', relativePath: 'fees', title: 'Biểu phí', navigationGroup: 'products', menuVisible: true },
  feesEdit: { id: 'feesEdit', relativePath: 'fees/:id', title: 'Sửa biểu phí', menuVisible: false },
  promotions: { id: 'promotions', relativePath: 'promotions', title: 'Khuyến mãi', navigationGroup: 'products', menuVisible: true },
  promotionCreate: { id: 'promotionCreate', relativePath: 'promotions/create', title: 'Tạo khuyến mãi', menuVisible: false },
  promotionEdit: { id: 'promotionEdit', relativePath: 'promotions/:id/edit', title: 'Sửa khuyến mãi', menuVisible: false },
  promotionTypes: { id: 'promotionTypes', relativePath: 'promotion-types', title: 'Loại khuyến mãi', navigationGroup: 'products', menuVisible: true },
  promotionTypeCreate: { id: 'promotionTypeCreate', relativePath: 'promotion-types/create', title: 'Thêm loại khuyến mãi', menuVisible: false },
  promotionTypeDetail: { id: 'promotionTypeDetail', relativePath: 'promotion-types/:id', title: 'Sửa loại khuyến mãi', menuVisible: false },
  requiredInformation: { id: 'requiredInformation', relativePath: 'required-information', title: 'Thông tin bắt buộc', navigationGroup: 'products', menuVisible: true },
  requiredInformationEdit: { id: 'requiredInformationEdit', relativePath: 'required-information/:id', title: 'Sửa thông tin bắt buộc', menuVisible: false },
  displayInformationSets: { id: 'displayInformationSets', relativePath: 'display-information-sets', title: 'Bộ hiển thị', navigationGroup: 'products', menuVisible: true },
  displayInformationSetEdit: { id: 'displayInformationSetEdit', relativePath: 'display-information-sets/:id', title: 'Sửa bộ hiển thị', menuVisible: false },
  addOns: { id: 'addOns', relativePath: 'add-ons', title: 'Sản phẩm kèm theo', navigationGroup: 'products', menuVisible: true },
  addOnEdit: { id: 'addOnEdit', relativePath: 'add-ons/:id', title: 'Sửa sản phẩm kèm theo', menuVisible: false },
  popularLoans: { id: 'popularLoans', relativePath: 'popular-loans', title: 'Vay phổ biến', navigationGroup: 'products', menuVisible: true },
  attractiveOffer: { id: 'attractiveOffer', relativePath: 'attractive-offer', title: 'Ưu đãi nổi bật', navigationGroup: 'products', menuVisible: true },
  exclusiveTouch: { id: 'exclusiveTouch', relativePath: 'exclusive-touch', title: 'Gán theo loại hiển thị', navigationGroup: 'products', menuVisible: true },
  unsavedChanges: { id: 'unsavedChanges', relativePath: 'experiments/unsaved-changes', title: 'Guard unsaved-changes', navigationGroup: 'system', menuVisible: true },
  unsavedChangesEdit: { id: 'unsavedChangesEdit', relativePath: 'experiments/unsaved-changes/edit', title: 'Drawer gắn route', menuVisible: false },
  reorderPagination: { id: 'reorderPagination', relativePath: 'experiments/reorder-pagination', title: 'Kéo thả + phân trang', navigationGroup: 'system', menuVisible: true },
  tabsVsAnchor: { id: 'tabsVsAnchor', relativePath: 'experiments/tabs-vs-anchor', title: 'Tabs vs Anchor', navigationGroup: 'system', menuVisible: true },
  decisions: { id: 'decisions', relativePath: 'decisions', title: 'Quyết định layout', navigationGroup: 'system', menuVisible: true }
};

export function claudePath(id: ClaudeRouteId, params: Record<string, string> = {}): string {
  const relativePath = claudeRouteMeta[id].relativePath.replace(/:([A-Za-z]+)/g, (_, key: string) => {
    if (!(key in params)) throw new Error(`Missing Claude route parameter: ${key}`);
    return encodeURIComponent(params[key]);
  });
  return `/claude/${relativePath}`;
}
