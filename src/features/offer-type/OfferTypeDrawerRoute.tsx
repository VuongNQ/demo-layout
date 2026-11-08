import { claudePath } from '@/claude/routes/route-meta';
import { Drawer, Form, Button, Space, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
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
// (/claude/offer-types/:id and /claude/offer-types/create are child routes of
// /claude/offer-types), so closing it is a real navigation — closing via the X
// button, the mask, or Escape all call AntD's onClose, which returns to the list.
// Experiment 1 adds the unsaved-changes guard on
// top of this to see whether it actually fires on each of those paths.
export function OfferTypeDrawerRoute() {
  const { t } = useTranslation('claude');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === undefined;
  const { data: offerType, isLoading } = useOfferTypeDetailQuery(id);
  const createMutation = useCreateOfferTypeMutation();
  const updateMutation = useUpdateOfferTypeMutation();
  const [form] = Form.useForm<OfferTypeFormValues>();

  function handleClose() {
    navigate(claudePath('offerTypes'));
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
      title={isCreate ? t('offer.create') : t('offer.settings', { name: offerType?.name ?? '' })}
      width={480}
      onClose={handleClose}
      destroyOnClose
      extra={
        !isCreate && (
          <Button type="link" onClick={() => navigate(claudePath('offerTypeEdit', { id }))}>
            {t('offer.fullPage')}
          </Button>
        )
      }
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>{t('offer.cancel')}</Button>
          <Button type="primary" loading={createMutation.isPending || updateMutation.isPending} onClick={() => void handleSave()}>
            {t('offer.save')}
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
