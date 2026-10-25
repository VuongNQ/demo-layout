import { Breadcrumb, Alert } from 'antd';
import { useLocation } from 'react-router-dom';
import { findBreadcrumbTrail } from '@/menu/menu-tree';

// Derived from the menu tree, not from the URL — matching the real repo's
// src/helpers/menus.helper.ts. A route with no menu entry therefore has no
// breadcrumb trail at all, which is intentional here: it reproduces the
// theme-lock gap documented in HDS Admin's PROJECT_CONTEXT.md, where a
// route reachable only by direct link has no breadcrumb because it has no
// menu node.
export function AppBreadcrumb() {
  const location = useLocation();
  const trail = findBreadcrumbTrail(location.pathname);

  if (trail.length === 0) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Route này không có breadcrumb vì không có menu entry (giống ca theme-lock trong repo thật)."
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Breadcrumb
      style={{ marginBottom: 16 }}
      items={[{ title: 'Trang chủ' }, ...trail.map((node) => ({ title: node.label }))]}
    />
  );
}
