import { Form, Input, Select, Row, Col, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { INPUT_TYPES, SUPPLY_METHODS, type RequiredInformation } from './demo-required-information-data';

export type RequiredInformationFormValues = Omit<RequiredInformation, 'id' | 'history'>;

type Props = {
  form: FormInstance<RequiredInformationFormValues>;
  initialValues?: RequiredInformationFormValues;
  onValuesChange?: () => void;
};

export function RequiredInformationForm({ form, initialValues, onValuesChange }: Props) {
  const { t } = useTranslation('claude');
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
          <Form.Item name="code" label={t('pages.requiredInfo.code')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label={t('pages.requiredInfo.name')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="inputType" label={t('pages.requiredInfo.inputType')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={INPUT_TYPES.map((v) => ({ value: v, label: t(`pages.requiredInfo.inputTypes.${v}`, { defaultValue: v }) }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="supplyMethod" label={t('pages.requiredInfo.supplyMethod')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={SUPPLY_METHODS.map((v) => ({ value: v, label: t(`pages.requiredInfo.supplyMethods.${v}`, { defaultValue: v }) }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label={t('pages.requiredInfo.status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'active', label: t('pages.requiredInfo.active') }, { value: 'inactive', label: t('pages.requiredInfo.inactive') }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
