import { useState } from 'react';
import { Anchor, Button, Card, Col, Row, Space, Typography, message, Form } from 'antd';
import { OfferTypeForm, type OfferTypeFormValues } from '@/features/offer-type/OfferTypeForm';
import { OfferTypeFormSections } from './OfferTypeFormSections';

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
  const [form] = Form.useForm<OfferTypeFormValues>();

  async function handleSave() {
    try {
      await form.validateFields();
      message.success('Hợp lệ — không có gì để chứng minh ở đây, hãy để lỗi 45 ngày nguyên vẹn.');
    } catch {
      // This is exactly what the real repo's rule in 05-form.md warns
      // about: Zod/AntD rule rejection must be surfaced explicitly. Here
      // we surface only a generic count — deliberately not pointing at
      // which tab, to reproduce the bug rather than quietly fix it.
      message.error('Lưu thất bại: còn lỗi validation. (Không rõ ở tab nào — thử tìm xem.)');
    }
  }

  return (
    <Card title="A — Tabs" size="small">
      <OfferTypeForm form={form} initialValues={INVALID_INITIAL_VALUES} />
      <Button type="primary" onClick={() => void handleSave()} style={{ marginTop: 16 }}>
        Lưu
      </Button>
    </Card>
  );
}

function AnchorSide() {
  const [form] = Form.useForm<OfferTypeFormValues>();

  async function handleSave() {
    try {
      await form.validateFields();
      message.success('Hợp lệ.');
    } catch {
      // No special handling needed here beyond what Form already does —
      // scrollToFirstError (set on OfferTypeFormSections) moves the view
      // to the failing field automatically because it's genuinely in the
      // DOM and visible, not hidden behind an inactive tab.
      message.error('Lưu thất bại — xem trường được cuộn tới bên dưới.');
    }
  }

  return (
    <Row gutter={16}>
      <Col span={18}>
        <Card title="B — Section + Anchor" size="small">
          <OfferTypeFormSections form={form} initialValues={INVALID_INITIAL_VALUES} />
          <Button type="primary" onClick={() => void handleSave()} style={{ marginTop: 16 }}>
            Lưu
          </Button>
        </Card>
      </Col>
      <Col span={6}>
        <Anchor
          items={[
            { key: 'general', href: '#section-general', title: 'Thông tin chung' },
            { key: 'eligibility', href: '#section-eligibility', title: 'Điều kiện áp dụng' },
            { key: 'notification', href: '#section-notification', title: 'Thông báo' }
          ]}
        />
      </Col>
    </Row>
  );
}

export function TabsVsAnchorExperimentPage() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <Typography.Title level={4}>Thí nghiệm 3 — Lỗi validation ẩn trong tab vs section + Anchor</Typography.Title>
      <Typography.Paragraph>
        Cả hai form bên dưới được điền sẵn một lỗi giống nhau: "Số ngày nhắc trước" = 45, vượt giới hạn 30, nằm ở
        nhóm trường CUỐI CÙNG (Thông báo). Nhấn "Lưu" ở từng bên mà KHÔNG tự lướt tới tab/mục đó trước — xem khác
        biệt thật.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setResetKey((k) => k + 1)}>Reset cả hai form</Button>
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
