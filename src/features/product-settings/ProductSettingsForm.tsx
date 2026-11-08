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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('claude');
  return (
    <Form<ProductSettingsFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Typography.Title level={5}>{t('productSettings.general')}</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={10}>
          <Form.Item name="name" label={t('productSettings.productName')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label={t('productSettings.productCode')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="status" label={t('status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select
              options={[
                { value: 'active', label: t('offer.active') },
                { value: 'draft', label: t('offer.draft') },
                { value: 'inactive', label: t('offer.inactive') }
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      <Typography.Title level={5}>{t('productSettings.rateTiers')}</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Form.Item name="baseRate" label={t('productSettings.baseRate')} rules={[{ required: true, message: t('validation:required') }]}>
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
                  <Form.Item name={[field.name, 'minAmount']} rules={[{ required: true, message: t('validation:required') }]} label={t('productSettings.from')}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={7}>
                  <Form.Item name={[field.name, 'maxAmount']} rules={[{ required: true, message: t('validation:required') }]} label={t('productSettings.to')}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={7}>
                  <Form.Item name={[field.name, 'rate']} rules={[{ required: true, message: t('validation:required') }]} label={t('productSettings.rate')}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={3}>
                  <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} block />
                </Col>
              </Row>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add({ minAmount: 0, maxAmount: 0, rate: 0 })}>
              {t('productSettings.addTier')}
            </Button>
          </>
        )}
      </Form.List>

      <Divider />
      <Typography.Title level={5}>{t('productSettings.customerConditions')}</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="customerType" label={t('productSettings.audience')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'individual', label: t('productSettings.individual') }, { value: 'business', label: t('productSettings.business') }]} />
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
                  <Form.Item name="minAge" label={t('productSettings.minAge')} rules={[{ required: true, message: t('validation:required') }]}>
                    <InputNumber min={18} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="maxAge" label={t('productSettings.maxAge')} rules={[{ required: true, message: t('validation:required') }]}>
                    <InputNumber min={18} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            ) : (
              <>
                <Col xs={24} sm={8}>
                  <Form.Item name="minRevenue" label={t('productSettings.minRevenue')} rules={[{ required: true, message: t('validation:required') }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="businessTypes" label={t('productSettings.businessTypes')} rules={[{ required: true, message: t('validation:required') }]}>
                    <Select
                      mode="multiple"
                      options={[[ 'Hộ kinh doanh', 'household' ], [ 'Công ty TNHH', 'limitedCompany' ], [ 'Công ty cổ phần', 'jointStock' ], [ 'Doanh nghiệp tư nhân', 'privateEnterprise' ]].map(([value, key]) => ({ value, label: t(`productSettings.${key}`) }))}
                    />
                  </Form.Item>
                </Col>
              </>
            )
          }
        </Form.Item>
      </Row>

      <Divider />
      <Typography.Title level={5}>{t('productSettings.requiredDocuments')}</Typography.Title>
      <Form.List name="documents">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Row key={field.key} gutter={16} align="middle">
                <Col flex="auto">
                  <Form.Item name={[field.name, 'name']} rules={[{ required: true }]}>
                    <Input placeholder={t('productSettings.documentName')} />
                  </Form.Item>
                </Col>
                <Col flex="140px">
                  <Form.Item name={[field.name, 'required']} valuePropName="checked">
                    <Checkbox>{t('productSettings.required')}</Checkbox>
                  </Form.Item>
                </Col>
                <Col flex="32px">
                  <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </Col>
              </Row>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add({ name: '', required: false })}>
              {t('productSettings.addDocument')}
            </Button>
          </>
        )}
      </Form.List>

      <Divider />
      <Typography.Title level={5}>{t('productSettings.advanced')}</Typography.Title>
      <Form.Item name="advancedEnabled" label={t('productSettings.enableAdvanced')} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, next) => prev.advancedEnabled !== next.advancedEnabled}>
        {({ getFieldValue }) =>
          getFieldValue('advancedEnabled') ? (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="approvalWorkflow" label={t('productSettings.approvalWorkflow')} rules={[{ required: true, message: t('validation:required') }]}>
                  <Select
                    options={[
                      { value: 'auto', label: t('productSettings.automatic') },
                      { value: 'single-approver', label: t('productSettings.oneApprover') },
                      { value: 'committee', label: t('productSettings.committee') }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="riskScoreThreshold" label={t('productSettings.riskThreshold')} rules={[{ required: true, message: t('validation:required') }]}>
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
