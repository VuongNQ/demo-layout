import { Card, Checkbox, Space, Typography } from 'antd';
import { ALL_DEMO_PERMISSIONS, setDemoPermissions, useCurrentUser } from '@/hooks/use-current-user.hook';

// A visible control panel, not a hidden dev tool — the point of this
// sketch is to let a presenter show the permission gate working live.
export function DevPanel() {
  const { permissions } = useCurrentUser();

  return (
    <Card size="small" title="Dev panel — quyền demo (fictional demo:* only)">
      <Space direction="vertical">
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Tắt hết quyền để xem menu/route ẩn đi — không phải ranh giới bảo mật, chỉ demo OR semantics.
        </Typography.Text>
        <Checkbox.Group
          value={permissions}
          onChange={(checked) => setDemoPermissions(checked as string[])}
          options={ALL_DEMO_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        />
      </Space>
    </Card>
  );
}
