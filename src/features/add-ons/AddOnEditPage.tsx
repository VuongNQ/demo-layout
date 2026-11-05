import { useState } from 'react';
import { Form, Skeleton, Typography, message, Button, Space, Table } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { AddOnForm, type AddOnFormValues } from './AddOnForm';
import { useAddOnProductDetailQuery, useUpdateAddOnProductMutation } from './add-ons.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';

export function AddOnEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useAddOnProductDetailQuery(id);
  const updateMutation = useUpdateAddOnProductMutation();
  const [form] = Form.useForm<AddOnFormValues>();
  const [isDirty, setIsDirty] = useState(false);

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    setIsDirty(false);
    message.success('Đã lưu.');
  }

  function handleDiscard() {
    form.resetFields();
    setIsDirty(false);
  }

  if (isLoading || !item) {
    return <Skeleton active />;
  }

  return (
    <>
      <ContextualSaveBar
        visible={isDirty}
        saving={updateMutation.isPending}
        label={`Có thay đổi chưa lưu — ${item.name}`}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <Space align="center" style={{ marginBottom: 8 }}>
        <Button type="link" disabled={isDirty} onClick={() => navigate('/add-ons')}>
          ← Quay lại danh sách
        </Button>
      </Space>
      <Typography.Title level={4}>Sản phẩm kèm theo: {item.name}</Typography.Title>
      <AddOnForm form={form} initialValues={item} onValuesChange={() => setIsDirty(true)} />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Lịch sử thay đổi
      </Typography.Title>
      <Table
        rowKey="id"
        dataSource={item.history}
        pagination={false}
        size="small"
        columns={[
          { title: 'Thời gian', dataIndex: 'changedAt' },
          { title: 'Người thực hiện', dataIndex: 'changedBy' },
          { title: 'Hành động', dataIndex: 'action' }
        ]}
      />
    </>
  );
}
