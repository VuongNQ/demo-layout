import { Form, Input, Select, Row, Col, type FormInstance } from 'antd';
import { INPUT_TYPES, SUPPLY_METHODS, type RequiredInformation } from './demo-required-information-data';

export type RequiredInformationFormValues = Omit<RequiredInformation, 'id' | 'history'>;

type Props = {
  form: FormInstance<RequiredInformationFormValues>;
  initialValues?: RequiredInformationFormValues;
  onValuesChange?: () => void;
};

export function RequiredInformationForm({ form, initialValues, onValuesChange }: Props) {
  return (
    <Form<RequiredInformationFormValues>
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
          <Form.Item name="name" label="Tên thông tin" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="inputType" label="Kiểu nhập" rules={[{ required: true }]}>
            <Select options={INPUT_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="supplyMethod" label="Cách cung cấp" rules={[{ required: true }]}>
            <Select options={SUPPLY_METHODS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
