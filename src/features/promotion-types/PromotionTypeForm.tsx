import { Form, Input, Select, type FormInstance } from 'antd';
import type { PromotionType } from './demo-promotion-types-data';

export type PromotionTypeFormValues = Omit<PromotionType, 'id'>;

type Props = {
  form: FormInstance<PromotionTypeFormValues>;
  initialValues?: PromotionTypeFormValues;
};

export function PromotionTypeForm({ form, initialValues }: Props) {
  return (
    <Form<PromotionTypeFormValues> form={form} layout="vertical" initialValues={initialValues}>
      <Form.Item name="name" label="Tên loại khuyến mãi" rules={[{ required: true, message: 'Bắt buộc' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
        <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
      </Form.Item>
    </Form>
  );
}
