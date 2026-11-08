export type ChatGPTRouteId =
  | 'overview' | 'showcase'
  | 'productLabels' | 'productLabelDetail'
  | 'promotionTypes' | 'promotionTypeCreate' | 'promotionTypeDetail'
  | 'promotions' | 'promotionCreate' | 'promotionEdit'
  | 'unsavedChanges' | 'unsavedChangesEdit' | 'reorderPagination' | 'tabsVsAnchor' | 'productSettings';

export type ChatGPTRouteMeta = {
  id: ChatGPTRouteId;
  relativePath: string;
  title: string;
  breadcrumb: string;
  group: 'operations' | 'designSystem' | 'products' | 'experiments';
  menuVisible: boolean;
  menuParent?: ChatGPTRouteId;
};

export const chatgptRouteMeta: Record<ChatGPTRouteId, ChatGPTRouteMeta> = {
  overview: { id: 'overview', relativePath: '', title: 'overviewTitle', breadcrumb: 'overview', group: 'operations', menuVisible: true },
  showcase: { id: 'showcase', relativePath: 'showcase', title: 'showcaseTitle', breadcrumb: 'showcase', group: 'designSystem', menuVisible: true },
  productLabels: { id: 'productLabels', relativePath: 'product-labels', title: 'scenario1.productLabels.title', breadcrumb: 'scenario1.productLabels.title', group: 'products', menuVisible: true },
  productLabelDetail: { id: 'productLabelDetail', relativePath: 'product-labels/:id', title: 'scenario1.productLabels.quickView', breadcrumb: 'scenario1.productLabels.quickView', group: 'products', menuVisible: false, menuParent: 'productLabels' },
  promotionTypes: { id: 'promotionTypes', relativePath: 'promotion-types', title: 'scenario1.promotionType.title', breadcrumb: 'scenario1.promotionType.title', group: 'products', menuVisible: true },
  promotionTypeCreate: { id: 'promotionTypeCreate', relativePath: 'promotion-types/create', title: 'scenario1.promotionType.add', breadcrumb: 'pages.promotionType.createBreadcrumb', group: 'products', menuVisible: false, menuParent: 'promotionTypes' },
  promotionTypeDetail: { id: 'promotionTypeDetail', relativePath: 'promotion-types/:id', title: 'scenario1.promotionType.configure', breadcrumb: 'pages.promotionType.editBreadcrumb', group: 'products', menuVisible: false, menuParent: 'promotionTypes' },
  promotions: { id: 'promotions', relativePath: 'promotions', title: 'scenario1.promotion.listTitle', breadcrumb: 'scenario1.promotion.listTitle', group: 'products', menuVisible: true },
  promotionCreate: { id: 'promotionCreate', relativePath: 'promotions/create', title: 'scenario1.promotion.createTitle', breadcrumb: 'pages.promotion.createBreadcrumb', group: 'products', menuVisible: false, menuParent: 'promotions' },
  promotionEdit: { id: 'promotionEdit', relativePath: 'promotions/:id/edit', title: 'scenario1.promotion.title', breadcrumb: 'pages.promotion.editBreadcrumb', group: 'products', menuVisible: false, menuParent: 'promotions' },
  unsavedChanges: { id: 'unsavedChanges', relativePath: 'experiments/unsaved-changes', title: 'pages.scenario2.title', breadcrumb: 'pages.scenario2.title', group: 'experiments', menuVisible: true },
  unsavedChangesEdit: { id: 'unsavedChangesEdit', relativePath: 'experiments/unsaved-changes/:id', title: 'pages.scenario2.drawerTitle', breadcrumb: 'pages.scenario2.drawerTitle', group: 'experiments', menuVisible: false, menuParent: 'unsavedChanges' },
  reorderPagination: { id: 'reorderPagination', relativePath: 'experiments/reorder-pagination', title: 'pages.scenario3.title', breadcrumb: 'pages.scenario3.title', group: 'experiments', menuVisible: true },
  tabsVsAnchor: { id: 'tabsVsAnchor', relativePath: 'experiments/tabs-vs-anchor', title: 'pages.scenario4.title', breadcrumb: 'pages.scenario4.title', group: 'experiments', menuVisible: true },
  productSettings: { id: 'productSettings', relativePath: 'product-settings/:id', title: 'pages.scenario5.title', breadcrumb: 'pages.scenario5.title', group: 'products', menuVisible: false }
};

export function chatgptPath(id: ChatGPTRouteId, params: Record<string, string> = {}): string {
  const relative = chatgptRouteMeta[id].relativePath.replace(/:([A-Za-z]+)/g, (_, key: string) => {
    if (!(key in params)) throw new Error(`Missing ChatGPT route parameter: ${key}`);
    return encodeURIComponent(params[key]);
  });
  return relative ? `/chatgpt/${relative}` : '/chatgpt';
}
