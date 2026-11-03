import { Form, Input, Select, DatePicker, Avatar, Space, Button, type FormInstance } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { BackgroundLock } from './demo-background-lock-data';

export type BackgroundLockFormValues = Omit<BackgroundLock, 'id' | 'priority'>;

type BackgroundLockFormProps = {
  form: FormInstance<BackgroundLockFormValues>;
  initialValues?: BackgroundLockFormValues;
};

// Short form (6 fields) — deliberately on the opposite end of the
// field-count spectrum from offer-type's ~30-field form, so the Drawer
// substrate can be judged against a screen it clearly fits, not only
// against the long-form case.
export function BackgroundLockForm({ form, initialValues }: BackgroundLockFormProps) {
  return (
    <Form<BackgroundLockFormValues> form={form} layout="vertical" initialValues={initialValues}>
      <Form.Item label="Ảnh xem trước">
        <Space>
          <Avatar
            shape="square"
            size={64}
            style={{ backgroundColor: initialValues?.imagePreviewColor ?? '#d9d9d9' }}
            icon={<PictureOutlined />}
          />
          <Button disabled>Chọn ảnh (demo, không upload thật)</Button>
        </Space>
      </Form.Item>
      <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Bắt buộc' }]}>
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
      <Form.Item name="customerSegments" label="Phân khúc khách hàng" rules={[{ required: true }]}>
        <Select
          mode="multiple"
          options={['Khách hàng mới', 'Khách hàng VIP', 'Khách hàng doanh nghiệp'].map((v) => ({ value: v, label: v }))}
        />
      </Form.Item>
      <Form.Item label="Thời gian hiệu lực" required>
        <Space.Compact>
          <Form.Item
            name="effectiveFrom"
            noStyle
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker placeholder="Từ ngày" />
          </Form.Item>
          <Form.Item
            name="effectiveTo"
            noStyle
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker placeholder="Đến ngày" />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
    </Form>
  );
}
