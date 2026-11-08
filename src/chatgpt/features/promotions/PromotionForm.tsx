import { Form, Input, Select, DatePicker, Row, Col, Typography, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { OFFER_TYPES, PRODUCTS } from '@/features/promotions/demo-promotions-data';
import type { PromotionFormValues } from '@/features/promotions/promotion-form.utils';
import styles from './PromotionForm.module.scss';

export type { PromotionFormValues } from '@/features/promotions/promotion-form.utils';

type Props = {
  form: FormInstance<PromotionFormValues>;
  initialValues?: PromotionFormValues;
  onValuesChange?: () => void;
  disabled?: boolean;
};

export function PromotionForm({ form, initialValues, onValuesChange, disabled }: Props) {
  const { t } = useTranslation('chatgpt');
  return (
    <Form<PromotionFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      disabled={disabled}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <section id="promotion-details" aria-labelledby="promotion-details-title" className={styles.section}>
        <Typography.Title level={2} id="promotion-details-title" tabIndex={-1} className={styles.sectionTitle}>
          {t('pages.promotion.sectionDetails')}
        </Typography.Title>
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
          <Col xs={24} sm={12}>
            <Form.Item name="offerType" label={t('pages.promotion.offerType')} rules={[{ required: true, message: t('validation:required') }]}>
              <Select options={OFFER_TYPES.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
        </Row>
      </section>

      <section id="promotion-schedule" aria-labelledby="promotion-schedule-title" className={styles.section}>
        <Typography.Title level={2} id="promotion-schedule-title" tabIndex={-1} className={styles.sectionTitle}>
          {t('pages.promotion.sectionSchedule')}
        </Typography.Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
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
          <Col xs={24} sm={12}>
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
          <Col xs={24} sm={12}>
            <Form.Item name="status" label={t('pages.promotion.status')} rules={[{ required: true, message: t('validation:required') }]}>
              <Select options={[{ value: 'draft', label: t('pages.promotion.draft') }, { value: 'active', label: t('pages.promotion.active') }, { value: 'expired', label: t('pages.promotion.expired') }]} />
            </Form.Item>
          </Col>
        </Row>
      </section>

      <section id="promotion-products" aria-labelledby="promotion-products-title" className={styles.section}>
        <Typography.Title level={2} id="promotion-products-title" tabIndex={-1} className={styles.sectionTitle}>
          {t('pages.promotion.sectionProducts')}
        </Typography.Title>
        <Form.Item name="assignedProducts" label={t('pages.promotion.assignedProducts')} rules={[{ required: true, message: t('validation:required') }]}>
          <Select mode="multiple" options={PRODUCTS.map((v) => ({ value: v, label: v }))} />
        </Form.Item>
      </section>
    </Form>
  );
}
