import { useState } from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppBreadcrumb } from './AppBreadcrumb';
import { PlatformLinks } from '@/routes/PlatformLinks';
import styles from './AppLayout.module.scss';

const { Sider, Header, Content } = Layout;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation('claude');

  return (
    <Layout className={styles.root}>
      <Sider className={styles.sider} width={260} collapsedWidth={64} collapsed={collapsed} trigger={null}>
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', paddingInline: 8, height: 'auto', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
            <Typography.Text strong>{t('shellTitle')}</Typography.Text>
          </Space>
          <PlatformLinks />
        </Header>
        <Content className={styles.content}>
          <AppBreadcrumb />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
