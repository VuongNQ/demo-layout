import { Form, Typography, message, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PromotionForm, type PromotionFormValues } from './PromotionForm';
import { emptyPromotion } from './demo-promotions-data';
import { useCreatePromotionMutation } from './promotions.queries.hook';

export function PromotionCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePromotionMutation();
  const [form] = Form.useForm<PromotionFormValues>();

  async function handleCreate() {
    const values = await form.validateFields();
    await createMutation.mutateAsync(values);
    message.success('Đã tạo khuyến mãi.');
    navigate('/promotions');
  }

  return (
    <>
      <Space align="center" style={{ marginBottom: 8 }}>
        <Button type="link" onClick={() => navigate('/promotions')}>
          ← Quay lại danh sách
        </Button>
      </Space>
      <Typography.Title level={4}>Thêm khuyến mãi</Typography.Title>
      <PromotionForm form={form} initialValues={emptyPromotion()} />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => navigate('/promotions')}>Hủy</Button>
        <Button type="primary" loading={createMutation.isPending} onClick={() => void handleCreate()}>
          Tạo mới
        </Button>
      </Space>
    </>
  );
}
