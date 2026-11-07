import { claudePath } from '@/claude/routes/route-meta';
import { Drawer, Form, Button, Space, Skeleton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackgroundLockForm, type BackgroundLockFormValues } from './BackgroundLockForm';
import { useBackgroundLockDetailQuery, useUpdateBackgroundLockMutation } from './background-lock.queries.hook';

// Substrate A only — no full-page variant for this screen. A 6-field
// settings form over a short, unpaginated list is the case where the
// layout note's "which threshold" question should be easy to answer:
// this one should clearly stay a Drawer.
export function BackgroundLockDrawerRoute() {
  const { t } = useTranslation('claude');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useBackgroundLockDetailQuery(id);
  const updateMutation = useUpdateBackgroundLockMutation();
  const [form] = Form.useForm<BackgroundLockFormValues>();

  function handleClose() {
    navigate(claudePath('backgroundLocks'));
  }

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    handleClose();
  }

  return (
    <Drawer
      open
      title={t('pages.promotionType.configure', { name: item?.name ?? '' })}
      width={420}
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>{t('pages.background.cancel')}</Button>
          <Button type="primary" loading={updateMutation.isPending} onClick={() => void handleSave()}>
            {t('pages.background.save')}
          </Button>
        </Space>
      }
    >
      {isLoading || !item ? <Skeleton active /> : <BackgroundLockForm form={form} initialValues={item} />}
    </Drawer>
  );
}
