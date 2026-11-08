import { claudePath } from '@/claude/routes/route-meta';
import { useState } from 'react';
import { Form, Skeleton, Typography, message, Button, Space, Table } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { FeesForm, type FeesFormValues } from './FeesForm';
import { useFeeDetailQuery, useUpdateFeeMutation } from './fees.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import { useTranslation } from 'react-i18next';

export function FeesEditPage() {
  const { t } = useTranslation('claude');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useFeeDetailQuery(id);
  const updateMutation = useUpdateFeeMutation();
  const [form] = Form.useForm<FeesFormValues>();
  const [isDirty, setIsDirty] = useState(false);

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    setIsDirty(false);
    message.success(t('productSettings.saveSuccess'));
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
        label={t('productSettings.dirty', { name: item.name })}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <Space align="center" style={{ marginBottom: 8 }}>
        <Button type="link" disabled={isDirty} onClick={() => navigate(claudePath('fees'))}>
          {t('pages.forms.back')}
        </Button>
      </Space>
      <Typography.Title level={4}>{t('pages.forms.feeTitle', { name: item.name })}</Typography.Title>
      <FeesForm form={form} initialValues={item} onValuesChange={() => setIsDirty(true)} />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        {t('pages.requiredInfo.history')}
      </Typography.Title>
      <Table
        rowKey="id"
        dataSource={item.history}
        pagination={false}
        size="small"
        columns={[
          { title: t('pages.requiredInfo.time'), dataIndex: 'changedAt' },
          { title: t('pages.requiredInfo.actor'), dataIndex: 'changedBy' },
          { title: t('pages.requiredInfo.action'), dataIndex: 'action' }
        ]}
      />
    </>
  );
}
