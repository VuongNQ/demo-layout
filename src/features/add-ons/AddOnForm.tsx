import { Form, Input, InputNumber, Select, Row, Col, type FormInstance } from 'antd';
import { PARTNERS, type AddOnProduct } from './demo-add-ons-data';

export type AddOnFormValues = Omit<AddOnProduct, 'id' | 'history'>;

type Props = {
  form: FormInstance<AddOnFormValues>;
  initialValues?: AddOnFormValues;
  onValuesChange?: () => void;
};

export function AddOnForm({ form, initialValues, onValuesChange }: Props) {
  return (
    <Form<AddOnFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label="Mã" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="distribution" label="Phân phối" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'standalone', label: 'Độc lập' },
                { value: 'cash-loan', label: 'Vay tiền mặt' },
                { value: 'credit-card', label: 'Thẻ tín dụng' },
                { value: 'offset-loan', label: 'Vay cấn trừ' }
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="associatedPartner" label="Đối tác liên kết" rules={[{ required: true }]}>
            <Select options={PARTNERS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeValue" label="Phí (VND)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
