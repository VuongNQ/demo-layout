import { Form, Input, Select, Switch, Row, Col, Avatar, Button, Space, type FormInstance } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { LABELS, REQUIRED_INFO_SETS, FEES, type DisplayInformationSet } from './demo-display-information-sets-data';

export type DisplayInformationSetFormValues = Omit<DisplayInformationSet, 'id'>;

type Props = {
  form: FormInstance<DisplayInformationSetFormValues>;
  initialValues?: DisplayInformationSetFormValues;
  onValuesChange?: () => void;
};

export function DisplayInformationSetForm({ form, initialValues, onValuesChange }: Props) {
  return (
    <Form<DisplayInformationSetFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Form.Item label="Ảnh hiển thị">
        <Space>
          <Avatar shape="square" size={64} style={{ backgroundColor: initialValues?.previewColor ?? '#d9d9d9' }} icon={<PictureOutlined />} />
          <Button disabled>Chọn ảnh (demo, không upload thật)</Button>
        </Space>
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label="Mã" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item name="name" label="Tên bộ hiển thị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="productLineCode" label="Dòng sản phẩm" rules={[{ required: true }]}>
            <Select options={[{ value: 'CL', label: 'Vay tiền mặt (CL)' }, { value: 'CD', label: 'Thẻ tín dụng (CD)' }]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="labelIds" label="Nhãn sản phẩm" rules={[{ required: true }]}>
            <Select mode="multiple" options={LABELS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="requiredInformationSetId" label="Bộ thông tin bắt buộc" rules={[{ required: true }]}>
            <Select options={REQUIRED_INFO_SETS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeIds" label="Biểu phí áp dụng" rules={[{ required: true }]}>
            <Select mode="multiple" options={FEES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="showInApp" label="Hiện ở App" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="showInWeb" label="Hiện ở Web" valuePropName="checked">
            <Switch />
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
