import { Alert, Button, Drawer, Form, Input, Modal, Space, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { useBlocker, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DraftRecord, UnsavedChangesContext } from './UnsavedChangesPage';
import styles from './UnsavedChangesDrawerRoute.module.scss';

type DraftValues = Pick<DraftRecord, 'name' | 'note'>;
const toValues = (record: DraftRecord): DraftValues => ({ name: record.name, note: record.note });
const sameValues = (left: DraftValues | undefined, right: DraftValues | null) =>
  Boolean(left && right && left.name === right.name && left.note === right.note);

export function UnsavedChangesDrawerRoute() {
  const { t } = useTranslation('chatgpt');
  const { id = '' } = useParams();
  const { records, setRecords, setNotice } = useOutletContext<UnsavedChangesContext>();
  const record = records.find((item) => item.id === id);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<DraftValues>();
  const baselineRef = useRef<DraftValues | null>(null);
  const loadedIdRef = useRef('');
  const submitLockRef = useRef(false);
  const values = Form.useWatch([], form) as DraftValues | undefined;
  const isDirty = loadedIdRef.current === id && baselineRef.current !== null && !sameValues(values, baselineRef.current);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const destinationChanged = currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search || currentLocation.hash !== nextLocation.hash;
    return isDirty && !submitLockRef.current && destinationChanged;
  });

  useEffect(() => {
    if (!record || loadedIdRef.current === id) return;
    const baseline = toValues(record);
    baselineRef.current = baseline;
    loadedIdRef.current = id;
    form.setFieldsValue(baseline);
    form.setFields([{ name: 'name', errors: [] }, { name: 'note', errors: [] }]);
  }, [form, id, record]);

  useEffect(() => {
    if (!isDirty) return;
    const preventUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isDirty]);

  const listDestination = { pathname: '/chatgpt/experiments/unsaved-changes', search: location.search, hash: location.hash };

  function requestClose() {
    navigate(listDestination);
  }

  function discardAndProceed() {
    if (record) {
      const baseline = baselineRef.current ?? toValues(record);
      form.setFieldsValue(baseline);
      baselineRef.current = baseline;
    }
    blocker.proceed?.();
  }

  function stay() {
    blocker.reset?.();
  }

  function save(valuesToSave: DraftValues) {
    if (!record || submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const updated = { ...record, ...valuesToSave };
      setRecords((current) => current.map((item) => item.id === id ? updated : item));
      baselineRef.current = valuesToSave;
      form.setFieldsValue(valuesToSave);
      setNotice(t('pages.scenario2.saved', { name: updated.name }));
      navigate(listDestination);
    } finally {
      submitLockRef.current = false;
    }
  }

  return (
    <>
      <Drawer
        open
        title={<span id="scenario2-drawer-title">{record ? t('pages.scenario2.drawerTitle') : t('pages.scenario2.notFound')}</span>}
        aria-labelledby="scenario2-drawer-title"
        width={520}
        onClose={requestClose}
        extra={<Button aria-label={t('pages.scenario2.close')} onClick={requestClose}>{t('pages.scenario2.close')}</Button>}
        footer={record && (
          <Space className={styles.footer} wrap>
            <Typography.Text aria-live="polite" type={isDirty ? 'warning' : 'secondary'}>{isDirty ? t('pages.scenario2.dirty') : t('pages.scenario2.pristine')}</Typography.Text>
            <Button onClick={requestClose}>{t('pages.scenario2.cancel')}</Button>
            <Button type="primary" htmlType="submit" form="scenario2-edit-form" disabled={!isDirty}>{t('pages.scenario2.save')}</Button>
          </Space>
        )}
      >
        {record ? (
          <Form id="scenario2-edit-form" form={form} layout="vertical" initialValues={toValues(record)} onFinish={save}>
            <Form.Item name="name" label={t('pages.scenario2.name')} rules={[{ required: true, message: t('pages.scenario2.nameRequired') }]}>
              <Input autoFocus />
            </Form.Item>
            <Form.Item name="note" label={t('pages.scenario2.note')} rules={[{ required: true, message: t('pages.scenario2.noteRequired') }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Typography.Paragraph type="secondary">{t('pages.scenario2.localOnly')}</Typography.Paragraph>
          </Form>
        ) : (
          <Alert type="warning" showIcon message={t('pages.scenario2.notFound')} description={t('pages.scenario2.unknownDescription', { id })} action={<Button onClick={requestClose}>{t('pages.scenario2.returnToList')}</Button>} />
        )}
      </Drawer>
      <Modal
        open={blocker.state === 'blocked'}
        title={t('pages.scenario2.unsavedTitle')}
        onCancel={stay}
        onOk={discardAndProceed}
        okText={t('pages.scenario2.discard')}
        cancelText={t('pages.scenario2.stay')}
        closable={false}
        maskClosable={false}
        keyboard={false}
      >
        <Typography.Paragraph>{t('pages.scenario2.unsavedDescription')}</Typography.Paragraph>
      </Modal>
    </>
  );
}
