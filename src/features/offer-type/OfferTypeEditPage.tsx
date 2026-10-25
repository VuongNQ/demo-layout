import { Form, Button, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { OfferTypeForm, type OfferTypeFormValues } from './OfferTypeForm';
import { useOfferTypeDetailQuery, useUpdateOfferTypeMutation } from './offer-type.queries.hook';
import styles from './OfferTypeEditPage.module.scss';

// Substrate B: a full page with a fixed header/footer action bar,
// standing in for the real repo's FormLayout/FormRef shell. The form
// body (OfferTypeForm) is the exact same component used inside the
// Drawer in substrate A — only the shell around it differs, which is the
// point: the form itself must not know which substrate it is in.
export function OfferTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: offerType, isLoading } = useOfferTypeDetailQuery(id);
  const updateMutation = useUpdateOfferTypeMutation();
  const [form] = Form.useForm<OfferTypeFormValues>();

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    navigate('/offer-types');
  }

  if (isLoading || !offerType) {
    return <Skeleton active />;
  }

  return (
    <div className={styles.page}>
      <Typography.Title level={4}>Cài đặt: {offerType.name}</Typography.Title>
      <div className={styles.body}>
        <OfferTypeForm form={form} initialValues={offerType} />
      </div>
      <div className={styles.footer}>
        <Button onClick={() => navigate('/offer-types')}>Hủy</Button>
        <Button type="primary" loading={updateMutation.isPending} onClick={() => void handleSave()}>
          Lưu
        </Button>
      </div>
    </div>
  );
}
