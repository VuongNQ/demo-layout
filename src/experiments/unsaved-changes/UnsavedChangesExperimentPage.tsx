import { Card, Row, Col, Typography, Button } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { EventLogProvider, useEventLog } from './EventLogContext';
import { EventLog } from './EventLog';
import { LocalStateDrawerDemo } from './LocalStateDrawerDemo';
import { useTranslation } from 'react-i18next';

// NEEDS-TEAM-DECISION #3: does the unsaved-changes guard fire when an
// overlay is closed via Hủy / the X button / mask click / ESC? Answer by
// trying both Drawers below (type into the field first, then close by
// each method) and reading the log — not by reasoning about it.
function ExperimentBody() {
  const { t } = useTranslation('claude');
  const { entries, clear } = useEventLog();
  const navigate = useNavigate();

  return (
    <>
      <Typography.Paragraph>
        {t('pages.experiments.instruction')}
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col span={12}>
          <LocalStateDrawerDemo />
        </Col>
        <Col span={12}>
          <Card title={t('pages.experiments.routeTitle')} size="small">
            <Typography.Paragraph type="secondary">
              {t('pages.experiments.routeDescription')}
            </Typography.Paragraph>
            <Button onClick={() => navigate('edit')}>{t('pages.experiments.openDrawer')}</Button>
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <EventLog entries={entries} onClear={clear} />
      </div>
      {/* Route-bound Drawer renders here when navigated to /edit */}
      <Outlet />
    </>
  );
}

export function UnsavedChangesExperimentPage() {
  const { t } = useTranslation('claude');
  return (
    <EventLogProvider>
      <Typography.Title level={4}>{t('pages.experiments.unsavedTitle')}</Typography.Title>
      <ExperimentBody />
    </EventLogProvider>
  );
}
