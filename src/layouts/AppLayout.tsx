import { useState } from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppBreadcrumb } from './AppBreadcrumb';
import styles from './AppLayout.module.scss';

const { Sider, Header, Content } = Layout;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className={styles.root}>
      <Sider className={styles.sider} width={260} collapsedWidth={64} collapsed={collapsed} trigger={null}>
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', paddingInline: 8 }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
            <Typography.Text strong>Demo layout — bản phác thảo (không phải HDS Admin thật)</Typography.Text>
          </Space>
        </Header>
        <Content className={styles.content}>
          <AppBreadcrumb />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
