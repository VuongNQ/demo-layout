import { useState } from 'react';
import { Drawer, Form, Input, Button, Space, Card, Typography } from 'antd';
import { useEventLog } from './EventLogContext';

type FormValues = { note: string };

// Open/close state is a plain useState — exactly like a Drawer that is NOT
// bound to a route. Closing it (Hủy / X / mask / ESC) never calls
// navigate(), so useUnsavedChangesGuard's useBlocker never sees it: this
// is the gap the layout note flagged as NEEDS-TEAM-DECISION #3, reproduced
// directly rather than asserted.
export function LocalStateDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { logEvent } = useEventLog();

  function closeWithoutGuard(source: string) {
    logEvent(`[State cục bộ] Đóng qua ${source} — KHÔNG có điều hướng nào xảy ra, guard không được hỏi.`);
    setOpen(false);
    setIsDirty(false);
    form.resetFields();
  }

  return (
    <Card title="A — Drawer dùng state cục bộ (setOpen)" size="small">
      <Typography.Paragraph type="secondary">
        Mô phỏng một Drawer KHÔNG gắn route — chỉ bật/tắt bằng `useState`.
      </Typography.Paragraph>
      <Button onClick={() => setOpen(true)}>Mở Drawer</Button>
      <Drawer
        title="Form demo (state cục bộ)"
        open={open}
        onClose={(e) => closeWithoutGuard(e.type === 'keydown' ? 'ESC' : 'nút X hoặc click mask')}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => closeWithoutGuard('nút Hủy')}>Hủy</Button>
            <Button type="primary" onClick={() => closeWithoutGuard('nút Lưu (demo, không thật sự lưu)')}>
              Lưu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onValuesChange={() => setIsDirty(true)}>
          <Form.Item name="note" label="Ghi chú (gõ gì đó rồi thử đóng)">
            <Input />
          </Form.Item>
        </Form>
        <Typography.Text type={isDirty ? 'warning' : 'secondary'}>
          {isDirty ? 'Đang có thay đổi chưa lưu (isDirty = true), nhưng không ai kiểm tra điều này khi đóng.' : 'Chưa sửa gì.'}
        </Typography.Text>
      </Drawer>
    </Card>
  );
}
