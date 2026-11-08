import { Form, Input, InputNumber, Select, Switch, Typography, type FormInstance } from 'antd';
import type { OfferTypeFormValues } from '@/features/offer-type/OfferTypeForm';
import { useTranslation } from 'react-i18next';

type Props = {
  form: FormInstance<OfferTypeFormValues>;
  initialValues?: Partial<OfferTypeFormValues>;
};

// Same fields as OfferTypeForm, laid out as sections instead of Tabs, with
// `scrollToFirstError` enabled. Every field is genuinely in the DOM and
// visible at once (no tab hides it), so when validateFields() rejects,
// AntD's own scrollToFirstError can actually land on the failing field —
// unlike the Tabs version, where the field exists but the surrounding tab
// panel is not the active one.
export function OfferTypeFormSections({ form, initialValues }: Props) {
  const { t } = useTranslation('claude');
  return (
    <Form<OfferTypeFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Form.Item name="name" label={t('offer.name')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label={t('pages.experiments.status')} rules={[{ required: true, message: t('validation:required') }]}>
        <Select options={[{ value: 'active', label: t('offer.active') }, { value: 'draft', label: t('offer.draft') }, { value: 'inactive', label: t('offer.inactive') }]} />
      </Form.Item>

      <Typography.Title id="section-general" level={5}>
        {t('pages.experiments.general')}
      </Typography.Title>
      <Form.Item name={['general', 'description']} label={t('offer.description')}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name={['general', 'code']} label={t('offer.code')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name={['general', 'discountPercent']} label={t('pages.experiments.discount')}>
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Typography.Title id="section-eligibility" level={5} style={{ marginTop: 32 }}>
        {t('pages.experiments.eligibility')}
      </Typography.Title>
      <Form.Item name={['eligibility', 'customerSegments']} label={t('offer.segments')}>
        <Select
          mode="multiple"
          options={['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp', 'Khách hàng cá nhân'].map((v) => ({ value: v, label: v }))}
        />
      </Form.Item>
      <Form.Item name={['eligibility', 'requiresApproval']} label={t('pages.experiments.requiresApproval')} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name={['eligibility', 'maxRedemptions']} label={t('pages.experiments.maxRedemptions')}>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Typography.Title id="section-notification" level={5} style={{ marginTop: 32 }}>
        {t('pages.experiments.notifications')}
      </Typography.Title>
      <Form.Item name={['notification', 'notifyChannel']} label={t('offer.channel')}>
        <Select
          options={[
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'push', label: 'Push' },
            { value: 'none', label: 'Không' }
          ]}
        />
      </Form.Item>
      <Form.Item name={['notification', 'ownerEmail']} label={t('offer.ownerEmail')}>
        <Input />
      </Form.Item>
      <Form.Item
        name={['notification', 'reminderDaysBefore']}
        label={t('pages.experiments.reminderDays')}
        rules={[
          {
            validator: async (_, value) => {
              // Same deliberate validation trap as OfferTypeForm's Tabs
              // version, placed in the LAST section here too, so both
              // sides of the comparison fail on the same field.
              if (value > 30) throw new Error(t('offer.reminderError'));
            }
          }
        ]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );
}
