import { Form, Input, InputNumber, Select, Switch, Typography, type FormInstance } from 'antd';
import type { OfferTypeFormValues } from '@/features/offer-type/OfferTypeForm';

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
  return (
    <Form<OfferTypeFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Form.Item name="name" label="Tên ưu đãi" rules={[{ required: true, message: 'Bắt buộc' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
        <Select options={[{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'inactive', label: 'Inactive' }]} />
      </Form.Item>

      <Typography.Title id="section-general" level={5}>
        Thông tin chung
      </Typography.Title>
      <Form.Item name={['general', 'description']} label="Mô tả">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name={['general', 'code']} label="Mã" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name={['general', 'discountPercent']} label="Giảm giá (%)">
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Typography.Title id="section-eligibility" level={5} style={{ marginTop: 32 }}>
        Điều kiện áp dụng
      </Typography.Title>
      <Form.Item name={['eligibility', 'customerSegments']} label="Phân khúc khách hàng">
        <Select
          mode="multiple"
          options={['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp', 'Khách hàng cá nhân'].map((v) => ({ value: v, label: v }))}
        />
      </Form.Item>
      <Form.Item name={['eligibility', 'requiresApproval']} label="Cần phê duyệt" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name={['eligibility', 'maxRedemptions']} label="Số lần sử dụng tối đa">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Typography.Title id="section-notification" level={5} style={{ marginTop: 32 }}>
        Thông báo
      </Typography.Title>
      <Form.Item name={['notification', 'notifyChannel']} label="Kênh thông báo">
        <Select
          options={[
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'push', label: 'Push' },
            { value: 'none', label: 'Không' }
          ]}
        />
      </Form.Item>
      <Form.Item name={['notification', 'ownerEmail']} label="Email chủ sở hữu">
        <Input />
      </Form.Item>
      <Form.Item
        name={['notification', 'reminderDaysBefore']}
        label="Số ngày nhắc trước"
        rules={[
          {
            validator: async (_, value) => {
              // Same deliberate validation trap as OfferTypeForm's Tabs
              // version, placed in the LAST section here too, so both
              // sides of the comparison fail on the same field.
              if (value > 30) throw new Error('Không được nhắc trước quá 30 ngày');
            }
          }
        ]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );
}
