import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('claude');
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
            <Statistic title={t('pages.sync.matched')} value={kpis?.matched ?? 0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title={t('pages.sync.mismatched')} value={kpis?.mismatched ?? 0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title={t('pages.sync.pending')} value={kpis?.pending ?? 0} />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleTriggerSync}>
          {t('pages.sync.run')}
        </Button>
        <Button onClick={() => setHistoryOpen(true)}>{t('pages.sync.history')}</Button>
      </Space>

      <Table<SyncRow>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: t('pages.sync.product'), dataIndex: 'productName' },
          {
            title: t('pages.sync.status'),
            dataIndex: 'status',
            render: (status: SyncRowStatus) => <Tag color={STATUS_COLOR[status]}>{t(`pages.sync.${status}`)}</Tag>
          },
          { title: t('pages.sync.lastSync'), dataIndex: 'lastSyncedAt' },
          {
            title: '',
            key: 'actions',
            render: (_, record) =>
              record.status === 'mismatched' ? (
                <Button type="link" onClick={() => setDiffRow(record)}>
                  {t('pages.sync.viewDiff')}
                </Button>
              ) : null
          }
        ]}
      />

      {/* Read-only diff — a supporting pane, not a list-detail: it has no
          meaning outside this row, so it is a Modal with no URL. */}
      <Modal
        title={`${t('pages.sync.viewDiff')}: ${diffRow?.productName ?? ''}`}
        open={diffRow !== null}
        onCancel={() => setDiffRow(null)}
        footer={<Button onClick={() => setDiffRow(null)}>{t('pages.sync.close')}</Button>}
      >
        <Table
          rowKey="field"
          dataSource={diffRow?.diff ?? []}
          pagination={false}
          columns={[
            { title: t('pages.sync.field'), dataIndex: 'field' },
            { title: t('pages.sync.source'), dataIndex: 'sourceValue' },
            { title: t('pages.sync.target'), dataIndex: 'targetValue' }
          ]}
        />
      </Modal>

      <Modal
        title={t('pages.sync.history')}
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={<Button onClick={() => setHistoryOpen(false)}>{t('pages.sync.close')}</Button>}
        width={640}
      >
        <Table
          rowKey="id"
          dataSource={history}
          pagination={false}
          columns={[
            { title: t('pages.sync.started'), dataIndex: 'startedAt' },
            { title: t('pages.sync.finished'), dataIndex: 'finishedAt' },
            {
              title: t('pages.sync.result'),
              dataIndex: 'result',
              render: (result: 'success' | 'failed') => (
                <Tag color={result === 'success' ? 'green' : 'red'}>{t(`pages.sync.${result}`)}</Tag>
              )
            },
            { title: t('pages.sync.changes'), dataIndex: 'changedCount' },
            { title: t('pages.sync.operator'), dataIndex: 'triggeredBy' }
          ]}
        />
      </Modal>

      {/* Confirm/progress modal — not a form, so it does not raise the
          Drawer-vs-Page question either. Closed automatically on success. */}
      <Modal
        title={t('pages.sync.syncing')}
        open={statusOpen}
        closable={!triggerSyncMutation.isPending}
        maskClosable={false}
        onCancel={() => setStatusOpen(false)}
        footer={
          !triggerSyncMutation.isPending && <Button type="primary" onClick={() => setStatusOpen(false)}>{t('pages.sync.close')}</Button>
        }
      >
        <Steps
          direction="vertical"
          size="small"
          current={triggerSyncMutation.isPending ? 1 : 2}
          items={[
            { title: t('pages.sync.started') },
            { title: t('pages.sync.reconciling'), description: triggerSyncMutation.isPending ? t('pages.sync.processing') : undefined },
            {
              title: t('pages.sync.complete'),
              description: triggerSyncMutation.data
                ? t('pages.sync.syncedCount', { count: triggerSyncMutation.data.changedCount })
                : undefined
            }
          ]}
        />
        {!triggerSyncMutation.isPending && !triggerSyncMutation.data && (
          <Typography.Text type="secondary">{t('pages.sync.prompt')}</Typography.Text>
        )}
      </Modal>
    </>
  );
}
