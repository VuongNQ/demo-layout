import { Checkbox, Typography } from 'antd';
import { ALL_DEMO_PERMISSIONS, setDemoPermissions, useCurrentUser } from '@/hooks/use-current-user.hook';
import styles from './DevPanel.module.scss';

// A visible control panel, not a hidden dev tool — the point of this
// sketch is to let a presenter show the permission gate working live.
// Styled to sit inline in the sidebar's dark footer area (not a white
// Card on top of it, which read as a popup rather than part of the menu).
export function DevPanel() {
  const { permissions } = useCurrentUser();

  return (
    <div className={styles.root}>
      <Typography.Text className={styles.hint} style={{ fontSize: 12 }}>
        Quyền demo (fictional demo:* only) — tắt hết để xem menu/route ẩn đi, không phải ranh giới bảo mật.
      </Typography.Text>
      <Checkbox.Group
        className={styles.group}
        value={permissions}
        onChange={(checked) => setDemoPermissions(checked as string[])}
        options={ALL_DEMO_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))}
      />
    </div>
  );
}
