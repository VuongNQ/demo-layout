import { Form, Input, Select, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { PromotionType } from './demo-promotion-types-data';

export type PromotionTypeFormValues = Omit<PromotionType, 'id'>;

type Props = {
  form: FormInstance<PromotionTypeFormValues>;
  initialValues?: PromotionTypeFormValues;
};

export function PromotionTypeForm({ form, initialValues }: Props) {
  const { t } = useTranslation('claude');
  return (
    <Form<PromotionTypeFormValues> form={form} layout="vertical" initialValues={initialValues}>
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
