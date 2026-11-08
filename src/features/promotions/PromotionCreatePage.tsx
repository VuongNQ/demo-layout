import { claudePath } from '@/claude/routes/route-meta';
import { Form, Typography, message, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PromotionForm, type PromotionFormValues } from './PromotionForm';
import { emptyPromotion } from './demo-promotions-data';
import { useCreatePromotionMutation } from './promotions.queries.hook';

export function PromotionCreatePage() {
  const { t } = useTranslation('claude');
  const navigate = useNavigate();
  const createMutation = useCreatePromotionMutation();
  const [form] = Form.useForm<PromotionFormValues>();

  async function handleCreate() {
    const values = await form.validateFields();
    await createMutation.mutateAsync(values);
    message.success(t('pages.promotion.created'));
    navigate(claudePath('promotions'));
  }

  return (
    <>
      <Space align="center" style={{ marginBottom: 8 }}>
        <Button type="link" onClick={() => navigate(claudePath('promotions'))}>
          {t('pages.promotion.back')}
        </Button>
      </Space>
      <Typography.Title level={4}>{t('pages.promotion.createTitle')}</Typography.Title>
      <PromotionForm form={form} initialValues={emptyPromotion()} />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => navigate(claudePath('promotions'))}>{t('pages.promotion.cancel')}</Button>
        <Button type="primary" loading={createMutation.isPending} onClick={() => void handleCreate()}>
          {t('pages.promotion.create')}
        </Button>
      </Space>
    </>
  );
}
