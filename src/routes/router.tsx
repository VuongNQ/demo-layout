import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { OfferTypeListPage } from '@/features/offer-type/OfferTypeListPage';
import { OfferTypeDrawerRoute } from '@/features/offer-type/OfferTypeDrawerRoute';
import { OfferTypeEditPage } from '@/features/offer-type/OfferTypeEditPage';
import { ProductSyncPage } from '@/features/product-sync/ProductSyncPage';
import { ProductSettingsListPage } from '@/features/product-settings/ProductSettingsListPage';
import { ProductSettingsEditPage } from '@/features/product-settings/ProductSettingsEditPage';
import { BackgroundLockListPage } from '@/features/background-lock/BackgroundLockListPage';
import { BackgroundLockDrawerRoute } from '@/features/background-lock/BackgroundLockDrawerRoute';
import { FeesListPage } from '@/features/fees/FeesListPage';
import { FeesEditPage } from '@/features/fees/FeesEditPage';
import { PromotionsListPage } from '@/features/promotions/PromotionsListPage';
import { PromotionCreatePage } from '@/features/promotions/PromotionCreatePage';
import { PromotionEditPage } from '@/features/promotions/PromotionEditPage';
import { PromotionTypesListPage } from '@/features/promotion-types/PromotionTypesListPage';
import { PromotionTypeDrawerRoute } from '@/features/promotion-types/PromotionTypeDrawerRoute';
import { RequiredInformationListPage } from '@/features/required-information/RequiredInformationListPage';
import { RequiredInformationEditPage } from '@/features/required-information/RequiredInformationEditPage';
import { DisplayInformationSetsListPage } from '@/features/display-information-sets/DisplayInformationSetsListPage';
import { DisplayInformationSetEditPage } from '@/features/display-information-sets/DisplayInformationSetEditPage';
import { AddOnsListPage } from '@/features/add-ons/AddOnsListPage';
import { AddOnEditPage } from '@/features/add-ons/AddOnEditPage';
import { UnsavedChangesExperimentPage } from '@/experiments/unsaved-changes/UnsavedChangesExperimentPage';
import { RouteBoundDrawerRoute } from '@/experiments/unsaved-changes/RouteBoundDrawerRoute';
import { ReorderExperimentPage } from '@/experiments/reorder-pagination/ReorderExperimentPage';
import { TabsVsAnchorExperimentPage } from '@/experiments/tabs-vs-anchor/TabsVsAnchorExperimentPage';
import { DecisionsPage } from '@/pages/DecisionsPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/offer-types" replace /> },
        {
          path: 'offer-types',
          element: <OfferTypeListPage />,
          children: [
            { path: 'create', element: <OfferTypeDrawerRoute /> },
            { path: ':id', element: <OfferTypeDrawerRoute /> }
          ]
        },
        // Full page (substrate B) is a sibling of the list, not a child —
        // navigating here unmounts the list, by design, so it can be
        // compared against substrate A's behavior.
        { path: 'offer-types/:id/edit', element: <OfferTypeEditPage /> },

        // No Drawer-vs-Page question on this screen: every overlay is
        // read-only or a confirm/progress modal (see ProductSyncPage).
        { path: 'product-sync', element: <ProductSyncPage /> },

        // Full page only — this is the complex-form / ContextualSaveBar
        // showcase (Form.List tiers + documents, conditional fields).
        { path: 'product-settings', element: <ProductSettingsListPage /> },
        { path: 'product-settings/:id', element: <ProductSettingsEditPage /> },

        // Short form, unpaginated list, Drawer only (substrate A) — the
        // easy end of the threshold question, opposite of offer-type.
        {
          path: 'background-locks',
          element: <BackgroundLockListPage />,
          children: [{ path: ':id', element: <BackgroundLockDrawerRoute /> }]
        },

        // Phase 1 of the Products sub-module recreation (fictional
        // identifiers, real field shape — see the plan doc linked from the
        // thread). Fees mirrors the complex-form/ContextualSaveBar pattern;
        // Promotion mirrors the full-page create+edit CRUD pattern;
        // Promotion type mirrors the Drawer create/edit + status-toggle,
        // no-delete pattern.
        { path: 'fees', element: <FeesListPage /> },
        { path: 'fees/:id', element: <FeesEditPage /> },

        { path: 'promotions', element: <PromotionsListPage /> },
        { path: 'promotions/create', element: <PromotionCreatePage /> },
        { path: 'promotions/:id/edit', element: <PromotionEditPage /> },

        {
          path: 'promotion-types',
          element: <PromotionTypesListPage />,
          children: [
            { path: 'create', element: <PromotionTypeDrawerRoute /> },
            { path: ':id', element: <PromotionTypeDrawerRoute /> }
          ]
        },

        { path: 'required-information', element: <RequiredInformationListPage /> },
        { path: 'required-information/:id', element: <RequiredInformationEditPage /> },

        { path: 'display-information-sets', element: <DisplayInformationSetsListPage /> },
        { path: 'display-information-sets/:id', element: <DisplayInformationSetEditPage /> },

        { path: 'add-ons', element: <AddOnsListPage /> },
        { path: 'add-ons/:id', element: <AddOnEditPage /> },

        {
          path: 'experiments/unsaved-changes',
          element: <UnsavedChangesExperimentPage />,
          children: [{ path: 'edit', element: <RouteBoundDrawerRoute /> }]
        },
        { path: 'experiments/reorder-pagination', element: <ReorderExperimentPage /> },
        { path: 'experiments/tabs-vs-anchor', element: <TabsVsAnchorExperimentPage /> },

        { path: 'decisions', element: <DecisionsPage /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);
