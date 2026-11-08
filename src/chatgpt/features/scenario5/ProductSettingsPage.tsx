import { Alert, Button, Card, Checkbox, Divider, Form, Input, InputNumber, Modal, Row, Col, Select, Space, Spin, Switch, Typography } from 'antd';
import type { ProductSettings } from '@/features/product-settings/demo-product-settings-data';
import { useProductSettingsDetailQuery, useUpdateProductSettingsMutation } from '@/features/product-settings/product-settings.queries.hook';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import styles from './ProductSettingsPage.module.scss';

type SettingsValues = Omit<ProductSettings, 'id'>;
const clone = <T,>(value: T): T => structuredClone(value);
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonical(child)]));
  return value;
}
const snapshot = (value: SettingsValues | undefined) => JSON.stringify(canonical(value));
const toValues = ({ id: _id, ...rest }: ProductSettings): SettingsValues => clone(rest);

export function ProductSettingsPage() {
  const { t } = useTranslation('chatgpt');
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, isError, refetch } = useProductSettingsDetailQuery(id);
  const updateMutation = useUpdateProductSettingsMutation();
  const [form] = Form.useForm<SettingsValues>();
  const [baseline, setBaseline] = useState<SettingsValues | null>(null);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const loadedId = useRef('');
  const submitLock = useRef(false);
  const values = Form.useWatch([], form) as SettingsValues | undefined;
  const isDirty = baseline !== null && snapshot(values ?? form.getFieldsValue(true)) !== snapshot(baseline);
  const isSaving = updateMutation.isPending;
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    (isDirty || isSaving) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search || currentLocation.hash !== nextLocation.hash)
  );

  useEffect(() => {
    if (!item || item.id !== id || loadedId.current === item.id) return;
    const initial = toValues(item);
    loadedId.current = item.id;
    setBaseline(initial);
    form.setFieldsValue(initial);
    setErrorText('');
  }, [form, id, item]);

  useEffect(() => {
    if (!isDirty && !isSaving) return;
    const preventUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isDirty, isSaving]);

  async function save(valuesToSave: SettingsValues) {
    if (!id || submitLock.current) return;
    submitLock.current = true;
    setErrorText('');
    setSuccessText('');
    try {
      const updated = await updateMutation.mutateAsync({ id, patch: valuesToSave });
      const nextBaseline = toValues(updated);
      setBaseline(nextBaseline);
      form.setFieldsValue(nextBaseline);
      setSuccessText(t('pages.scenario5.saved'));
      blocker.reset?.();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : t('pages.scenario5.saveError'));
    } finally {
      submitLock.current = false;
    }
  }

  function discard() {
    if (baseline) {
      form.setFieldsValue(clone(baseline));
      form.setFields([{ name: 'name', errors: [] }, { name: 'code', errors: [] }]);
      setSuccessText('');
    }
  }

  function proceedDiscard() {
    discard();
    blocker.proceed?.();
  }

  if (isLoading) return <div className={styles.state} role="status"><Spin /> {t('pages.scenario5.loading')}</div>;
  if (isError) return <Alert type="error" showIcon message={t('pages.scenario5.loadError')} action={<Button onClick={() => void refetch()}>{t('pages.scenario5.retry')}</Button>} />;
  if (!item || item.id !== id || !baseline) return <Alert type="warning" showIcon message={t('pages.scenario5.notFound')} description={t('pages.scenario5.notFoundDescription', { id })} action={<Button onClick={() => navigate('/chatgpt')}>{t('pages.scenario5.return')}</Button>} />;

  return <div className={styles.page}>
    <div className={styles.saveBar} aria-label={t('pages.scenario5.saveBar')}>
      <div><Typography.Text strong>{isDirty ? t('pages.scenario5.dirty') : t('pages.scenario5.clean')}</Typography.Text>{isSaving && <Typography.Text role="status">{t('pages.scenario5.saving')}</Typography.Text>}</div>
      <Space wrap>
        <Button disabled={!isDirty || isSaving} onClick={discard}>{t('pages.scenario5.discard')}</Button>
        <Button type="primary" htmlType="submit" form="chatgpt-product-settings-form" disabled={!isDirty} loading={isSaving}>{t('pages.scenario5.save')}</Button>
      </Space>
    </div>
    <div className={styles.heading}>
      <Button type="link" onClick={() => navigate('/chatgpt')}>{t('pages.scenario5.back')}</Button>
      <Typography.Title level={1}>{t('pages.scenario5.title', { name: item.name })}</Typography.Title>
      <Typography.Text>{t('pages.scenario5.identity', { id: item.id, code: item.code })}</Typography.Text>
    </div>
    {errorText && <Alert type="error" showIcon role="alert" message={t('pages.scenario5.saveError')} description={errorText} />}
    {successText && <Alert type="success" showIcon role="status" message={successText} />}
    <Form id="chatgpt-product-settings-form" form={form} layout="vertical" onFinish={save} onFinishFailed={() => setErrorText(t('pages.scenario5.validationError'))} scrollToFirstError={{ behavior: 'smooth', block: 'center' }}>
      <Card title={t('pages.scenario5.general')}>
        <Row gutter={16}>
          <Col xs={24} md={10}><Form.Item name="name" label={t('pages.scenario5.name')} rules={[{ required: true, whitespace: true, message: t('pages.scenario5.required') }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="code" label={t('pages.scenario5.code')} rules={[{ required: true, whitespace: true, message: t('pages.scenario5.required') }]}><Input /></Form.Item></Col>
          <Col xs={24} md={6}><Form.Item name="status" label={t('pages.scenario5.status')} rules={[{ required: true }]}><Select options={[
            { value: 'active', label: t('pages.scenario5.active') }, { value: 'draft', label: t('pages.scenario5.draft') }, { value: 'inactive', label: t('pages.scenario5.inactive') }
          ]} /></Form.Item></Col>
        </Row>
      </Card>
      <Card title={t('pages.scenario5.pricing')} className={styles.sectionCard}>
        <Form.Item name="baseRate" label={t('pages.scenario5.baseRate')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} max={100} /></Form.Item>
        <Form.List name="tiers">{(fields, { add, remove }) => <div className={styles.listFields}>
          {fields.map((field, index) => <Row gutter={12} key={field.key}>
            <Col xs={24} md={7}><Form.Item name={[field.name, 'minAmount']} label={index === 0 ? t('pages.scenario5.from') : undefined} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} /></Form.Item></Col>
            <Col xs={24} md={7}><Form.Item name={[field.name, 'maxAmount']} label={index === 0 ? t('pages.scenario5.to') : undefined} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} /></Form.Item></Col>
            <Col xs={20} md={7}><Form.Item name={[field.name, 'rate']} label={index === 0 ? t('pages.scenario5.rate') : undefined} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} max={100} /></Form.Item></Col>
            <Col xs={4} md={3}><Button aria-label={t('pages.scenario5.removeTier', { index: index + 1 })} onClick={() => remove(field.name)}>{t('pages.scenario5.remove')}</Button></Col>
          </Row>)}
          <Button onClick={() => add({ minAmount: 0, maxAmount: 0, rate: 0 })}>{t('pages.scenario5.addTier')}</Button>
        </div>}</Form.List>
      </Card>
      <Card title={t('pages.scenario5.customer')} className={styles.sectionCard}>
        <Form.Item name="customerType" label={t('pages.scenario5.audience')} rules={[{ required: true }]}><Select options={[{ value: 'individual', label: t('pages.scenario5.individual') }, { value: 'business', label: t('pages.scenario5.business') }]} /></Form.Item>
        <Form.Item noStyle shouldUpdate={(previous, next) => previous.customerType !== next.customerType}>{({ getFieldValue }) => getFieldValue('customerType') === 'individual' ? <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name="minAge" label={t('pages.scenario5.minAge')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={18} max={100} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="maxAge" label={t('pages.scenario5.maxAge')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={18} max={100} /></Form.Item></Col>
        </Row> : <Row gutter={16}>
          <Col xs={24} md={10}><Form.Item name="minRevenue" label={t('pages.scenario5.minRevenue')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} /></Form.Item></Col>
          <Col xs={24} md={14}><Form.Item name="businessTypes" label={t('pages.scenario5.businessTypes')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><Select mode="multiple" options={[
            { value: 'Hộ kinh doanh', label: t('pages.scenario5.household') }, { value: 'Công ty TNHH', label: t('pages.scenario5.limitedCompany') }, { value: 'Công ty cổ phần', label: t('pages.scenario5.jointStock') }, { value: 'Doanh nghiệp tư nhân', label: t('pages.scenario5.privateEnterprise') }
          ]} /></Form.Item></Col>
        </Row>}</Form.Item>
      </Card>
      <Card title={t('pages.scenario5.documents')} className={styles.sectionCard}>
        <Form.List name="documents">{(fields, { add, remove }) => <div className={styles.listFields}>
          {fields.map((field, index) => <Row gutter={12} align="middle" key={field.key}>
            <Col flex="auto"><Form.Item name={[field.name, 'name']} label={index === 0 ? t('pages.scenario5.documentName') : undefined} rules={[{ required: true, message: t('pages.scenario5.required') }]}><Input /></Form.Item></Col>
            <Col><Form.Item name={[field.name, 'required']} valuePropName="checked"><Checkbox>{t('pages.scenario5.requiredDocument')}</Checkbox></Form.Item></Col>
            <Col><Button aria-label={t('pages.scenario5.removeDocument', { index: index + 1 })} onClick={() => remove(field.name)}>{t('pages.scenario5.remove')}</Button></Col>
          </Row>)}
          <Button onClick={() => add({ name: '', required: false })}>{t('pages.scenario5.addDocument')}</Button>
        </div>}</Form.List>
      </Card>
      <Card title={t('pages.scenario5.advanced')} className={styles.sectionCard}>
        <Form.Item name="advancedEnabled" label={t('pages.scenario5.enableAdvanced')} valuePropName="checked"><Switch /></Form.Item>
        <Form.Item noStyle shouldUpdate={(previous, next) => previous.advancedEnabled !== next.advancedEnabled}>{({ getFieldValue }) => getFieldValue('advancedEnabled') ? <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name="approvalWorkflow" label={t('pages.scenario5.workflow')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><Select options={[
            { value: 'auto', label: t('pages.scenario5.automatic') }, { value: 'single-approver', label: t('pages.scenario5.singleApprover') }, { value: 'committee', label: t('pages.scenario5.committee') }
          ]} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="riskScoreThreshold" label={t('pages.scenario5.riskThreshold')} rules={[{ required: true, message: t('pages.scenario5.required') }]}><InputNumber min={0} max={100} /></Form.Item></Col>
        </Row> : null}</Form.Item>
      </Card>
      <Divider />
      <div className={styles.bottomActions}><Button disabled={!isDirty || isSaving} onClick={discard}>{t('pages.scenario5.discard')}</Button><Button type="primary" htmlType="submit" disabled={!isDirty} loading={isSaving}>{t('pages.scenario5.save')}</Button></div>
    </Form>
    <Modal open={blocker.state === 'blocked'} title={isSaving ? t('pages.scenario5.saving') : t('pages.scenario5.unsavedTitle')} onCancel={() => blocker.reset?.()} onOk={proceedDiscard} okText={t('pages.scenario5.discardChanges')} cancelText={t('pages.scenario5.stay')} okButtonProps={{ disabled: isSaving }} cancelButtonProps={{ disabled: isSaving }} closable={!isSaving} maskClosable={false} keyboard={!isSaving}>
      <Typography.Paragraph>{isSaving ? t('pages.scenario5.waitForSave') : t('pages.scenario5.unsavedDescription')}</Typography.Paragraph>
    </Modal>
  </div>;
}
