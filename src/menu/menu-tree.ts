// One source of truth for both the sidebar and the breadcrumb. The real
// HDS Admin repo builds breadcrumbs from this same kind of menu tree, not
// from the URL — see src/helpers/menus.helper.ts in that repo (not this one).
//
// Permissions here are fictional: `demo:*`, not any real HDS constant.
export type MenuNode = {
  key: string;
  label: string;
  path?: string;
  permission?: string;
  children?: MenuNode[];
};

export const menuTree: MenuNode[] = [
  {
    key: 'products',
    label: 'Sản phẩm',
    children: [
      {
        key: 'offer-management',
        label: 'Quản lý ưu đãi',
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
        path: '/product-sync',
        permission: 'demo:view'
      }
    ]
  },
  {
    key: 'system',
    label: 'Hệ thống',
    children: [
      {
        key: 'background-management',
        label: 'Quản lý ảnh nền',
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
        children: [
          { key: 'exp-unsaved', label: '1. Guard unsaved-changes', path: '/experiments/unsaved-changes' },
          { key: 'exp-reorder', label: '2. Kéo thả + phân trang', path: '/experiments/reorder-pagination' },
          { key: 'exp-tabs', label: '3. Tabs vs Anchor', path: '/experiments/tabs-vs-anchor' }
        ]
      },
      {
        key: 'decisions',
        label: 'Quyết định layout',
        path: '/decisions'
      }
    ]
  }
  // Deliberately NOT listed here: /offer-types/:id/edit and the Drawer
  // routes. They exist in the router but have no menu entry, reproducing
  // a real gap in HDS Admin (theme-lock has no menu entry either) so the
  // breadcrumb-from-menu behavior can be seen for a route that is only
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
