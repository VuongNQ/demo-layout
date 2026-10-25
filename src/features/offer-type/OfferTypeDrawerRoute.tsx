import { Drawer, Form, Button, Space, Skeleton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { OfferTypeForm, type OfferTypeFormValues } from './OfferTypeForm';
import {
  useCreateOfferTypeMutation,
  useOfferTypeDetailQuery,
  useUpdateOfferTypeMutation
} from './offer-type.queries.hook';

const EMPTY_INITIAL_VALUES: OfferTypeFormValues = {
  name: '',
  status: 'draft',
  general: {
    description: '',
    code: '',
    effectiveFrom: '',
    effectiveTo: '',
    maxUsagePerCustomer: 1,
    maxUsageTotal: 1000,
    discountPercent: 10,
    discountAmount: 0,
    currency: 'VND',
    minOrderAmount: 0
  },
  eligibility: {
    customerSegments: [],
    productLines: [],
    channels: [],
    requiresApproval: false,
    combinable: true,
    firstTimeOnly: false,
    regionCodes: [],
    minTenureMonths: 0,
    maxRedemptions: 10,
    blacklistedProductIds: []
  },
  notification: {
    notifyOnExpiry: false,
    notifyChannel: 'none',
    reminderDaysBefore: 7,
    ownerEmail: '',
    escalationEmail: '',
    tags: [],
    internalNote: '',
    lastReviewedBy: '',
    lastReviewedAt: '',
    autoDisableOnBudgetExceeded: false
  }
};

// Substrate A. The Drawer's open/close state is bound to the route
// (/offer-types/:id and /offer-types/create are child routes of
// /offer-types), so closing it is a real navigation — closing via the X
// button, the mask, or Escape all call AntD's onClose, which this routes
// through `navigate(-1)`. Experiment 1 adds the unsaved-changes guard on
// top of this to see whether it actually fires on each of those paths.
export function OfferTypeDrawerRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === undefined;
  const { data: offerType, isLoading } = useOfferTypeDetailQuery(id);
  const createMutation = useCreateOfferTypeMutation();
  const updateMutation = useUpdateOfferTypeMutation();
  const [form] = Form.useForm<OfferTypeFormValues>();

  function handleClose() {
    navigate('/offer-types');
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
      title={isCreate ? 'Tạo loại ưu đãi' : `Cài đặt: ${offerType?.name ?? ''}`}
      width={480}
      onClose={handleClose}
      destroyOnClose
      extra={
        !isCreate && (
          <Button type="link" onClick={() => navigate(`/offer-types/${id}/edit`)}>
            Mở toàn trang
          </Button>
        )
      }
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
        <OfferTypeForm form={form} initialValues={EMPTY_INITIAL_VALUES} />
      ) : isLoading || !offerType ? (
        <Skeleton active />
      ) : (
        <OfferTypeForm form={form} initialValues={offerType} />
      )}
    </Drawer>
  );
}
