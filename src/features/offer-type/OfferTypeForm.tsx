import { Form, Input, InputNumber, Select, Switch, Tabs, type FormInstance } from 'antd';
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
  return (
    <Form<OfferTypeFormValues>
      className={styles.form}
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item name="name" label="Tên ưu đãi" rules={[{ required: true, message: 'Bắt buộc' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'inactive', label: 'Inactive' }
          ]}
        />
      </Form.Item>

      <Tabs
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <>
                <Form.Item name={['general', 'description']} label="Mô tả">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name={['general', 'code']} label="Mã" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['general', 'discountPercent']} label="Giảm giá (%)">
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={['general', 'discountAmount']} label="Giảm giá (số tiền)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={['general', 'minOrderAmount']} label="Giá trị đơn hàng tối thiểu">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )
          },
          {
            key: 'eligibility',
            label: 'Điều kiện áp dụng',
            children: (
              <>
                <Form.Item name={['eligibility', 'customerSegments']} label="Phân khúc khách hàng">
                  <Select mode="multiple" options={['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp', 'Khách hàng cá nhân'].map((v) => ({ value: v, label: v }))} />
                </Form.Item>
                <Form.Item name={['eligibility', 'requiresApproval']} label="Cần phê duyệt" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'combinable']} label="Có thể kết hợp" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'firstTimeOnly']} label="Chỉ lần đầu" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name={['eligibility', 'maxRedemptions']} label="Số lần sử dụng tối đa">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )
          },
          {
            key: 'notification',
            label: 'Thông báo',
            children: (
              <>
                <Form.Item name={['notification', 'notifyOnExpiry']} label="Thông báo khi hết hạn" valuePropName="checked">
                  <Switch />
                </Form.Item>
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
                        // Deliberately placed on the LAST tab, so experiment 3
                        // can demonstrate this exact error being invisible
                        // when the first two tabs are showing.
                        if (value > 30) {
                          throw new Error('Không được nhắc trước quá 30 ngày');
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
