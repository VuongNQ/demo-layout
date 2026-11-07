import { Navigate, useLocation, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { claudePath, claudeRouteMeta, type ClaudeRouteId } from './route-meta';

const path = (id: ClaudeRouteId) => claudeRouteMeta[id].relativePath;
const child = (id: ClaudeRouteId, parentId: ClaudeRouteId) => path(id).slice(path(parentId).length + 1);

function ClaudeIndexRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: claudePath('offerTypes'), search, hash }} replace />;
}

// React Router 7.1.1 resolves route.lazy before rendering the matched page.
// Paths and children remain synchronous, so direct drawer links match their
// list parent while page code is fetched in separate Vite chunks.
export const claudeRoutes: RouteObject[] = [{
  path: 'claude',
  element: <AppLayout />,
  children: [
    { index: true, element: <ClaudeIndexRedirect /> },
    {
      path: path('offerTypes'),
      lazy: async () => ({ Component: (await import('@/features/offer-type/OfferTypeListPage')).OfferTypeListPage }),
      children: [
        { path: child('offerTypeCreate', 'offerTypes'), lazy: async () => ({ Component: (await import('@/features/offer-type/OfferTypeDrawerRoute')).OfferTypeDrawerRoute }) },
        { path: child('offerTypeDetail', 'offerTypes'), lazy: async () => ({ Component: (await import('@/features/offer-type/OfferTypeDrawerRoute')).OfferTypeDrawerRoute }) }
      ]
    },
    // The full-page edit remains a sibling, so the list unmounts.
    { path: path('offerTypeEdit'), lazy: async () => ({ Component: (await import('@/features/offer-type/OfferTypeEditPage')).OfferTypeEditPage }) },
    { path: path('productSync'), lazy: async () => ({ Component: (await import('@/features/product-sync/ProductSyncPage')).ProductSyncPage }) },
    { path: path('productSettings'), lazy: async () => ({ Component: (await import('@/features/product-settings/ProductSettingsListPage')).ProductSettingsListPage }) },
    { path: path('productSettingsEdit'), lazy: async () => ({ Component: (await import('@/features/product-settings/ProductSettingsEditPage')).ProductSettingsEditPage }) },
    {
      path: path('productLabels'),
      lazy: async () => ({ Component: (await import('@/features/product-labels/ProductLabelsListPage')).ProductLabelsListPage }),
      children: [{ path: child('productLabelDetail', 'productLabels'), lazy: async () => ({ Component: (await import('@/features/product-labels/ProductLabelQuickViewRoute')).ProductLabelQuickViewRoute }) }]
    },
    {
      path: path('backgroundLocks'),
      lazy: async () => ({ Component: (await import('@/features/background-lock/BackgroundLockListPage')).BackgroundLockListPage }),
      children: [{ path: child('backgroundLockDetail', 'backgroundLocks'), lazy: async () => ({ Component: (await import('@/features/background-lock/BackgroundLockDrawerRoute')).BackgroundLockDrawerRoute }) }]
    },
    { path: path('fees'), lazy: async () => ({ Component: (await import('@/features/fees/FeesListPage')).FeesListPage }) },
    { path: path('feesEdit'), lazy: async () => ({ Component: (await import('@/features/fees/FeesEditPage')).FeesEditPage }) },
    { path: path('promotions'), lazy: async () => ({ Component: (await import('@/features/promotions/PromotionsListPage')).PromotionsListPage }) },
    { path: path('promotionCreate'), lazy: async () => ({ Component: (await import('@/features/promotions/PromotionCreatePage')).PromotionCreatePage }) },
    { path: path('promotionEdit'), lazy: async () => ({ Component: (await import('@/features/promotions/PromotionEditPage')).PromotionEditPage }) },
    {
      path: path('promotionTypes'),
      lazy: async () => ({ Component: (await import('@/features/promotion-types/PromotionTypesListPage')).PromotionTypesListPage }),
      children: [
        { path: child('promotionTypeCreate', 'promotionTypes'), lazy: async () => ({ Component: (await import('@/features/promotion-types/PromotionTypeDrawerRoute')).PromotionTypeDrawerRoute }) },
        { path: child('promotionTypeDetail', 'promotionTypes'), lazy: async () => ({ Component: (await import('@/features/promotion-types/PromotionTypeDrawerRoute')).PromotionTypeDrawerRoute }) }
      ]
    },
    { path: path('requiredInformation'), lazy: async () => ({ Component: (await import('@/features/required-information/RequiredInformationListPage')).RequiredInformationListPage }) },
    { path: path('requiredInformationEdit'), lazy: async () => ({ Component: (await import('@/features/required-information/RequiredInformationEditPage')).RequiredInformationEditPage }) },
    { path: path('displayInformationSets'), lazy: async () => ({ Component: (await import('@/features/display-information-sets/DisplayInformationSetsListPage')).DisplayInformationSetsListPage }) },
    { path: path('displayInformationSetEdit'), lazy: async () => ({ Component: (await import('@/features/display-information-sets/DisplayInformationSetEditPage')).DisplayInformationSetEditPage }) },
    { path: path('addOns'), lazy: async () => ({ Component: (await import('@/features/add-ons/AddOnsListPage')).AddOnsListPage }) },
    { path: path('addOnEdit'), lazy: async () => ({ Component: (await import('@/features/add-ons/AddOnEditPage')).AddOnEditPage }) },
    { path: path('popularLoans'), lazy: async () => ({ Component: (await import('@/features/popular-loans/PopularLoansPage')).PopularLoansPage }) },
    { path: path('attractiveOffer'), lazy: async () => ({ Component: (await import('@/features/attractive-offer/AttractiveOfferPage')).AttractiveOfferPage }) },
    { path: path('exclusiveTouch'), lazy: async () => ({ Component: (await import('@/features/exclusive-touch/ExclusiveTouchPage')).ExclusiveTouchPage }) },
    {
      path: path('unsavedChanges'),
      lazy: async () => ({ Component: (await import('@/experiments/unsaved-changes/UnsavedChangesExperimentPage')).UnsavedChangesExperimentPage }),
      children: [{ path: child('unsavedChangesEdit', 'unsavedChanges'), lazy: async () => ({ Component: (await import('@/experiments/unsaved-changes/RouteBoundDrawerRoute')).RouteBoundDrawerRoute }) }]
    },
    { path: path('reorderPagination'), lazy: async () => ({ Component: (await import('@/experiments/reorder-pagination/ReorderExperimentPage')).ReorderExperimentPage }) },
    { path: path('tabsVsAnchor'), lazy: async () => ({ Component: (await import('@/experiments/tabs-vs-anchor/TabsVsAnchorExperimentPage')).TabsVsAnchorExperimentPage }) },
    { path: path('decisions'), lazy: async () => ({ Component: (await import('@/pages/DecisionsPage')).DecisionsPage }) }
  ]
}];
