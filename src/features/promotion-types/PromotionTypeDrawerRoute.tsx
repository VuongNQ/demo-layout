import { Drawer, Form, Button, Space, Skeleton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PromotionTypeForm, type PromotionTypeFormValues } from './PromotionTypeForm';
import {
  useCreatePromotionTypeMutation,
  usePromotionTypeDetailQuery,
  useUpdatePromotionTypeMutation
} from './promotion-types.queries.hook';

const EMPTY_INITIAL_VALUES: PromotionTypeFormValues = { name: '', code: '', status: 'active' };

// Matches the real repo's "view/edit drawer" shape for promotion-type —
// no delete action, status is toggled from the list (see PromotionTypesListPage).
export function PromotionTypeDrawerRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === undefined;
  const { data: item, isLoading } = usePromotionTypeDetailQuery(id);
  const createMutation = useCreatePromotionTypeMutation();
  const updateMutation = useUpdatePromotionTypeMutation();
  const [form] = Form.useForm<PromotionTypeFormValues>();

  function handleClose() {
    navigate('/promotion-types');
  }

  async function handleSave() {
    const values = await form.validateFields();
    if (isCreate) {
      await createMutation.mutateAsync(values);
    } else if (id) {
      await updateMutation.mutateAsync({ id, patch: values });
    }
    handleClose();
  }

  return (
    <Drawer
      open
      title={isCreate ? 'Thêm loại khuyến mãi' : `Cài đặt: ${item?.name ?? ''}`}
      width={420}
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="primary" loading={createMutation.isPending || updateMutation.isPending} onClick={() => void handleSave()}>
            Lưu
          </Button>
        </Space>
      }
    >
      {isCreate ? (
        <PromotionTypeForm form={form} initialValues={EMPTY_INITIAL_VALUES} />
      ) : isLoading || !item ? (
        <Skeleton active />
      ) : (
        <PromotionTypeForm form={form} initialValues={item} />
      )}
    </Drawer>
  );
}
