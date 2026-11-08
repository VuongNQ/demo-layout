import { claudePath } from '@/claude/routes/route-meta';
import { useState } from 'react';
import { Form, Skeleton, Typography, message, Button, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PromotionForm, type PromotionFormValues } from './PromotionForm';
import { usePromotionDetailQuery, useUpdatePromotionMutation } from './promotions.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import { useTranslation } from 'react-i18next';

export function PromotionEditPage() {
  const { t } = useTranslation('claude');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = usePromotionDetailQuery(id);
  const updateMutation = useUpdatePromotionMutation();
  const [form] = Form.useForm<PromotionFormValues>();
  const [isDirty, setIsDirty] = useState(false);

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    setIsDirty(false);
    message.success(t('pages.promotion.saved'));
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
        <Button type="link" disabled={isDirty} onClick={() => navigate(claudePath('promotions'))}>
          {t('pages.promotion.back')}
        </Button>
      </Space>
      <Typography.Title level={4}>{t('pages.promotion.title', { name: item.name })}</Typography.Title>
      <PromotionForm form={form} initialValues={item} onValuesChange={() => setIsDirty(true)} />
    </>
  );
}
