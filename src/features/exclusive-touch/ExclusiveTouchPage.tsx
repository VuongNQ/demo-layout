import { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Button, Space, Typography, Card, DatePicker, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import { AssignProductsDrawer } from './AssignProductsDrawer';
import { AUDIENCE_SEGMENTS, type LayoutType } from './demo-exclusive-touch-data';
import { useExclusiveTouchPreviewQuery, useLayoutTypesQuery, useUpdateExclusiveTouchPreviewMutation } from './exclusive-touch.queries.hook';

// Browse-by-type list (keyword/status filter, counts) + bulk-assign Drawer
// + a mobile preview panel (audience + start date) + a static sample grid —
// matches the real submodule's shape. No create/edit/view flow for an
// individual entity — the layout types themselves are fixed.
export function ExclusiveTouchPage() {
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
    message.success('Đã lưu preview.');
  }

  return (
    <>
      <Typography.Title level={4}>Gán sản phẩm theo loại hiển thị</Typography.Title>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Space style={{ marginBottom: 12 }}>
            <Input.Search placeholder="Tìm theo tên loại" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </Space>
          <Table<LayoutType>
            rowKey="id"
            loading={isLoading}
            dataSource={filtered}
            pagination={false}
            columns={[
              { title: 'Loại hiển thị', dataIndex: 'name' },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                render: (status: LayoutType['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
              },
              { title: 'Số sản phẩm đã gán', key: 'count', render: (_, record) => record.assignedProductIds.length },
              {
                title: '',
                key: 'actions',
                render: (_, record) => (
                  <Button type="link" onClick={() => setEditingType(record)}>
                    Gán sản phẩm
                  </Button>
                )
              }
            ]}
          />
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Preview mobile" size="small" style={{ marginBottom: 16 }}>
            {draft && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text type="secondary">Phân khúc khách hàng</Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  value={draft.audienceSegment}
                  onChange={(v) => setPreviewDraft({ ...draft, audienceSegment: v })}
                  options={AUDIENCE_SEGMENTS.map((v) => ({ value: v, label: v }))}
                />
                <Typography.Text type="secondary">Ngày bắt đầu</Typography.Text>
                <DatePicker
                  style={{ width: '100%' }}
                  value={dayjs(draft.startDate)}
                  onChange={(d) => setPreviewDraft({ ...draft, startDate: d?.format('YYYY-MM-DD') ?? draft.startDate })}
                />
                <Button type="primary" block loading={updatePreviewMutation.isPending} onClick={() => void handleSavePreview()}>
                  Lưu preview
                </Button>
              </Space>
            )}
          </Card>

          <Card title="Mẫu lưới hiển thị" size="small">
            <Row gutter={[8, 8]}>
              {Array.from({ length: 4 }, (_, i) => (
                <Col span={12} key={i}>
                  <div style={{ background: '#f0f2f5', border: '1px dashed #d9d9d9', borderRadius: 8, aspectRatio: '1 / 1' }} />
                </Col>
              ))}
            </Row>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Mẫu tĩnh, không phải dữ liệu thật.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <AssignProductsDrawer layoutType={editingType} onClose={() => setEditingType(null)} />
    </>
  );
}
