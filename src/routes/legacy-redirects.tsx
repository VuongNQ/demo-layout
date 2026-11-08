import { Navigate, useLocation, type RouteObject } from 'react-router-dom';
import { claudePath, claudeRouteMeta } from '@/claude/routes/route-meta';

export function RootRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: claudePath('offerTypes'), search, hash }} replace />;
}

function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  // useLocation().pathname is basename-relative. Retain the matched URL's
  // literal parameter segments, query string and fragment.
  return <Navigate to={{ pathname: `/claude${pathname}`, search, hash }} replace />;
}

// Explicit patterns cover every former route; no catch-all masks unknown URLs.
export const legacyRedirectRoutes: RouteObject[] = Object.values(claudeRouteMeta).map(({ relativePath }) => ({
  path: relativePath,
  element: <LegacyRedirect />
}));
