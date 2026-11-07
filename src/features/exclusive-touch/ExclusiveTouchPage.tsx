import { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Button, Space, Typography, Card, DatePicker, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import { AssignProductsDrawer } from './AssignProductsDrawer';
import { AUDIENCE_SEGMENTS, type LayoutType } from './demo-exclusive-touch-data';
import { useExclusiveTouchPreviewQuery, useLayoutTypesQuery, useUpdateExclusiveTouchPreviewMutation } from './exclusive-touch.queries.hook';
import { useTranslation } from 'react-i18next';

// Browse-by-type list (keyword/status filter, counts) + bulk-assign Drawer
// + a mobile preview panel (audience + start date) + a static sample grid —
// matches the real submodule's shape. No create/edit/view flow for an
// individual entity — the layout types themselves are fixed.
export function ExclusiveTouchPage() {
  const { t } = useTranslation('claude');
  const { data: layoutTypes = [], isLoading } = useLayoutTypesQuery();
  const { data: preview } = useExclusiveTouchPreviewQuery();
  const updatePreviewMutation = useUpdateExclusiveTouchPreviewMutation();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LayoutType['status']>('all');
  const [editingType, setEditingType] = useState<LayoutType | null>(null);
  const [previewDraft, setPreviewDraft] = useState(preview);

  const filtered = useMemo(() => {
    return layoutTypes.filter((item) => {
      const matchesKeyword = item.name.toLowerCase().includes(keyword.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [layoutTypes, keyword, statusFilter]);

  const draft = previewDraft ?? preview;

  async function handleSavePreview() {
    if (!draft) return;
    await updatePreviewMutation.mutateAsync(draft);
    message.success(t('pages.exclusiveTouch.saved'));
  }

  return (
    <>
      <Typography.Title level={4}>{t('pages.exclusiveTouch.title')}</Typography.Title>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Space style={{ marginBottom: 12 }}>
            <Input.Search placeholder={t('pages.exclusiveTouch.search')} value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: t('pages.exclusiveTouch.all') },
                { value: 'active', label: t('pages.exclusiveTouch.active') },
                { value: 'inactive', label: t('pages.exclusiveTouch.inactive') }
              ]}
            />
          </Space>
          <Table<LayoutType>
            rowKey="id"
            loading={isLoading}
            dataSource={filtered}
            pagination={false}
            columns={[
              { title: t('pages.exclusiveTouch.type'), dataIndex: 'name' },
              {
                title: t('pages.exclusiveTouch.status'),
                dataIndex: 'status',
                render: (status: LayoutType['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{t(`pages.exclusiveTouch.${status}`)}</Tag>
              },
              { title: t('pages.exclusiveTouch.count'), key: 'count', render: (_, record) => record.assignedProductIds.length },
              {
                title: '',
                key: 'actions',
                render: (_, record) => (
                  <Button type="link" onClick={() => setEditingType(record)}>
                    {t('pages.exclusiveTouch.assign')}
                  </Button>
                )
              }
            ]}
          />
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('pages.exclusiveTouch.mobilePreview')} size="small" style={{ marginBottom: 16 }}>
            {draft && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text type="secondary">{t('pages.exclusiveTouch.segments')}</Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  value={draft.audienceSegment}
                  onChange={(v) => setPreviewDraft({ ...draft, audienceSegment: v })}
                  options={AUDIENCE_SEGMENTS.map((v) => ({ value: v, label: v }))}
                />
                <Typography.Text type="secondary">{t('pages.exclusiveTouch.startDate')}</Typography.Text>
                <DatePicker
                  style={{ width: '100%' }}
                  value={dayjs(draft.startDate)}
                  onChange={(d) => setPreviewDraft({ ...draft, startDate: d?.format('YYYY-MM-DD') ?? draft.startDate })}
                />
                <Button type="primary" block loading={updatePreviewMutation.isPending} onClick={() => void handleSavePreview()}>
                  {t('pages.exclusiveTouch.savePreview')}
                </Button>
              </Space>
            )}
          </Card>

          <Card title={t('pages.exclusiveTouch.sampleGrid')} size="small">
            <Row gutter={[8, 8]}>
              {Array.from({ length: 4 }, (_, i) => (
                <Col span={12} key={i}>
                  <div style={{ background: '#f0f2f5', border: '1px dashed #d9d9d9', borderRadius: 8, aspectRatio: '1 / 1' }} />
                </Col>
              ))}
            </Row>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('pages.exclusiveTouch.staticNote')}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <AssignProductsDrawer layoutType={editingType} onClose={() => setEditingType(null)} />
    </>
  );
}
