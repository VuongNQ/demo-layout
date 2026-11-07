import { Form, Input, InputNumber, Select, Row, Col, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { PARTNERS, type AddOnProduct } from './demo-add-ons-data';

export type AddOnFormValues = Omit<AddOnProduct, 'id' | 'history'>;

type Props = {
  form: FormInstance<AddOnFormValues>;
  initialValues?: AddOnFormValues;
  onValuesChange?: () => void;
};

export function AddOnForm({ form, initialValues, onValuesChange }: Props) {
  const { t } = useTranslation('claude');
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
          <Form.Item name="code" label={t('forms.addOnCode')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label={t('forms.addOnName')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="distribution" label={t('forms.distribution')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select
              options={[
                { value: 'standalone', label: t('standalone') },
                { value: 'cash-loan', label: t('cashLoan') },
                { value: 'credit-card', label: t('creditCard') },
                { value: 'offset-loan', label: t('offsetLoan') }
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="associatedPartner" label={t('forms.associatedPartner')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={PARTNERS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeValue" label={t('forms.feeVnd')} rules={[{ required: true, message: t('validation:required') }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label={t('forms.status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
