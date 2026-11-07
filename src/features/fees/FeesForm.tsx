import { Form, Input, InputNumber, Select, DatePicker, Row, Col, type FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { FeeDefinition } from './demo-fees-data';

export type FeesFormValues = Omit<FeeDefinition, 'id' | 'history'>;

type Props = {
  form: FormInstance<FeesFormValues>;
  initialValues?: FeesFormValues;
  onValuesChange?: () => void;
};

export function FeesForm({ form, initialValues, onValuesChange }: Props) {
  const { t } = useTranslation('claude');
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
          <Form.Item name="code" label={t('forms.feeCode')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="name" label={t('forms.feeName')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="applicationType" label={t('forms.appliesTo')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'cash-loan', label: t('cashLoan') }, { value: 'credit-card', label: t('creditCard') }]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeType" label={t('forms.feeType')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={4}>
          <Form.Item name="unit" label={t('forms.unit')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: 'VND' }]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={4}>
          <Form.Item name="value" label={t('forms.value')} rules={[{ required: true, message: t('validation:required') }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="effectiveDate"
            label={t('forms.effectiveDate')}
            rules={[{ required: true, message: t('validation:required') }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => value?.format('YYYY-MM-DD')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label={t('forms.status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
