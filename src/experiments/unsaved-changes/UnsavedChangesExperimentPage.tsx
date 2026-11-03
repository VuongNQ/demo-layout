import { Card, Row, Col, Typography, Button } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { EventLogProvider, useEventLog } from './EventLogContext';
import { EventLog } from './EventLog';
import { LocalStateDrawerDemo } from './LocalStateDrawerDemo';

// NEEDS-TEAM-DECISION #3: does the unsaved-changes guard fire when an
// overlay is closed via Hủy / the X button / mask click / ESC? Answer by
// trying both Drawers below (type into the field first, then close by
// each method) and reading the log — not by reasoning about it.
function ExperimentBody() {
  const { entries, clear } = useEventLog();
  const navigate = useNavigate();

  return (
    <>
      <Typography.Paragraph>
        Gõ gì đó vào Drawer rồi đóng bằng Hủy, nút X, click ra ngoài (mask), hoặc ESC. Xem nhật ký bên dưới để biết
        guard có được hỏi không.
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col span={12}>
          <LocalStateDrawerDemo />
        </Col>
        <Col span={12}>
          <Card title="B — Drawer gắn child route (navigate)" size="small">
            <Typography.Paragraph type="secondary">
              Mô phỏng substrate A thật (như `OfferTypeDrawerRoute`) — mở/đóng Drawer là điều hướng route thật.
            </Typography.Paragraph>
            <Button onClick={() => navigate('edit')}>Mở Drawer</Button>
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
  return (
    <EventLogProvider>
      <Typography.Title level={4}>Thí nghiệm 1 — Guard unsaved-changes khi đóng overlay</Typography.Title>
      <ExperimentBody />
    </EventLogProvider>
  );
}
