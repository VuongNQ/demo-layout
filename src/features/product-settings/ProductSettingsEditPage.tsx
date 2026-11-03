import { useState } from 'react';
import { Form, Skeleton, Typography, message, Button, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductSettingsForm, type ProductSettingsFormValues } from './ProductSettingsForm';
import { useProductSettingsDetailQuery, useUpdateProductSettingsMutation } from './product-settings.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import styles from './ProductSettingsEditPage.module.scss';

// Full page + Shopify-style top save bar, instead of offer-type's fixed
// BOTTOM footer (substrate B there mirrors the real repo's actual
// FormLayout/FormRef bottom-footer shell — see
// [[layout-hiddenformfooter-flag]]-style setFooter pattern). This page
// is the deliberate second data point: the same "long form, full page"
// shape, with the alternative top-bar pattern, so the team compares both
// rather than only ever seeing one.
export function ProductSettingsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useProductSettingsDetailQuery(id);
  const updateMutation = useUpdateProductSettingsMutation();
  const [form] = Form.useForm<ProductSettingsFormValues>();
  const [isDirty, setIsDirty] = useState(false);

  async function handleSave() {
    if (!id) return;
    const values = await form.validateFields();
    await updateMutation.mutateAsync({ id, patch: values });
    setIsDirty(false);
    message.success('Đã lưu.');
  }

  function handleDiscard() {
    form.resetFields();
    setIsDirty(false);
  }

  if (isLoading || !item) {
    return <Skeleton active />;
  }

  return (
    <>
      <ContextualSaveBar
        visible={isDirty}
        saving={updateMutation.isPending}
        label={`Có thay đổi chưa lưu — ${item.name}`}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <div className={styles.page}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Button type="link" disabled={isDirty} onClick={() => navigate('/product-settings')}>
            ← Quay lại danh sách
          </Button>
        </Space>
        <Typography.Title level={4}>Cài đặt sản phẩm: {item.name}</Typography.Title>
        <ProductSettingsForm form={form} initialValues={item} onValuesChange={() => setIsDirty(true)} />
      </div>
    </>
  );
}
