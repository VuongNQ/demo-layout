import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, App as AntdApp, Button, Drawer, Form, Result, Skeleton, Space, Typography } from 'antd';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { PromotionTypeForm, type PromotionTypeFormValues } from './PromotionTypeForm';
import {
  useCreatePromotionTypeMutation,
  usePromotionTypeDetailQuery,
  useUpdatePromotionTypeMutation
} from '@/features/promotion-types/promotion-types.queries.hook';

const EMPTY_INITIAL_VALUES: PromotionTypeFormValues = { name: '', code: '', status: 'active' };

function getFormValues(item: { name: string; code: string; status: PromotionTypeFormValues['status'] }): PromotionTypeFormValues {
  return { name: item.name, code: item.code, status: item.status };
}

// Matches the real repo's "view/edit drawer" shape for promotion-type —
// no delete action, status is toggled from the list (see PromotionTypesListPage).
export function PromotionTypeDrawerRoute() {
  const { message, modal } = AntdApp.useApp();
  const { t } = useTranslation('chatgpt');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = id === undefined;
  const { data: item, isLoading, isError, refetch } = usePromotionTypeDetailQuery(id);
  const createMutation = useCreatePromotionTypeMutation();
  const updateMutation = useUpdatePromotionTypeMutation();
  const [form] = Form.useForm<PromotionTypeFormValues>();
  const [isDirty, setIsDirty] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [initializedKey, setInitializedKey] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const allowSaveNavigationRef = useRef(false);
  const baselineRef = useRef<PromotionTypeFormValues>(EMPTY_INITIAL_VALUES);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const recordKey = isCreate ? 'create' : `edit:${id ?? ''}`;
  const listUrl = `${chatgptPath('promotionTypes')}${location.search}${location.hash}`;

  useLayoutEffect(() => {
    if (initializedKey === recordKey) return;
    if (isCreate) {
      baselineRef.current = { ...EMPTY_INITIAL_VALUES };
      form.resetFields();
      form.setFieldsValue(EMPTY_INITIAL_VALUES);
      setFormError(undefined);
      setIsDirty(false);
      setInitializedKey(recordKey);
      return;
    }
    if (!id || item?.id !== id) return;
    baselineRef.current = getFormValues(item);
    form.resetFields();
    form.setFieldsValue(baselineRef.current);
    setFormError(undefined);
    setIsDirty(false);
    setInitializedKey(recordKey);
  }, [form, id, initializedKey, isCreate, item, recordKey]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const locationChanges = currentLocation.pathname !== nextLocation.pathname
      || currentLocation.search !== nextLocation.search
      || currentLocation.hash !== nextLocation.hash;
    return isDirty && locationChanges && !allowSaveNavigationRef.current;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (isSaving) {
      blocker.reset?.();
      void message.info(t('pages.promotionType.saveInProgress'));
      return;
    }
    const confirmation = modal.confirm({
      title: t('pages.promotionType.unsavedTitle'),
      content: t('pages.promotionType.unsavedDescription'),
      okText: t('pages.promotionType.discard'),
      cancelText: t('pages.promotionType.keepEditing'),
      onOk: () => {
        form.resetFields();
        form.setFieldsValue(baselineRef.current);
        setIsDirty(false);
        blocker.proceed?.();
      },
      onCancel: () => blocker.reset?.()
    });
    return () => confirmation.destroy();
  }, [blocker.location?.key, blocker.state, isSaving, modal, message, t]);

  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const drawerReady = initializedKey === recordKey
      || (!isCreate && !isLoading && (isError || !item || item.id !== id));
    if (!drawerReady) return;
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [id, initializedKey, isCreate, isError, isLoading, item, recordKey]);

  function handleClose() {
    if (!isSaving) navigate(listUrl);
  }

  async function handleSave() {
    if (isSaving || (!isCreate && (!id || item?.id !== id))) return;
    setFormError(undefined);
    let values: PromotionTypeFormValues;
    try {
      values = await form.validateFields();
    } catch (error) {
      const firstError = (error as { errorFields?: Array<{ name: (string | number)[] }> })?.errorFields?.[0];
      if (firstError) {
        form.scrollToField(firstError.name);
        window.requestAnimationFrame(() => form.getFieldInstance(firstError.name)?.focus?.());
      }
      setFormError(t('pages.promotionType.validationFailed'));
      return;
    }

    try {
      if (isCreate) await createMutation.mutateAsync(values);
      else if (id) await updateMutation.mutateAsync({ id, patch: values });
      baselineRef.current = { ...values };
      setIsDirty(false);
      allowSaveNavigationRef.current = true;
      message.success(t('pages.promotionType.saved'));
      navigate(listUrl);
    } catch {
      setFormError(t('pages.promotionType.saveFailed'));
    }
  }

  const title = isCreate
    ? t('pages.promotionType.add')
    : item?.id === id
      ? t('pages.promotionType.configure', { name: item.name })
      : t('pages.promotionType.editById', { id: id ?? '' });

  return (
    <Drawer
      open
      autoFocus
      keyboard={!isSaving}
      maskClosable={!isSaving}
      closable={!isSaving}
      aria-labelledby="promotion-type-quick-edit-title"
      title={<h2 id="promotion-type-quick-edit-title" ref={headingRef} tabIndex={-1}>{title}</h2>}
      width="min(480px, 100vw)"
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button disabled={isSaving} onClick={handleClose}>{t('pages.promotionType.cancel')}</Button>
          <Button type="primary" loading={isSaving} disabled={isLoading || isError || (!isCreate && !item)} onClick={() => void handleSave()}>
            {isCreate ? t('pages.promotionType.create') : t('pages.promotionType.saveChanges')}
          </Button>
        </Space>
      }
    >
      {formError && <Alert type="error" showIcon role="alert" message={formError} style={{ marginBottom: 16 }} />}
      {isDirty && <Typography.Text type="warning" role="status" aria-live="polite">{t('pages.promotionType.unsavedIndicator')}</Typography.Text>}
      {!isCreate && item?.id === id && <Typography.Text type="secondary">{t('pages.promotionType.recordId', { id: item.id })}</Typography.Text>}
      <Typography.Paragraph type="secondary">{t('pages.promotionType.mechanismNote')}</Typography.Paragraph>
      {isCreate ? (
        initializedKey !== recordKey
          ? <Skeleton active />
          : <PromotionTypeForm form={form} disabled={isSaving} onValuesChange={() => { setIsDirty(form.isFieldsTouched()); setFormError(undefined); }} />
      ) : isLoading ? (
        <Skeleton active />
      ) : isError ? (
        <Result status="error" title={t('pages.promotionType.loadFailed')} extra={<Space><Button onClick={() => void refetch()}>{t('pages.promotionType.retry')}</Button><Button onClick={handleClose}>{t('pages.promotionType.returnToList')}</Button></Space>} />
      ) : !item || item.id !== id ? (
        <Result status="404" title={t('pages.promotionType.notFoundTitle')} subTitle={t('pages.promotionType.notFoundDescription', { id: id ?? '' })} extra={<Button onClick={handleClose}>{t('pages.promotionType.returnToList')}</Button>} />
      ) : initializedKey !== recordKey ? (
        <Skeleton active />
      ) : (
        <PromotionTypeForm form={form} disabled={isSaving} onValuesChange={() => { setIsDirty(form.isFieldsTouched()); setFormError(undefined); }} />
      )}
    </Drawer>
  );
}
