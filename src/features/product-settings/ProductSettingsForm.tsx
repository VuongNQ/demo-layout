import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Typography,
  Checkbox,
  Row,
  Col,
  Divider,
  type FormInstance
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProductSettings } from './demo-product-settings-data';

export type ProductSettingsFormValues = Omit<ProductSettings, 'id'>;

type Props = {
  form: FormInstance<ProductSettingsFormValues>;
  initialValues?: ProductSettingsFormValues;
  onValuesChange?: () => void;
};

// Deliberately the most structurally complex form in this sketch, to
// pair with ContextualSaveBar (a long, nested form is exactly the case
// a persistent top save bar earns its keep — no bottom footer to scroll
// back to). Three kinds of structural complexity on purpose:
//  1. Form.List for pricing tiers — a dynamic, addable/removable array.
//  2. Form.Item shouldUpdate — fields conditional on another field's
//     current value (customerType, advancedEnabled), not just always
//     rendered and disabled.
//  3. Form.List for a checklist (documents) — array of objects with a
//     mixed text + boolean shape, not a simple string array.
// Fields are grouped into Row/Col grids (instead of one-per-row) so
// short fields share the available width rather than leaving blank
// space beside them — see the layout feedback this responds to.
export function ProductSettingsForm({ form, initialValues, onValuesChange }: Props) {
  return (
    <Form<ProductSettingsFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Typography.Title level={5}>Thông tin chung</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={10}>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label="Mã sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Typography.Title level={5}>Biểu lãi suất theo hạn mức</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Form.Item name="baseRate" label="Lãi suất cơ bản (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.List name="tiers">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Row key={field.key} gutter={16} align="middle">
                <Col xs={24} sm={7}>
                  <Form.Item name={[field.name, 'minAmount']} rules={[{ required: true }]} label="Từ">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={7}>
                  <Form.Item name={[field.name, 'maxAmount']} rules={[{ required: true }]} label="Đến">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={7}>
                  <Form.Item name={[field.name, 'rate']} rules={[{ required: true }]} label="Lãi suất (%)">
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} block />
                </Col>
              </Row>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add({ minAmount: 0, maxAmount: 0, rate: 0 })}>
              Thêm bậc lãi suất
            </Button>
          </>
        )}
      </Form.List>

      <Divider />
      <Typography.Title level={5}>Điều kiện khách hàng</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="customerType" label="Đối tượng" rules={[{ required: true }]}>
            <Select options={[{ value: 'individual', label: 'Cá nhân' }, { value: 'business', label: 'Doanh nghiệp' }]} />
          </Form.Item>
        </Col>
        {/* Conditional fields: re-render only when customerType actually
            changes, then show a different field set entirely — not the
            same fields merely disabled. */}
        <Form.Item noStyle shouldUpdate={(prev, next) => prev.customerType !== next.customerType}>
          {({ getFieldValue }) =>
            getFieldValue('customerType') === 'individual' ? (
              <>
                <Col xs={24} sm={8}>
                  <Form.Item name="minAge" label="Tuổi tối thiểu" rules={[{ required: true }]}>
                    <InputNumber min={18} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="maxAge" label="Tuổi tối đa" rules={[{ required: true }]}>
                    <InputNumber min={18} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            ) : (
              <>
                <Col xs={24} sm={8}>
                  <Form.Item name="minRevenue" label="Doanh thu tối thiểu/năm" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="businessTypes" label="Loại hình doanh nghiệp" rules={[{ required: true }]}>
                    <Select
                      mode="multiple"
                      options={['Hộ kinh doanh', 'Công ty TNHH', 'Công ty cổ phần', 'Doanh nghiệp tư nhân'].map((v) => ({
                        value: v,
                        label: v
                      }))}
                    />
                  </Form.Item>
                </Col>
              </>
            )
          }
        </Form.Item>
      </Row>

      <Divider />
      <Typography.Title level={5}>Hồ sơ yêu cầu</Typography.Title>
      <Form.List name="documents">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Row key={field.key} gutter={16} align="middle">
                <Col flex="auto">
                  <Form.Item name={[field.name, 'name']} rules={[{ required: true }]}>
                    <Input placeholder="Tên hồ sơ" />
                  </Form.Item>
                </Col>
                <Col flex="140px">
                  <Form.Item name={[field.name, 'required']} valuePropName="checked">
                    <Checkbox>Bắt buộc</Checkbox>
                  </Form.Item>
                </Col>
                <Col flex="32px">
                  <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </Col>
              </Row>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add({ name: '', required: false })}>
              Thêm hồ sơ
            </Button>
          </>
        )}
      </Form.List>

      <Divider />
      <Typography.Title level={5}>Cấu hình nâng cao</Typography.Title>
      <Form.Item name="advancedEnabled" label="Bật cấu hình nâng cao" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, next) => prev.advancedEnabled !== next.advancedEnabled}>
        {({ getFieldValue }) =>
          getFieldValue('advancedEnabled') ? (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="approvalWorkflow" label="Luồng phê duyệt" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'auto', label: 'Tự động' },
                      { value: 'single-approver', label: '1 người phê duyệt' },
                      { value: 'committee', label: 'Hội đồng' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="riskScoreThreshold" label="Ngưỡng điểm rủi ro" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          ) : null
        }
      </Form.Item>
    </Form>
  );
}
