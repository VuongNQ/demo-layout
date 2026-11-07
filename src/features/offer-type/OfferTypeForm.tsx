import { Form, Input, InputNumber, Select, Switch, Tabs, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { OfferType } from '@/data/demo-data';
import styles from './OfferTypeForm.module.scss';

export type OfferTypeFormValues = Omit<OfferType, 'id' | 'priority'>;

type OfferTypeFormProps = {
  form: FormInstance<OfferTypeFormValues>;
  initialValues?: Partial<OfferTypeFormValues>;
};

// Shared by both layout substrates (Drawer and full page). It knows
// nothing about which shell it sits in: no header, no footer, no submit
// button, no navigation. Form state ownership stays with the FormInstance
// passed in, matching the real repo's rule that Form/FormInstance owns
// form state end to end.
//
// Fields are grouped into Tabs for now, standing in for the ~30-field
// settings form. Experiment 3 (tabs hiding validation errors vs a
// section+Anchor layout) forks this into a second variant later — this is
// not that experiment yet.
export function OfferTypeForm({ form, initialValues }: OfferTypeFormProps) {
  const { t } = useTranslation('claude');
  const offer = (key: string) => t(`offer.${key}`);
  return (
    <Form<OfferTypeFormValues>
      className={styles.form}
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item name="name" label={offer('name')} rules={[{ required: true, message: t('validation:required') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label={offer('status')} rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'active', label: offer('active') },
            { value: 'draft', label: offer('draft') },
            { value: 'inactive', label: offer('inactive') }
          ]}
        />
      </Form.Item>

      <Tabs
        items={[
          {
            key: 'general',
            label: offer('general'),
            children: (
              <>
                <Form.Item name={['general', 'description']} label={offer('description')}>
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name={['general', 'code']} label={offer('code')} rules={[{ required: true, message: t('validation:required') }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['general', 'discountPercent']} label={offer('discountPercent')}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={['general', 'discountAmount']} label={offer('discountAmount')}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={['general', 'minOrderAmount']} label={offer('minOrder')}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )
          },
          {
            key: 'eligibility',
            label: offer('eligibility'),
            children: (
              <>
                <Form.Item name={['eligibility', 'customerSegments']} label={offer('segments')}>
                  <Select mode="multiple" options={[['Khách hàng mới', offer('newCustomers')], ['Khách hàng VIP', offer('vipCustomers')], ['Khách hàng doanh nghiệp', offer('businessCustomers')], ['Khách hàng cá nhân', offer('individualCustomers')]].map(([value, label]) => ({ value, label }))} />
                </Form.Item>
                <Form.Item name={['eligibility', 'requiresApproval']} label={offer('requiresApproval')} valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'combinable']} label={offer('combinable')} valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'firstTimeOnly']} label={offer('firstTimeOnly')} valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'maxRedemptions']} label={offer('maxRedemptions')}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )
          },
          {
            key: 'notification',
            label: offer('notifications'),
            children: (
              <>
                <Form.Item name={['notification', 'notifyOnExpiry']} label={offer('notifyExpiry')} valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['notification', 'notifyChannel']} label={offer('channel')}>
                  <Select
                    options={[
                      { value: 'email', label: 'Email' },
                      { value: 'sms', label: 'SMS' },
                      { value: 'push', label: 'Push' },
                      { value: 'none', label: offer('none') }
                    ]}
                  />
                </Form.Item>
                <Form.Item name={['notification', 'ownerEmail']} label={offer('ownerEmail')}>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={['notification', 'reminderDaysBefore']}
                  label={offer('reminderDays')}
                  rules={[
                    {
                      validator: async (_, value) => {
                        // Deliberately placed on the LAST tab, so experiment 3
                        // can demonstrate this exact error being invisible
                        // when the first two tabs are showing.
                        if (value > 30) {
                          throw new Error(offer('reminderError'));
                        }
                      }
                    }
                  ]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )
          }
        ]}
      />
    </Form>
  );
}
