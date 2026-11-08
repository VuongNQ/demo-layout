import { Alert, Button, Card, Form, Input, InputNumber, Space, Tabs, Typography } from 'antd';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TabsVsAnchorPage.module.scss';

type DemoValues = { name: string; ownerEmail: string; discount: number; segment: string; reminderDaysBefore: number };
type Mode = 'tabs' | 'anchors';
type ValidationIssue = { name: (string | number)[]; errors: string[] };

const initialValues: DemoValues = { name: '', ownerEmail: 'operator@example.test', discount: 10, segment: 'New customers', reminderDaysBefore: 45 };

export function TabsVsAnchorPage() {
  const { t } = useTranslation('chatgpt');
  const [tabsForm] = Form.useForm<DemoValues>();
  const [anchorForm] = Form.useForm<DemoValues>();
  const [activeTab, setActiveTab] = useState('general');
  const [issues, setIssues] = useState<Record<Mode, ValidationIssue[]>>({ tabs: [], anchors: [] });
  const [feedback, setFeedback] = useState<Record<Mode, string>>({ tabs: '', anchors: '' });
  const anchorSections = useRef<Record<string, HTMLElement | null>>({});
  const validationRuns = useRef<Record<Mode, number>>({ tabs: 0, anchors: 0 });

  function fieldLabel(path: (string | number)[]) {
    const field = String(path[path.length - 1]);
    return t(`pages.scenario4.${field === 'name' ? 'name' : field === 'reminderDaysBefore' ? 'reminderDaysBefore' : field}`);
  }

  function focusIssue(mode: Mode, issue: ValidationIssue) {
    const section = issue.name[0] === 'reminderDaysBefore' ? 'notifications' : 'general';
    if (mode === 'tabs') {
      setActiveTab(section);
      requestAnimationFrame(() => {
        const form = tabsForm;
        form.scrollToField(issue.name);
        form.getFieldInstance(issue.name)?.focus?.();
      });
    } else {
      const container = anchorSections.current[section];
      container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      requestAnimationFrame(() => {
        anchorForm.scrollToField(issue.name);
        anchorForm.getFieldInstance(issue.name)?.focus?.();
      });
    }
  }

  function submitFailed(mode: Mode, error: { errorFields: ValidationIssue[] }) {
    setIssues((current) => ({ ...current, [mode]: error.errorFields }));
    setFeedback((current) => ({ ...current, [mode]: '' }));
  }

  function reconcileErrors(mode: Mode, form: typeof tabsForm) {
    const run = ++validationRuns.current[mode];
    setFeedback((current) => ({ ...current, [mode]: '' }));
    void form.validateFields({ validateOnly: true }).then(() => {
      if (validationRuns.current[mode] === run) setIssues((current) => ({ ...current, [mode]: [] }));
    }).catch((error: { errorFields?: ValidationIssue[] }) => {
      if (validationRuns.current[mode] === run) setIssues((current) => ({ ...current, [mode]: error.errorFields ?? [] }));
    });
  }

  function submitSucceeded(mode: Mode) {
    setIssues((current) => ({ ...current, [mode]: [] }));
    setFeedback((current) => ({ ...current, [mode]: t('pages.scenario4.saved') }));
  }

  function errorSummary(mode: Mode) {
    const currentIssues = issues[mode];
    if (!currentIssues.length) return null;
    return <Alert
      className={styles.summary}
      type="error"
      showIcon
      message={t('pages.scenario4.errorSummary', { count: currentIssues.length })}
      description={<ul>{currentIssues.map((issue) => <li key={issue.name.join('.')}>
        <Button type="link" onClick={() => focusIssue(mode, issue)}>{t('pages.scenario4.goToError', { field: fieldLabel(issue.name) })}</Button>
        {issue.errors[0] && <span>{issue.errors[0]}</span>}
      </li>)}</ul>}
    />;
  }

  function reset() {
    tabsForm.resetFields();
    anchorForm.resetFields();
    setIssues({ tabs: [], anchors: [] });
    setFeedback({ tabs: '', anchors: '' });
  }

  const tabContent = (section: 'general' | 'notifications') => <div className={styles.sectionContent}>
    <Typography.Title level={3}>{t(section === 'general' ? 'pages.scenario4.general' : 'pages.scenario4.notifications')}</Typography.Title>
    {section === 'general' ? <>
      <Form.Item name="name" label={t('pages.scenario4.name')} rules={[{ required: true, whitespace: true, message: t('pages.scenario4.nameRequired') }]}><Input aria-label={t('pages.scenario4.name')} /></Form.Item>
      <Form.Item name="ownerEmail" label={t('pages.scenario4.ownerEmail')} rules={[{ type: 'email', message: t('pages.scenario4.emailInvalid') }]}><Input aria-label={t('pages.scenario4.ownerEmail')} /></Form.Item>
      <Form.Item name="discount" label={t('pages.scenario4.discount')}><InputNumber min={0} max={100} /></Form.Item>
      <Form.Item name="segment" label={t('pages.scenario4.segment')}><Input aria-label={t('pages.scenario4.segment')} /></Form.Item>
    </> : <Form.Item name="reminderDaysBefore" label={t('pages.scenario4.reminderDaysBefore')} rules={[{ required: true, message: t('pages.scenario4.reminderRequired') }, { type: 'number', max: 30, message: t('pages.scenario4.reminderTooHigh') }]}><InputNumber min={0} max={90} /></Form.Item>}
  </div>;

  return <div className={styles.page}>
    <Typography.Title level={1}>{t('pages.scenario4.title')}</Typography.Title>
    <Typography.Paragraph>{t('pages.scenario4.intro')}</Typography.Paragraph>
    <Alert type="info" showIcon message={t('pages.scenario4.fixtureNotice')} />
    <Space wrap><Button onClick={reset}>{t('pages.scenario4.reset')}</Button></Space>
    <div className={styles.columns}>
      <Card title={t('pages.scenario4.tabsMode')}>
        {errorSummary('tabs')}
        <Form name="scenario4-tabs" form={tabsForm} layout="vertical" initialValues={initialValues} onValuesChange={() => reconcileErrors('tabs', tabsForm)} onFinish={() => submitSucceeded('tabs')} onFinishFailed={(error) => submitFailed('tabs', error)}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            { key: 'general', label: t('pages.scenario4.general'), forceRender: true, children: tabContent('general') },
            { key: 'notifications', label: t('pages.scenario4.notifications'), forceRender: true, children: tabContent('notifications') }
          ]} />
          <Button type="primary" htmlType="submit">{t('pages.scenario4.save')}</Button>
          {feedback.tabs && <Typography.Paragraph role="status">{feedback.tabs}</Typography.Paragraph>}
        </Form>
      </Card>
      <Card title={t('pages.scenario4.anchorMode')}>
        {errorSummary('anchors')}
        <nav className={styles.anchorNav} aria-label={t('pages.scenario4.sectionNavigation')}>
          <a href="#scenario4-general" onClick={(event) => { event.preventDefault(); anchorSections.current.general?.scrollIntoView({ behavior: 'smooth' }); }}>{t('pages.scenario4.general')}</a>
          <a href="#scenario4-notifications" onClick={(event) => { event.preventDefault(); anchorSections.current.notifications?.scrollIntoView({ behavior: 'smooth' }); }}>{t('pages.scenario4.notifications')}</a>
        </nav>
        <Form name="scenario4-anchors" form={anchorForm} layout="vertical" initialValues={initialValues} onValuesChange={() => reconcileErrors('anchors', anchorForm)} onFinish={() => submitSucceeded('anchors')} onFinishFailed={(error) => submitFailed('anchors', error)}>
          <section id="scenario4-general" ref={(element) => { anchorSections.current.general = element; }} className={styles.section} aria-labelledby="scenario4-general-heading">
            <Typography.Title id="scenario4-general-heading" level={3}>{t('pages.scenario4.general')}</Typography.Title>
            <Form.Item name="name" label={t('pages.scenario4.name')} rules={[{ required: true, whitespace: true, message: t('pages.scenario4.nameRequired') }]}><Input aria-label={t('pages.scenario4.name')} /></Form.Item>
            <Form.Item name="ownerEmail" label={t('pages.scenario4.ownerEmail')} rules={[{ type: 'email', message: t('pages.scenario4.emailInvalid') }]}><Input aria-label={t('pages.scenario4.ownerEmail')} /></Form.Item>
            <Form.Item name="discount" label={t('pages.scenario4.discount')}><InputNumber min={0} max={100} /></Form.Item>
            <Form.Item name="segment" label={t('pages.scenario4.segment')}><Input aria-label={t('pages.scenario4.segment')} /></Form.Item>
          </section>
          <section id="scenario4-notifications" ref={(element) => { anchorSections.current.notifications = element; }} className={styles.section} aria-labelledby="scenario4-notifications-heading">
            <Typography.Title id="scenario4-notifications-heading" level={3}>{t('pages.scenario4.notifications')}</Typography.Title>
            <Form.Item name="reminderDaysBefore" label={t('pages.scenario4.reminderDaysBefore')} rules={[{ required: true, message: t('pages.scenario4.reminderRequired') }, { type: 'number', max: 30, message: t('pages.scenario4.reminderTooHigh') }]}><InputNumber min={0} max={90} /></Form.Item>
          </section>
          <Button type="primary" htmlType="submit">{t('pages.scenario4.save')}</Button>
          {feedback.anchors && <Typography.Paragraph role="status">{feedback.anchors}</Typography.Paragraph>}
        </Form>
      </Card>
    </div>
  </div>;
}
