import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Result, Skeleton, Space, Typography, message } from 'antd';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import { emptyPromotion } from '@/features/promotions/demo-promotions-data';
import { PromotionForm } from './PromotionForm';
import type { PromotionFormValues } from '@/features/promotions/promotion-form.utils';
import { arePromotionFormValuesEqual, copyPromotionFormValues, getPromotionFormValues } from '@/features/promotions/promotion-form.utils';
import { useCreatePromotionMutation, usePromotionDetailQuery, useUpdatePromotionMutation } from '@/features/promotions/promotions.queries.hook';
import styles from './PromotionFullPage.module.scss';

type Props = { mode: 'create' | 'edit' };
type PromotionField = keyof PromotionFormValues;

const PROMOTION_FIELD_NAMES = new Set<PromotionField>([
  'name', 'code', 'offerType', 'startDate', 'endDate', 'status', 'assignedProducts'
]);

function PromotionFullPageSkeleton({ title }: { title: string }) {
  return (
    <div className={styles.page}>
      <Typography.Title level={1}>{title}</Typography.Title>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
}

export function PromotionFullPage({ mode }: Props) {
  const { t } = useTranslation('chatgpt');
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreate = mode === 'create';
  const { data: item, isLoading, isError, refetch } = usePromotionDetailQuery(isCreate ? undefined : id);
  const createMutation = useCreatePromotionMutation();
  const updateMutation = useUpdatePromotionMutation();
  const [form] = Form.useForm<PromotionFormValues>();
  const [initializedKey, setInitializedKey] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [validationFields, setValidationFields] = useState<PromotionField[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const baselineRef = useRef<PromotionFormValues>(emptyPromotion());
  const allowSaveNavigationRef = useRef(false);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const recordKey = isCreate ? 'create' : `edit:${id ?? ''}`;
  const listUrl = `${chatgptPath('promotions')}${location.search}${location.hash}`;
  const title = isCreate
    ? t('pages.promotion.createTitle')
    : item && item.id === id
      ? t('pages.promotion.title', { name: item.name })
      : t('pages.promotion.editById', { id: id ?? '' });

  useLayoutEffect(() => {
    if (initializedKey === recordKey) return;
    if (isCreate) {
      const initialValues = emptyPromotion();
      baselineRef.current = copyPromotionFormValues(initialValues);
      form.resetFields();
      form.setFieldsValue(initialValues);
      setIsDirty(false);
      setFormError(undefined);
      setValidationFields([]);
      setInitializedKey(recordKey);
      return;
    }
    if (!id || item?.id !== id) return;
    const initialValues = getPromotionFormValues(item);
    baselineRef.current = copyPromotionFormValues(initialValues);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setIsDirty(false);
    setFormError(undefined);
    setValidationFields([]);
    setInitializedKey(recordKey);
  }, [form, id, initializedKey, isCreate, item?.id, recordKey]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const locationChanges = currentLocation.pathname !== nextLocation.pathname
      || currentLocation.search !== nextLocation.search
      || currentLocation.hash !== nextLocation.hash;
    return locationChanges && (isDirty || isSaving) && !allowSaveNavigationRef.current;
  });

  useEffect(() => {
    if (!isDirty && !isSaving) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty, isSaving]);

  const pageReady = initializedKey === recordKey;
  useEffect(() => {
    const notFoundOrFailed = !isCreate && !isLoading && (isError || !item || item.id !== id);
    if (!pageReady && !notFoundOrFailed) return;
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [id, isCreate, isError, isLoading, item?.id, pageReady]);

  function getCurrentInvalidFields(): PromotionField[] {
    const names = form.getFieldsError()
      .filter((field) => field.errors.length > 0)
      .map((field) => field.name[0])
      .filter((name): name is PromotionField => typeof name === 'string' && PROMOTION_FIELD_NAMES.has(name as PromotionField));
    return [...new Set(names)];
  }

  function focusField(name: PromotionField) {
    form.scrollToField(name);
    window.requestAnimationFrame(() => form.getFieldInstance(name)?.focus?.());
  }

  function handleValuesChange() {
    const currentValues = form.getFieldsValue(true) as PromotionFormValues;
    setIsDirty(!arePromotionFormValuesEqual(currentValues, baselineRef.current));
    setFormError(undefined);
    window.requestAnimationFrame(() => setValidationFields(getCurrentInvalidFields()));
  }

  function handleNavigationStay() {
    blocker.reset?.();
  }

  function handleNavigationDiscard() {
    form.resetFields();
    form.setFieldsValue(copyPromotionFormValues(baselineRef.current));
    setIsDirty(false);
    setFormError(undefined);
    setValidationFields([]);
    blocker.proceed?.();
  }

  function handleDiscard() {
    form.resetFields();
    form.setFieldsValue(copyPromotionFormValues(baselineRef.current));
    setIsDirty(false);
    setFormError(undefined);
    setValidationFields([]);
  }

  function visitSection(id: string) {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(() => section?.querySelector<HTMLElement>('h2')?.focus());
  }

  async function handleSave() {
    if (!pageReady || isSaving || (!isCreate && (!id || item?.id !== id))) return;
    setFormError(undefined);
    let values: PromotionFormValues;
    try {
      values = await form.validateFields();
      setValidationFields([]);
    } catch (error) {
      const invalidFields = getCurrentInvalidFields();
      setValidationFields(invalidFields);
      setFormError(invalidFields.length > 0 ? undefined : t('pages.promotion.validationSummary'));
      if (invalidFields[0]) focusField(invalidFields[0]);
      else {
        const firstError = (error as { errorFields?: Array<{ name: (string | number)[] }> })?.errorFields?.[0];
        if (firstError) {
          form.scrollToField(firstError.name);
          window.requestAnimationFrame(() => form.getFieldInstance(firstError.name)?.focus?.());
        }
      }
      return;
    }

    try {
      let saved: PromotionFormValues;
      if (isCreate) {
        const created = await createMutation.mutateAsync(values);
        saved = getPromotionFormValues(created);
      } else if (id) {
        const updated = await updateMutation.mutateAsync({ id, patch: values });
        saved = getPromotionFormValues(updated);
      } else {
        return;
      }

      baselineRef.current = copyPromotionFormValues(saved);
      form.setFieldsValue(copyPromotionFormValues(saved));
      setIsDirty(false);
      setValidationFields([]);
      setFormError(undefined);
      if (blocker.state === 'blocked') blocker.reset?.();

      message.success(t(isCreate ? 'pages.promotion.created' : 'pages.promotion.saved'));
      if (isCreate) {
        allowSaveNavigationRef.current = true;
        navigate(listUrl);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setFormError(t('pages.promotion.saveFailed', { detail }));
    }
  }

  if (!isCreate && isLoading) return <PromotionFullPageSkeleton title={title} />;
  if (!isCreate && isError && (!item || item.id !== id)) {
    return (
      <div className={styles.page}>
        <Typography.Title level={1} ref={headingRef} tabIndex={-1}>{title}</Typography.Title>
        <Result
          status="error"
          title={t('pages.promotion.loadFailed')}
          extra={<Space wrap><Button onClick={() => void refetch()}>{t('pages.promotion.retry')}</Button><Button onClick={() => navigate(listUrl)}>{t('pages.promotion.back')}</Button></Space>}
        />
      </div>
    );
  }
  if (!isCreate && (!item || item.id !== id)) {
    return (
      <div className={styles.page}>
        <Typography.Title level={1} ref={headingRef} tabIndex={-1}>{title}</Typography.Title>
        <Result
          status="404"
          title={t('pages.promotion.notFoundTitle')}
          subTitle={t('pages.promotion.notFoundDescription', { id: id ?? '' })}
          extra={<Button onClick={() => navigate(listUrl)}>{t('pages.promotion.back')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {!isCreate && isDirty && (
        <>
          <ContextualSaveBar
            visible
            saving={isSaving}
            label={t('pages.promotion.dirtyLabel', { name: item?.name ?? '' })}
            onSave={() => void handleSave()}
            onDiscard={handleDiscard}
          />
          <ContextualSaveBarSpacer visible />
        </>
      )}

      <header className={styles.header}>
        <Button type="link" className={styles.backButton} onClick={() => navigate(listUrl)}>
          {t('pages.promotion.back')}
        </Button>
        <Typography.Title level={1} ref={headingRef} tabIndex={-1} className={styles.title}>
          {title}
        </Typography.Title>
        {isCreate ? (
          <Typography.Text type="secondary">{t('pages.promotion.createIdentity')}</Typography.Text>
        ) : item ? (
          <Typography.Text type="secondary">{t('pages.promotion.recordId', { id: item.id })}</Typography.Text>
        ) : null}
      </header>

      <nav className={styles.sectionNavigation} aria-label={t('pages.promotion.sectionNavigation')}>
        <Button type="link" onClick={() => visitSection('promotion-details')}>{t('pages.promotion.sectionDetails')}</Button>
        <Button type="link" onClick={() => visitSection('promotion-schedule')}>{t('pages.promotion.sectionSchedule')}</Button>
        <Button type="link" onClick={() => visitSection('promotion-products')}>{t('pages.promotion.sectionProducts')}</Button>
      </nav>

      {formError && (
        <Alert type="error" showIcon role="alert" message={formError} style={{ marginBottom: 16 }} />
      )}
      {validationFields.length > 0 && (
        <Alert
          type="error"
          showIcon
          role="alert"
          className={styles.validationSummary}
          message={t('pages.promotion.validationSummary')}
          description={(
            <ul>
              {validationFields.map((field) => (
                <li key={field}>
                  <Button type="link" onClick={() => focusField(field)} aria-label={t('pages.promotion.goToField', { field: t(`pages.promotion.${field}`) })}>
                    {t(`pages.promotion.${field}`)}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          style={{ marginBottom: 16 }}
        />
      )}
      {isSaving && <Typography.Text role="status" aria-live="polite">{t('pages.promotion.saving')}</Typography.Text>}

      {!pageReady ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <PromotionForm form={form} onValuesChange={handleValuesChange} disabled={isSaving} />
      )}

      {isCreate && (
        <Space wrap className={styles.createActions}>
          <Button disabled={isSaving} onClick={() => navigate(listUrl)}>{t('pages.promotion.cancel')}</Button>
          <Button type="primary" loading={isSaving} disabled={!pageReady} onClick={() => void handleSave()}>
            {t('pages.promotion.create')}
          </Button>
        </Space>
      )}

      <Modal
        open={blocker.state === 'blocked'}
        title={isSaving ? t('pages.promotion.saveInProgressTitle') : t('pages.promotion.unsavedTitle')}
        onCancel={handleNavigationStay}
        onOk={isSaving ? handleNavigationStay : handleNavigationDiscard}
        okText={isSaving ? t('pages.promotion.stay') : t('pages.promotion.discard')}
        cancelText={t('pages.promotion.stay')}
        closable={!isSaving}
        keyboard={!isSaving}
        maskClosable={!isSaving}
        cancelButtonProps={{ style: isSaving ? { display: 'none' } : undefined }}
      >
        {isSaving ? t('pages.promotion.saveInProgressDescription') : t('pages.promotion.unsavedDescription')}
      </Modal>
    </div>
  );
}
