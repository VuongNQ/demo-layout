// One source of truth for both the sidebar and the breadcrumb. The real
// HDS Admin repo builds breadcrumbs from this same kind of menu tree, not
// from the URL — see src/helpers/menus.helper.ts in that repo (not this one).
//
// Permissions here are fictional: `demo:*`, not any real HDS constant.
// `icon` is a string key, not a component — this file stays plain .ts
// (no JSX) and Sidebar.tsx maps the key to an actual AntD icon. Only
// nodes a collapsed sidebar actually needs to show something for
// (top-level and group nodes) carry one; a leaf without an icon still
// renders, just as a bare label / tooltip in collapsed mode.
export type MenuNode = {
  key: string;
  label: string;
  path?: string;
  permission?: string;
  icon?: string;
  children?: MenuNode[];
};

export const menuTree: MenuNode[] = [
  {
    key: 'products',
    label: 'Sản phẩm',
    icon: 'shopping',
    children: [
      {
        key: 'offer-management',
        label: 'Quản lý ưu đãi',
        icon: 'tags',
        children: [
          {
            key: 'offer-types',
            label: 'Loại ưu đãi',
            path: '/offer-types',
            permission: 'demo:view'
          }
        ]
      },
      {
        key: 'product-sync',
        label: 'Đồng bộ sản phẩm',
        icon: 'swap',
        path: '/product-sync',
        permission: 'demo:view'
      },
      {
        key: 'product-settings',
        label: 'Cài đặt sản phẩm',
        icon: 'tool',
        path: '/product-settings',
        permission: 'demo:view'
      },
      // Phase 1 of recreating the real Products domain's settings
      // sub-modules in this sketch (fictional identifiers, real field
      // shape) — see the plan doc linked from the thread. Grouped
      // separately from the single-record product-settings demo above so
      // it doesn't get mixed into the 8 already-settled layout decisions.
      {
        key: 'product-parameters',
        label: 'Tham số sản phẩm',
        icon: 'tags',
        children: [
          { key: 'fees', label: 'Biểu phí', path: '/fees', permission: 'demo:view' },
          { key: 'promotions', label: 'Khuyến mãi', path: '/promotions', permission: 'demo:view' },
          { key: 'promotion-types', label: 'Loại khuyến mãi', path: '/promotion-types', permission: 'demo:view' },
          { key: 'required-information', label: 'Thông tin bắt buộc', path: '/required-information', permission: 'demo:view' },
          {
            key: 'display-information-sets',
            label: 'Bộ hiển thị',
            path: '/display-information-sets',
            permission: 'demo:view'
          },
          { key: 'add-ons', label: 'Sản phẩm kèm theo', path: '/add-ons', permission: 'demo:view' }
        ]
      }
    ]
  },
  {
    key: 'system',
    label: 'Hệ thống',
    icon: 'setting',
    children: [
      {
        key: 'background-management',
        label: 'Quản lý ảnh nền',
        icon: 'picture',
        children: [
          {
            key: 'background-locks',
            label: 'Cài đặt ảnh nền',
            path: '/background-locks',
            permission: 'demo:view'
          }
        ]
      },
      {
        key: 'experiments',
        label: 'Thí nghiệm',
        icon: 'experiment',
        children: [
          { key: 'exp-unsaved', label: '1. Guard unsaved-changes', path: '/experiments/unsaved-changes' },
          { key: 'exp-reorder', label: '2. Kéo thả + phân trang', path: '/experiments/reorder-pagination' },
          { key: 'exp-tabs', label: '3. Tabs vs Anchor', path: '/experiments/tabs-vs-anchor' }
        ]
      },
      {
        key: 'decisions',
        label: 'Quyết định layout',
        icon: 'check-square',
        path: '/decisions'
      }
    ]
  }
  // Deliberately NOT listed here: /offer-types/:id/edit and the Drawer
  // routes. They exist in the router but have no menu entry, reproducing
  // a real gap in HDS Admin (background-main-lock, renamed from theme-lock
  // on 2026-10-21, still has no menu entry under its new name either) so
  // the breadcrumb-from-menu behavior can be seen for a route that is only
  // reachable by direct link or an in-feature action.
];

export function findMenuNodeByPath(path: string): MenuNode | undefined {
  const stack = [...menuTree];
  while (stack.length > 0) {
    const node = stack.shift()!;
    if (node.path === path) return node;
    if (node.children) stack.push(...node.children);
  }
  return undefined;
}

export function findBreadcrumbTrail(path: string): MenuNode[] {
  function search(nodes: MenuNode[], trail: MenuNode[]): MenuNode[] | undefined {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      if (node.path === path) return nextTrail;
      if (node.children) {
        const found = search(node.children, nextTrail);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(menuTree, []) ?? [];
}
