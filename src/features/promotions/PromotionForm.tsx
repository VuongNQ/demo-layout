import { Form, Input, Select, DatePicker, Row, Col, type FormInstance } from 'antd';
import dayjs from 'dayjs';
import { OFFER_TYPES, PRODUCTS, type Promotion } from './demo-promotions-data';

export type PromotionFormValues = Omit<Promotion, 'id'>;

type Props = {
  form: FormInstance<PromotionFormValues>;
  initialValues?: PromotionFormValues;
  onValuesChange?: () => void;
};

export function PromotionForm({ form, initialValues, onValuesChange }: Props) {
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
          <Form.Item name="name" label="Tên khuyến mãi" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="offerType" label="Loại ưu đãi" rules={[{ required: true }]}>
            <Select options={OFFER_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="assignedProducts" label="Sản phẩm áp dụng" rules={[{ required: true }]}>
        <Select mode="multiple" options={PRODUCTS.map((v) => ({ value: v, label: v }))} />
      </Form.Item>
    </Form>
  );
}
