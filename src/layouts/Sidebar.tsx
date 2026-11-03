import { Menu } from 'antd';
import {
  CheckSquareOutlined,
  ExperimentOutlined,
  PictureOutlined,
  SettingOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TagsOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { menuTree, type MenuNode } from '@/menu/menu-tree';
import { useCurrentUser } from '@/hooks/use-current-user.hook';
import type { ItemType } from 'antd/es/menu/interface';

// menu-tree.ts stores icon as a string key (stays plain .ts, no JSX) —
// this is the only place that maps it to a real AntD icon component.
const ICONS: Record<string, React.ReactNode> = {
  shopping: <ShoppingOutlined />,
  tags: <TagsOutlined />,
  swap: <SwapOutlined />,
  tool: <ToolOutlined />,
  setting: <SettingOutlined />,
  picture: <PictureOutlined />,
  experiment: <ExperimentOutlined />,
  'check-square': <CheckSquareOutlined />
};

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
      const icon = node.icon ? ICONS[node.icon] : undefined;
      if (node.children) {
        return {
          key: node.key,
          label: node.label,
          icon,
          children: toMenuItems(node.children, userPermissions)
        };
      }
      return { key: node.path ?? node.key, label: node.label, icon };
    });
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useCurrentUser();

  const items = toMenuItems(menuTree, permissions);

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
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
