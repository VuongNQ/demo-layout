import { useState } from 'react';
import { Drawer, Form, Input, Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { claudePath } from '@/claude/routes/route-meta';
import { useEventLog } from './EventLogContext';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';
import { useTranslation } from 'react-i18next';

type FormValues = { note: string };

// This Drawer's open/close state is the ROUTE: it is a child route of
// /claude/experiments/unsaved-changes, so every close path (Hủy / X / mask / ESC)
// navigates — a real navigation, which useBlocker (inside
// useUnsavedChangesGuard) can intercept. In-app opens use Back; direct
// deep links close to the parent. The mechanism is identical to
// substrate A's OfferTypeDrawerRoute; this is a standalone copy so the
// experiment page can show it side by side with the local-state version
// without affecting offer-type.
export function RouteBoundDrawerRoute() {
  const { t } = useTranslation('claude');
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { logEvent } = useEventLog();

  useUnsavedChangesGuard(isDirty, logEvent);

  function requestClose(source: string) {
    logEvent(t('pages.experiments.routeClose', { source }));
    closeDrawer();
  }

  function closeDrawer() {
    // A direct drawer deep link has no in-app parent entry to return to.
    // Keep Back navigation for the experiment when the parent opened it.
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate(claudePath('unsavedChanges'));
  }

  return (
    <Drawer
      title={t('pages.experiments.routeDrawerForm')}
      open
      onClose={(e) => requestClose(e.type === 'keydown' ? 'ESC' : 'nút X hoặc click mask')}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => requestClose('nút Hủy')}>{t('pages.experiments.cancel')}</Button>
          <Button
            type="primary"
            onClick={() => {
              logEvent(t('pages.experiments.savedLog'));
              setIsDirty(false);
              closeDrawer();
            }}
          >
            {t('pages.experiments.save')}
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
        {isDirty ? t('pages.experiments.guardedDirty') : t('pages.experiments.clean')}
      </Typography.Text>
    </Drawer>
  );
}
