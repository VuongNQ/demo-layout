import { Menu, Typography } from 'antd';
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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { menuTree, type MenuNode } from '@/menu/menu-tree';
import { menuTranslationKeys } from '@/claude/navigation/menu-meta';
import { useCurrentUser } from '@/hooks/use-current-user.hook';
import type { ItemType } from 'antd/es/menu/interface';
import { DevPanel } from './DevPanel';
import styles from './Sidebar.module.scss';

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

function toMenuItems(nodes: MenuNode[], userPermissions: string[], translate: TFunction<'navigation'>): ItemType[] {
  return nodes
    .filter((node) => hasAnyPermission(userPermissions, node.permission))
    .map((node): ItemType => {
      const icon = node.icon ? ICONS[node.icon] : undefined;
      if (node.children) {
        return {
          key: node.key,
          label: translate(menuTranslationKeys[node.key] ?? node.key, { defaultValue: node.label }),
          icon,
          children: toMenuItems(node.children, userPermissions, translate)
        };
      }
      return { key: node.path ?? node.key, label: translate(menuTranslationKeys[node.key] ?? node.key, { defaultValue: node.label }), icon };
    });
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useCurrentUser();
  const { t } = useTranslation('navigation');

  const items = toMenuItems(menuTree, permissions, t);

  return (
    <div className={styles.root}>
      <Menu
        mode="inline"
        className={styles.menu}
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['products', 'offer-management', 'system']}
        items={items}
        onClick={({ key }) => {
          if (key.startsWith('/')) navigate(key);
        }}
      />
      <div className={styles.footer}>
        <Typography.Text type="secondary" className={styles.footerLabel}>
          {collapsed ? 'v0.1' : t('demoFooter')}
        </Typography.Text>
        {/* DevPanel sits below the sidebar's own footer line, as requested —
            still presenter-visible, just out of the content area. Hidden
            when collapsed: the checkbox group needs more than 64px to read. */}
        {!collapsed && <DevPanel />}
      </div>
    </div>
  );
}
