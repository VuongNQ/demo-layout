import { Breadcrumb, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { findBreadcrumbTrail } from '@/menu/menu-tree';
import { menuTranslationKeys } from '@/claude/navigation/menu-meta';

// Derived from the menu tree, not from the URL — matching the real repo's
// src/helpers/menus.helper.ts. A route with no menu entry therefore has no
// breadcrumb trail at all, which is intentional here: it reproduces the
// background-main-lock gap documented in HDS Admin's PROJECT_CONTEXT.md
// (module renamed from theme-lock on 2026-10-21; the no-menu-entry gap
// carried over under the new name), where a route reachable only by direct
// link has no breadcrumb because it has no menu node.
export function AppBreadcrumb() {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const trail = findBreadcrumbTrail(location.pathname);

  if (trail.length === 0) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('missingBreadcrumb')}
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Breadcrumb
      style={{ marginBottom: 16 }}
      items={[{ title: t('home') }, ...trail.map((node) => ({ title: t(menuTranslationKeys[node.key] ?? node.key, { defaultValue: node.label }) }))]}
    />
  );
}
