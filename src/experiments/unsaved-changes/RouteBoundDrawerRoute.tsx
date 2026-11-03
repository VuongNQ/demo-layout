import { useState } from 'react';
import { Drawer, Form, Input, Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEventLog } from './EventLogContext';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

type FormValues = { note: string };

// This Drawer's open/close state is the ROUTE: it is a child route of
// /experiments/unsaved-changes, so every close path (Hủy / X / mask / ESC)
// calls navigate(-1) — a real navigation, which useBlocker (inside
// useUnsavedChangesGuard) can intercept. The mechanism is identical to
// substrate A's OfferTypeDrawerRoute; this is a standalone copy so the
// experiment page can show it side by side with the local-state version
// without affecting offer-type.
export function RouteBoundDrawerRoute() {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { logEvent } = useEventLog();

  useUnsavedChangesGuard(isDirty, logEvent);

  function requestClose(source: string) {
    logEvent(`[Gắn route] Đóng qua ${source} — gọi navigate(-1), guard được hỏi.`);
    navigate(-1);
  }

  return (
    <Drawer
      title="Form demo (gắn child route)"
      open
      onClose={(e) => requestClose(e.type === 'keydown' ? 'ESC' : 'nút X hoặc click mask')}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => requestClose('nút Hủy')}>Hủy</Button>
          <Button
            type="primary"
            onClick={() => {
              logEvent('[Gắn route] Nhấn Lưu — demo coi như đã lưu, isDirty về false rồi điều hướng (không bị chặn).');
              setIsDirty(false);
              navigate(-1);
            }}
          >
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
        {isDirty ? 'Đang có thay đổi chưa lưu (isDirty = true) — đóng bằng bất kỳ cách nào sẽ bị guard chặn.' : 'Chưa sửa gì.'}
      </Typography.Text>
    </Drawer>
  );
}
