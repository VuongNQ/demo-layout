import { Form, Input, InputNumber, Select, DatePicker, Row, Col, type FormInstance } from 'antd';
import dayjs from 'dayjs';
import type { FeeDefinition } from './demo-fees-data';

export type FeesFormValues = Omit<FeeDefinition, 'id' | 'history'>;

type Props = {
  form: FormInstance<FeesFormValues>;
  initialValues?: FeesFormValues;
  onValuesChange?: () => void;
};

export function FeesForm({ form, initialValues, onValuesChange }: Props) {
  return (
    <Form<FeesFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label="Mã phí" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label="Tên phí" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="applicationType" label="Áp dụng cho" rules={[{ required: true }]}>
            <Select options={[{ value: 'cash-loan', label: 'Vay tiền mặt' }, { value: 'credit-card', label: 'Thẻ tín dụng' }]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeType" label="Loại phí" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={4}>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Select options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: 'VND' }]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={4}>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="effectiveDate"
            label="Ngày hiệu lực"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
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
