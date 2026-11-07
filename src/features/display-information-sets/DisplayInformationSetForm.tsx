import { Form, Input, Select, Switch, Row, Col, Avatar, Button, Space, type FormInstance } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LABELS, REQUIRED_INFO_SETS, FEES, type DisplayInformationSet } from './demo-display-information-sets-data';

export type DisplayInformationSetFormValues = Omit<DisplayInformationSet, 'id'>;

type Props = {
  form: FormInstance<DisplayInformationSetFormValues>;
  initialValues?: DisplayInformationSetFormValues;
  onValuesChange?: () => void;
};

export function DisplayInformationSetForm({ form, initialValues, onValuesChange }: Props) {
  const { t } = useTranslation('claude');
  return (
    <Form<DisplayInformationSetFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Form.Item label={t('pages.displaySet.imageLabel')}>
        <Space>
          <Avatar shape="square" size={64} style={{ backgroundColor: initialValues?.previewColor ?? '#d9d9d9' }} icon={<PictureOutlined />} />
          <Button disabled>{t('pages.displaySet.chooseImage')}</Button>
        </Space>
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="code" label={t('pages.displaySet.code')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item name="name" label={t('pages.displaySet.name')} rules={[{ required: true, message: t('validation:required') }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="productLineCode" label={t('pages.displaySet.productLine')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'CL', label: t('pages.displaySet.cashLoan') }, { value: 'CD', label: t('pages.displaySet.creditCard') }]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="labelIds" label={t('pages.displaySet.labels')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select mode="multiple" options={LABELS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="requiredInformationSetId" label={t('pages.displaySet.requiredSet')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={REQUIRED_INFO_SETS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="feeIds" label={t('pages.displaySet.fees')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select mode="multiple" options={FEES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="showInApp" label={t('pages.displaySet.app')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="showInWeb" label={t('pages.displaySet.web')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="status" label={t('pages.displaySet.status')} rules={[{ required: true, message: t('validation:required') }]}>
            <Select options={[{ value: 'active', label: t('pages.displaySet.active') }, { value: 'inactive', label: t('pages.displaySet.inactive') }]} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
