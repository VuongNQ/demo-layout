import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Form, Input, Select, Space, Table } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/chatgptTheme';
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge';
import styles from './ChatGPTShowcasePage.module.scss';

type RequestValues = { title: string; ownerEmail: string; category: string; includeNote?: boolean; note?: string };
type FormError = { name: (string | number)[]; errors: string[] };

const badgeExamples: { variant: StatusBadgeVariant; labelKey: string }[] = [
  { variant: 'success', labelKey: 'success' }, { variant: 'warning', labelKey: 'warning' },
  { variant: 'error', labelKey: 'error' }, { variant: 'info', labelKey: 'information' },
  { variant: 'neutral', labelKey: 'neutral' }, { variant: 'accent', labelKey: 'accent' }
];

function focusError(form: FormInstance<RequestValues>, name: (string | number)[]) {
  form.scrollToField(name, { behavior: 'smooth' });
  window.requestAnimationFrame(() => {
    const field = form.getFieldInstance(name) as { focus?: () => void } | undefined;
    field?.focus?.();
  });
}

export function ChatGPTShowcasePage() {
  const { t } = useTranslation('chatgpt');
  const [form] = Form.useForm<RequestValues>();
  const [errors, setErrors] = useState<FormError[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const includeNote = Form.useWatch('includeNote', form);

  async function saveExample() {
    setErrors([]);
    setSaved(false);
    setSaving(true);
    // Local prototype feedback only: no API or persisted customer data.
    await new Promise((resolve) => setTimeout(resolve, 350));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className={styles.stack}>
      <Card title={t('typography')} className={styles.card}>
        <p className={styles.caption}>{t('typographyCaption')}</p>
        <h2 className={styles.sectionTitle}>{t('sectionHeading')}</h2>
        <h3 className={styles.componentTitle}>{t('componentHeading')}</h3>
        <p className={styles.bodyLarge}>{t('bodyLarge')}</p>
        <p>{t('body')} <strong>{t('bodyEmphasis')}</strong></p>
        <div className={styles.swatches}>
          {[
            ['brandPrimary', colors.brandPrimary], ['brandSecondary', colors.brandSecondary],
            ['brandOrange', colors.brandOrange], ['brandYellow', colors.brandYellow], ['brandSun', colors.brandSun],
            ['success', colors.success], ['warning', colors.warning], ['error', colors.error], ['information', colors.info]
          ].map(([name, color]) => <div className={styles.swatch} key={name}><span className={styles.colorBlock} style={{ backgroundColor: color }} aria-hidden="true" /><span>{t(name)}<small>{color}</small></span></div>)}
        </div>
      </Card>

      <Card title={t('statusVariants')} className={styles.card}>
        <p>{t('statusExamples')}</p>
        <Space wrap>{badgeExamples.map((item) => <StatusBadge key={item.variant} variant={item.variant} label={t(item.labelKey)} />)}</Space>
      </Card>

      <Card title={t('tablePattern')} className={styles.card}>
        <Table
          size="middle"
          rowKey="id"
          pagination={false}
          scroll={{ x: 560 }}
          dataSource={[
            { id: 'demo-001', name: t('exampleQueue'), owner: t('fictionalOperator'), state: t('ready') },
            { id: 'demo-002', name: t('exampleAudit'), owner: t('fictionalReviewer'), state: t('pending') }
          ]}
          columns={[
            { title: t('reference'), dataIndex: 'id', key: 'id' },
            { title: t('workItem'), dataIndex: 'name', key: 'name' },
            { title: t('owner'), dataIndex: 'owner', key: 'owner' },
            { title: t('exampleState'), dataIndex: 'state', key: 'state' }
          ]}
        />
      </Card>

      <Card title={t('requestForm')} className={styles.card}>
        <p className={styles.intro}>{t('requestIntro')}</p>
        {errors.length > 0 && <Alert className={styles.feedback} type="error" showIcon message={t('reviewFields')} description={<ul className={styles.errorList}>{errors.map((field) => <li key={field.name.join('.')}><button type="button" onClick={() => focusError(form, field.name)}>{field.errors[0]}</button></li>)}</ul>} />}
        {saved && <Alert className={styles.feedback} type="success" showIcon message={t('requestCompleted')} />}
        <Form<RequestValues>
          form={form}
          className={styles.form}
          layout="vertical"
          requiredMark="optional"
          onFinish={() => void saveExample()}
          onFinishFailed={({ errorFields }) => {
            setSaved(false);
            setErrors(errorFields.map(({ name, errors: messages }) => ({ name, errors: messages })));
            if (errorFields[0]) focusError(form, errorFields[0].name);
          }}
          onValuesChange={() => setSaved(false)}
          onFieldsChange={(_, fields) => {
            // Ant Design owns validation state. Its complete field snapshot
            // retains other errors and drops each error once revalidated.
            setErrors(fields.filter((field) => (field.errors?.length ?? 0) > 0).map((field) => ({ name: field.name, errors: field.errors ?? [] })));
          }}
        >
          <fieldset className={styles.fieldset}>
            <legend>{t('requestDetails')}</legend>
            <Form.Item name="title" label={t('requestTitle')} extra={t('titleHelp')} rules={[{ required: true, message: t('enterTitle') }]}><Input placeholder={t('titlePlaceholder')} /></Form.Item>
            <Form.Item name="category" label={t('category')} extra={t('categoryHelp')} rules={[{ required: true, message: t('chooseCategory') }]}><Select placeholder={t('selectCategory')} options={[{ value: 'review', label: t('review') }, { value: 'configuration', label: t('configuration') }]} /></Form.Item>
          </fieldset>
          <fieldset className={styles.fieldset}>
            <legend>{t('ownerNotes')}</legend>
            <Form.Item name="ownerEmail" label={t('ownerEmail')} extra={t('emailHelp')} rules={[{ required: true, message: t('enterEmail') }, { type: 'email', message: t('validEmail') }]}><Input type="email" autoComplete="off" /></Form.Item>
            <Form.Item name="includeNote" valuePropName="checked"><Checkbox>{t('optionalNote')}</Checkbox></Form.Item>
            {includeNote && <Form.Item name="note" label={t('note')} extra={t('noteHelp')}><Input.TextArea rows={3} /></Form.Item>}
          </fieldset>
          <Space><Button type="primary" htmlType="submit" loading={saving}>{t('saveExample')}</Button><Button htmlType="button" onClick={() => { form.resetFields(); setErrors([]); setSaved(false); }}>{t('clearForm')}</Button></Space>
        </Form>
      </Card>
    </div>
  );
}
