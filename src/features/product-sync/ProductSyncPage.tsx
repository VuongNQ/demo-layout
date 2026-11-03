import { useState } from 'react';
import { Button, Card, Col, Modal, Row, Space, Statistic, Table, Tag, Steps, Typography } from 'antd';
import { useSyncHistoryQuery, useSyncKpisQuery, useSyncRowsQuery, useTriggerSyncMutation } from './product-sync.queries.hook';
import type { SyncRow, SyncRowStatus } from './demo-sync-data';

const STATUS_COLOR: Record<SyncRowStatus, string> = {
  matched: 'green',
  mismatched: 'red',
  pending: 'gold'
};

// This screen deliberately has NO Drawer-vs-Page question: every modal
// here is either read-only (diff, history) or a progress confirmation
// (sync status). None of them need a URL, because none of them are
// meaningful without this screen — the "supporting pane" half of the
// list-detail/supporting-pane distinction from the layout note, as
// opposed to offer-type's list-detail Drawer which IS meaningful alone.
export function ProductSyncPage() {
  const { data: rows = [], isLoading } = useSyncRowsQuery();
  const { data: kpis } = useSyncKpisQuery();
  const [diffRow, setDiffRow] = useState<SyncRow | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const { data: history = [] } = useSyncHistoryQuery(historyOpen);
  const triggerSyncMutation = useTriggerSyncMutation();

  function handleTriggerSync() {
    setStatusOpen(true);
    triggerSyncMutation.mutate();
  }

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Khớp dữ liệu" value={kpis?.matched ?? 0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Lệch dữ liệu" value={kpis?.mismatched ?? 0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Đang chờ" value={kpis?.pending ?? 0} />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleTriggerSync}>
          Đồng bộ ngay
        </Button>
        <Button onClick={() => setHistoryOpen(true)}>Lịch sử đồng bộ</Button>
      </Space>

      <Table<SyncRow>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Sản phẩm', dataIndex: 'productName' },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: SyncRowStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag>
          },
          { title: 'Đồng bộ lần cuối', dataIndex: 'lastSyncedAt' },
          {
            title: '',
            key: 'actions',
            render: (_, record) =>
              record.status === 'mismatched' ? (
                <Button type="link" onClick={() => setDiffRow(record)}>
                  Xem khác biệt
                </Button>
              ) : null
          }
        ]}
      />

      {/* Read-only diff — a supporting pane, not a list-detail: it has no
          meaning outside this row, so it is a Modal with no URL. */}
      <Modal
        title={`Khác biệt: ${diffRow?.productName ?? ''}`}
        open={diffRow !== null}
        onCancel={() => setDiffRow(null)}
        footer={<Button onClick={() => setDiffRow(null)}>Đóng</Button>}
      >
        <Table
          rowKey="field"
          dataSource={diffRow?.diff ?? []}
          pagination={false}
          columns={[
            { title: 'Trường', dataIndex: 'field' },
            { title: 'Nguồn', dataIndex: 'sourceValue' },
            { title: 'Đích', dataIndex: 'targetValue' }
          ]}
        />
      </Modal>

      <Modal
        title="Lịch sử đồng bộ"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={<Button onClick={() => setHistoryOpen(false)}>Đóng</Button>}
        width={640}
      >
        <Table
          rowKey="id"
          dataSource={history}
          pagination={false}
          columns={[
            { title: 'Bắt đầu', dataIndex: 'startedAt' },
            { title: 'Kết thúc', dataIndex: 'finishedAt' },
            {
              title: 'Kết quả',
              dataIndex: 'result',
              render: (result: 'success' | 'failed') => (
                <Tag color={result === 'success' ? 'green' : 'red'}>{result}</Tag>
              )
            },
            { title: 'Số thay đổi', dataIndex: 'changedCount' },
            { title: 'Người chạy', dataIndex: 'triggeredBy' }
          ]}
        />
      </Modal>

      {/* Confirm/progress modal — not a form, so it does not raise the
          Drawer-vs-Page question either. Closed automatically on success. */}
      <Modal
        title="Đang đồng bộ"
        open={statusOpen}
        closable={!triggerSyncMutation.isPending}
        maskClosable={false}
        onCancel={() => setStatusOpen(false)}
        footer={
          !triggerSyncMutation.isPending && <Button type="primary" onClick={() => setStatusOpen(false)}>Đóng</Button>
        }
      >
        <Steps
          direction="vertical"
          size="small"
          current={triggerSyncMutation.isPending ? 1 : 2}
          items={[
            { title: 'Bắt đầu' },
            { title: 'Đang đối soát dữ liệu', description: triggerSyncMutation.isPending ? 'Đang xử lý...' : undefined },
            {
              title: 'Hoàn tất',
              description: triggerSyncMutation.data
                ? `Đã đồng bộ ${triggerSyncMutation.data.changedCount} sản phẩm`
                : undefined
            }
          ]}
        />
        {!triggerSyncMutation.isPending && !triggerSyncMutation.data && (
          <Typography.Text type="secondary">Nhấn "Đồng bộ ngay" để bắt đầu.</Typography.Text>
        )}
      </Modal>
    </>
  );
}
