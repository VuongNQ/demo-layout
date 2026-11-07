import { useState } from 'react';
import { Anchor, Button, Card, Col, Row, Space, Typography, message, Form } from 'antd';
import { OfferTypeForm, type OfferTypeFormValues } from '@/features/offer-type/OfferTypeForm';
import { OfferTypeFormSections } from './OfferTypeFormSections';
import { useTranslation } from 'react-i18next';

// Prefilled with an invalid value (45 > the 30-day limit) on a field that
// sits on the LAST tab / LAST section, so both sides fail validation in
// the same place when "Lưu" is pressed without touching anything.
const INVALID_INITIAL_VALUES: OfferTypeFormValues = {
  name: 'Ưu đãi demo (đã có lỗi ẩn)',
  status: 'draft',
  general: {
    description: '',
    code: 'DEMO-001',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
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
    reminderDaysBefore: 45, // invalid: the rule rejects > 30
    ownerEmail: '',
    escalationEmail: '',
    tags: [],
    internalNote: '',
    lastReviewedBy: '',
    lastReviewedAt: '',
    autoDisableOnBudgetExceeded: false
  }
};

// NEEDS-TEAM-DECISION: nothing numbered for this one specifically in the
// 8-item list, but it feeds #1 (Drawer-vs-Page threshold) — a long form
// with grouped fields needs a layout where validation errors are
// findable, whichever substrate (Drawer or page) it ends up in.
function TabsSide() {
  const { t } = useTranslation('claude');
  const [form] = Form.useForm<OfferTypeFormValues>();

  async function handleSave() {
    try {
      await form.validateFields();
      message.success(t('pages.experiments.tabValid'));
    } catch {
      // This is exactly what the real repo's rule in 05-form.md warns
      // about: Zod/AntD rule rejection must be surfaced explicitly. Here
      // we surface only a generic count — deliberately not pointing at
      // which tab, to reproduce the bug rather than quietly fix it.
      message.error(t('pages.experiments.genericError'));
    }
  }

  return (
    <Card title={t('pages.experiments.tabs')} size="small">
      <OfferTypeForm form={form} initialValues={INVALID_INITIAL_VALUES} />
      <Button type="primary" onClick={() => void handleSave()} style={{ marginTop: 16 }}>
        {t('pages.experiments.save')}
      </Button>
    </Card>
  );
}

function AnchorSide() {
  const { t } = useTranslation('claude');
  const [form] = Form.useForm<OfferTypeFormValues>();

  async function handleSave() {
    try {
      await form.validateFields();
      message.success(t('pages.experiments.valid'));
    } catch {
      // No special handling needed here beyond what Form already does —
      // scrollToFirstError (set on OfferTypeFormSections) moves the view
      // to the failing field automatically because it's genuinely in the
      // DOM and visible, not hidden behind an inactive tab.
      message.error(t('pages.experiments.anchorError'));
    }
  }

  return (
    <Row gutter={16}>
      <Col span={18}>
        <Card title={t('pages.experiments.anchor')} size="small">
          <OfferTypeFormSections form={form} initialValues={INVALID_INITIAL_VALUES} />
          <Button type="primary" onClick={() => void handleSave()} style={{ marginTop: 16 }}>
            {t('pages.experiments.save')}
          </Button>
        </Card>
      </Col>
      <Col span={6}>
        <Anchor
          items={[
            { key: 'general', href: '#section-general', title: t('pages.experiments.general') },
            { key: 'eligibility', href: '#section-eligibility', title: t('pages.experiments.eligibility') },
            { key: 'notification', href: '#section-notification', title: t('pages.experiments.notifications') }
          ]}
        />
      </Col>
    </Row>
  );
}

export function TabsVsAnchorExperimentPage() {
  const { t } = useTranslation('claude');
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <Typography.Title level={4}>{t('pages.experiments.tabsTitle')}</Typography.Title>
      <Typography.Paragraph>
        {t('pages.experiments.tabsIntro')}
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setResetKey((k) => k + 1)}>{t('pages.experiments.reset')}</Button>
      </Space>
      <Row gutter={16} key={resetKey}>
        <Col span={12}>
          <TabsSide />
        </Col>
        <Col span={12}>
          <AnchorSide />
        </Col>
      </Row>
    </>
  );
}
