import { Form, Input, Select, DatePicker, Row, Col, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { OFFER_TYPES, PRODUCTS, type Promotion } from './demo-promotions-data';

export type PromotionFormValues = Omit<Promotion, 'id'>;

type Props = {
  form: FormInstance<PromotionFormValues>;
  initialValues?: PromotionFormValues;
  onValuesChange?: () => void;
};

export function PromotionForm({ form, initialValues, onValuesChange }: Props) {
  const { t } = useTranslation('claude');
  return (
    <Form<PromotionFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label={t('pages.promotion.name')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label={t('pages.promotion.code')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="offerType" label={t('pages.promotion.offerType')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={OFFER_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label={t('pages.promotion.status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'draft', label: t('pages.promotion.draft') }, { value: 'active', label: t('pages.promotion.active') }, { value: 'expired', label: t('pages.promotion.expired') }]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="startDate"
            label={t('pages.promotion.startDate')}
            rules={[{ required: true, message: t('validation:required') }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="endDate"
            label={t('pages.promotion.endDate')}
            rules={[{ required: true, message: t('validation:required') }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="assignedProducts" label={t('pages.promotion.assignedProducts')} rules={[{ required: true, message: t('validation:required') }]}>
        <Select mode="multiple" options={PRODUCTS.map((v) => ({ value: v, label: v }))} />
      </Form.Item>
    </Form>
  );
}
