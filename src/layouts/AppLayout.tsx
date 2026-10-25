import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppBreadcrumb } from './AppBreadcrumb';
import { DevPanel } from './DevPanel';
import styles from './AppLayout.module.scss';

const { Sider, Header, Content } = Layout;

export function AppLayout() {
  return (
    <Layout className={styles.root}>
      <Sider className={styles.sider} width={260}>
        <Sidebar />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Text strong>Demo layout — bản phác thảo (không phải HDS Admin thật)</Typography.Text>
        </Header>
        <Content className={styles.content}>
          <DevPanel />
          <AppBreadcrumb />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
