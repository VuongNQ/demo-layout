import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { menuTree, type MenuNode } from '@/menu/menu-tree';
import { useCurrentUser } from '@/hooks/use-current-user.hook';
import type { ItemType } from 'antd/es/menu/interface';

// Three nesting levels, as in the real sidebar. Visibility is filtered by
// permission per-node here (OR semantics, same as the real repo); route
// access is checked again at the route level. The real repo keeps menu
// visibility and route access as two separate registries that must both be
// verified — this sketch reproduces that split rather than merging them.
function hasAnyPermission(userPermissions: string[], required?: string): boolean {
  if (!required) return true;
  return userPermissions.includes(required);
}

function toMenuItems(nodes: MenuNode[], userPermissions: string[]): ItemType[] {
  return nodes
    .filter((node) => hasAnyPermission(userPermissions, node.permission))
    .map((node): ItemType => {
      if (node.children) {
        return {
          key: node.key,
          label: node.label,
          children: toMenuItems(node.children, userPermissions)
        };
      }
      return { key: node.path ?? node.key, label: node.label };
    });
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useCurrentUser();

  const items = toMenuItems(menuTree, permissions);

  return (
    <Menu
      mode="inline"
      style={{ height: '100%', borderInlineEnd: 0 }}
      selectedKeys={[location.pathname]}
      defaultOpenKeys={['products', 'offer-management', 'system']}
      items={items}
      onClick={({ key }) => {
        if (key.startsWith('/')) navigate(key);
      }}
    />
  );
}
