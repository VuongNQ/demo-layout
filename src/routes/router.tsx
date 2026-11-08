import { createBrowserRouter } from 'react-router-dom';
import { claudeRoutes } from '@/claude/routes';
import { chatgptRoutes } from '@/chatgpt/routes';
import { compareRoute } from '@/compare';
import { PlatformSelectionPage } from './PlatformSelectionPage';
import { legacyRedirectRoutes } from './legacy-redirects';

// Root composition is the only shared routing integration point.
export const router = createBrowserRouter(
  [
    { path: '/', element: <PlatformSelectionPage /> },
    ...claudeRoutes,
    ...chatgptRoutes,
    compareRoute,
    ...legacyRedirectRoutes
  ],
  { basename: import.meta.env.BASE_URL }
);
