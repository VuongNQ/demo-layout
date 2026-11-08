import type { RouteObject } from 'react-router-dom';
import { ChatGPTLayout } from '../layout/ChatGPTLayout';
import { chatgptRouteMeta } from './route-meta';
import { ChatGPTRouteError } from './RouteError';

// Relative tree for the root-router owner. Page implementations load only on match.
export const chatgptRoutes: RouteObject[] = [{
  path: 'chatgpt',
  element: <ChatGPTLayout />,
  children: [
    { index: true, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../overview/ChatGPTOverviewPage')).ChatGPTOverviewPage }) },
    { path: chatgptRouteMeta.showcase.relativePath, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../showcase/ChatGPTShowcasePage')).ChatGPTShowcasePage }) },
    {
      path: chatgptRouteMeta.productLabels.relativePath,
      errorElement: <ChatGPTRouteError />,
      lazy: async () => ({ Component: (await import('../features/product-labels/ProductLabelsListPage')).ProductLabelsListPage }),
      children: [{ path: ':id', errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/product-labels/ProductLabelQuickViewRoute')).ProductLabelQuickViewRoute }) }]
    },
    {
      path: chatgptRouteMeta.promotionTypes.relativePath,
      errorElement: <ChatGPTRouteError />,
      lazy: async () => ({ Component: (await import('../features/promotion-types/PromotionTypesListPage')).PromotionTypesListPage }),
      children: [
        { path: 'create', errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/promotion-types/PromotionTypeDrawerRoute')).PromotionTypeDrawerRoute }) },
        { path: ':id', errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/promotion-types/PromotionTypeDrawerRoute')).PromotionTypeDrawerRoute }) }
      ]
    },
    { path: chatgptRouteMeta.promotions.relativePath, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/promotions/PromotionsListPage')).PromotionsListPage }) },
    { path: chatgptRouteMeta.promotionCreate.relativePath, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/promotions/PromotionCreatePage')).PromotionCreatePage }) },
    { path: chatgptRouteMeta.promotionEdit.relativePath, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../features/promotions/PromotionEditPage')).PromotionEditPage }) }
  ]
}];
