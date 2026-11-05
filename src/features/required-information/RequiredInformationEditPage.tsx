import { useState } from 'react';
import { Form, Skeleton, Typography, message, Button, Space, Table } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { RequiredInformationForm, type RequiredInformationFormValues } from './RequiredInformationForm';
import { useRequiredInformationDetailQuery, useUpdateRequiredInformationMutation } from './required-information.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';

export function RequiredInformationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useRequiredInformationDetailQuery(id);
  const updateMutation = useUpdateRequiredInformationMutation();
  const [form] = Form.useForm<RequiredInformationFormValues>();
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
        <Button type="link" disabled={isDirty} onClick={() => navigate('/required-information')}>
          ← Quay lại danh sách
        </Button>
      </Space>
      <Typography.Title level={4}>Thông tin bắt buộc: {item.name}</Typography.Title>
      <RequiredInformationForm form={form} initialValues={item} onValuesChange={() => setIsDirty(true)} />

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
