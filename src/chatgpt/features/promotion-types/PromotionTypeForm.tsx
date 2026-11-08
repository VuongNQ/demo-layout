import { Form, Input, Select, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { PromotionType } from '@/features/promotion-types/demo-promotion-types-data';

export type PromotionTypeFormValues = Omit<PromotionType, 'id'>;

type Props = {
  form: FormInstance<PromotionTypeFormValues>;
  disabled?: boolean;
  onValuesChange?: () => void;
};

export function PromotionTypeForm({ form, disabled, onValuesChange }: Props) {
  const { t } = useTranslation('chatgpt');
  return (
    <Form<PromotionTypeFormValues> form={form} layout="vertical" disabled={disabled} onValuesChange={onValuesChange}>
      <Form.Item name="name" label={t('pages.promotionType.name')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="code" label={t('pages.promotionType.code')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label={t('pages.promotionType.status')} rules={[{ required: true, message: t('validation:required') }]}>
        <Select options={[{ value: 'active', label: t('pages.promotionType.active') }, { value: 'inactive', label: t('pages.promotionType.inactive') }]} />
      </Form.Item>
    </Form>
  );
}
