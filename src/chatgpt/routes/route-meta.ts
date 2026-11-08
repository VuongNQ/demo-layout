export type ChatGPTRouteId =
  | 'overview' | 'showcase'
  | 'productLabels' | 'productLabelDetail'
  | 'promotionTypes' | 'promotionTypeCreate' | 'promotionTypeDetail'
  | 'promotions' | 'promotionCreate' | 'promotionEdit';

export type ChatGPTRouteMeta = {
  id: ChatGPTRouteId;
  relativePath: string;
  title: string;
  breadcrumb: string;
  group: 'operations' | 'designSystem' | 'products';
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
  promotionEdit: { id: 'promotionEdit', relativePath: 'promotions/:id/edit', title: 'scenario1.promotion.title', breadcrumb: 'pages.promotion.editBreadcrumb', group: 'products', menuVisible: false, menuParent: 'promotions' }
};

export function chatgptPath(id: ChatGPTRouteId, params: Record<string, string> = {}): string {
  const relative = chatgptRouteMeta[id].relativePath.replace(/:([A-Za-z]+)/g, (_, key: string) => {
    if (!(key in params)) throw new Error(`Missing ChatGPT route parameter: ${key}`);
    return encodeURIComponent(params[key]);
  });
  return relative ? `/chatgpt/${relative}` : '/chatgpt';
}
