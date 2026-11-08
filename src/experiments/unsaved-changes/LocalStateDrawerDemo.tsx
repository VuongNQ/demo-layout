import { useState } from 'react';
import { Drawer, Form, Input, Button, Space, Card, Typography } from 'antd';
import { useEventLog } from './EventLogContext';
import { useTranslation } from 'react-i18next';

type FormValues = { note: string };

// Open/close state is a plain useState — exactly like a Drawer that is NOT
// bound to a route. Closing it (Hủy / X / mask / ESC) never calls
// navigate(), so useUnsavedChangesGuard's useBlocker never sees it: this
// is the gap the layout note flagged as NEEDS-TEAM-DECISION #3, reproduced
// directly rather than asserted.
export function LocalStateDrawerDemo() {
  const { t } = useTranslation('claude');
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { logEvent } = useEventLog();

  function closeWithoutGuard(source: string) {
    logEvent(t('pages.experiments.localClose', { source }));
    setOpen(false);
    setIsDirty(false);
    form.resetFields();
  }

  return (
    <Card title={t('pages.experiments.localTitle')} size="small">
      <Typography.Paragraph type="secondary">
        {t('pages.experiments.localDescription')}
      </Typography.Paragraph>
      <Button onClick={() => setOpen(true)}>{t('pages.experiments.openDrawer')}</Button>
      <Drawer
        title={t('pages.experiments.drawerForm')}
        open={open}
        onClose={(e) => closeWithoutGuard(e.type === 'keydown' ? 'ESC' : 'nút X hoặc click mask')}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => closeWithoutGuard('nút Hủy')}>{t('pages.experiments.cancel')}</Button>
            <Button type="primary" onClick={() => closeWithoutGuard('nút Lưu (demo, không thật sự lưu)')}>
              {t('pages.experiments.saveDemo')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onValuesChange={() => setIsDirty(true)}>
          <Form.Item name="note" label={t('pages.experiments.note')}>
            <Input />
          </Form.Item>
        </Form>
        <Typography.Text type={isDirty ? 'warning' : 'secondary'}>
          {isDirty ? t('pages.experiments.dirty') : t('pages.experiments.clean')}
        </Typography.Text>
      </Drawer>
    </Card>
  );
}
