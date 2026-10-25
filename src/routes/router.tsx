import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { OfferTypeListPage } from '@/features/offer-type/OfferTypeListPage';
import { OfferTypeDrawerRoute } from '@/features/offer-type/OfferTypeDrawerRoute';
import { OfferTypeEditPage } from '@/features/offer-type/OfferTypeEditPage';
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
        { path: 'decisions', element: <DecisionsPage /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);
