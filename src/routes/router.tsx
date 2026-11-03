import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { OfferTypeListPage } from '@/features/offer-type/OfferTypeListPage';
import { OfferTypeDrawerRoute } from '@/features/offer-type/OfferTypeDrawerRoute';
import { OfferTypeEditPage } from '@/features/offer-type/OfferTypeEditPage';
import { ProductSyncPage } from '@/features/product-sync/ProductSyncPage';
import { BackgroundLockListPage } from '@/features/background-lock/BackgroundLockListPage';
import { BackgroundLockDrawerRoute } from '@/features/background-lock/BackgroundLockDrawerRoute';
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

        // Short form, unpaginated list, Drawer only (substrate A) — the
        // easy end of the threshold question, opposite of offer-type.
        {
          path: 'background-locks',
          element: <BackgroundLockListPage />,
          children: [{ path: ':id', element: <BackgroundLockDrawerRoute /> }]
        },

        { path: 'decisions', element: <DecisionsPage /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);
