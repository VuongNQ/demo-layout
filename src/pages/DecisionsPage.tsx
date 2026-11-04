import { useState } from 'react';
import { Card, Typography, Input, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';

type DecisionItem = {
  id: string;
  title: string;
  context: string;
  link?: { to: string; label: string };
};

const DECISIONS: DecisionItem[] = [
  {
    id: 'drawer-vs-page-threshold',
    title: '1. Ngưỡng Drawer vs Full-Page',
    context:
      'offer-type (30 trường, 120 item) dùng cả hai nền A/B; background-locks (6 trường, 10 item) chỉ Drawer. Chốt tiêu chí: số trường? có Tabs/nhóm hay không?',
    link: { to: '/offer-types', label: 'Xem offer-types (A/B)' }
  },
  {
    id: 'brand-token',
    title: '2. Giá trị token màu brand thật',
    context:
      'colorPrimary hiện để #1677ff (default AntD 5), chỉ là placeholder. Cần giá trị brand thật và xác định nguồn sự thật duy nhất (ConfigProvider vs custom-ant.scss) trong repo thật.'
  },
  {
    id: 'unsaved-changes-overlay',
    title: '3. Guard unsaved-changes khi đóng overlay',
    context: 'Đóng Drawer bằng Hủy/X/mask/ESC — guard có được hỏi không? Khác nhau giữa state cục bộ và gắn route.',
    link: { to: '/experiments/unsaved-changes', label: 'Chạy thí nghiệm 1' }
  },
  {
    id: 'breadcrumb-no-menu',
    title: '4. Breadcrumb cho route không có menu entry',
    context: 'Route /offer-types/:id/edit không có menu entry — breadcrumb trống, giống ca background-main-lock thật (đổi tên từ theme-lock ngày 2026-10-21, vẫn chưa có menu entry). Có cần xử lý khác đi không?',
    link: { to: '/offer-types', label: 'Xem (mở 1 item rồi "Mở toàn trang")' }
  },
  {
    id: 'global-search',
    title: '5. Global search (Ctrl+K)',
    context: 'Khuyến nghị ban đầu: KHÔNG làm trước go-live — chưa có registry field settings, và guard đã có keyboard fallback. Xác nhận lại.',
  },
  {
    id: 'sidebar-depth',
    title: '6. Sidebar tầng 3',
    context: 'Menu demo hiện có đúng 3 tầng (Sản phẩm > Quản lý ưu đãi > Loại ưu đãi). Có giữ mở sâu vậy hay rút về 2 tầng + tab dọc trong trang cho Settings?'
  },
  {
    id: 'edit-route-pattern',
    title: '7. Pattern route edit cho Drawer',
    context:
      'promotion-type thật thiếu route edit, PROMOTION_MANAGEMENT_EDIT không dùng. Ở đây offer-type dùng chung route :id cho view/edit + nút "Mở toàn trang". Có áp dụng pattern này cho promotion-type thật không?',
    link: { to: '/offer-types', label: 'Xem offer-types' }
  },
  {
    id: 'reorder-pagination-mode',
    title: '8. Chế độ kéo thả + phân trang',
    context: 'offer-type (phân trang, kéo trong trang) và background-locks (không phân trang) đang khác nhau. Chốt một chế độ áp dụng chung.',
    link: { to: '/experiments/reorder-pagination', label: 'Chạy thí nghiệm 2' }
  }
];

function loadNote(id: string): string {
  try {
    return localStorage.getItem(`decision-note:${id}`) ?? '';
  } catch {
    return '';
  }
}

function saveNote(id: string, value: string) {
  try {
    localStorage.setItem(`decision-note:${id}`, value);
  } catch {
    // Private window / blocked storage — note simply won't persist across
    // a reload. Acceptable for a meeting-time scratch pad.
  }
}

function DecisionCard({ item }: { item: DecisionItem }) {
  const [note, setNote] = useState(() => loadNote(item.id));

  return (
    <Card size="small" style={{ marginBottom: 12 }} title={item.title}>
      <Typography.Paragraph>{item.context}</Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }}>
        {item.link && (
          <Link to={item.link.to}>
            <Tag color="blue">{item.link.label}</Tag>
          </Link>
        )}
        <Input.TextArea
          placeholder="Quyết định của team (điền trong buổi họp — lưu trên máy này, không gửi đi đâu)"
          rows={2}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            saveNote(item.id, e.target.value);
          }}
        />
      </Space>
    </Card>
  );
}

export function DecisionsPage() {
  return (
    <>
      <Typography.Title level={3}>Quyết định cần chốt</Typography.Title>
      <Typography.Paragraph type="secondary">
        8 điểm NEEDS-TEAM-DECISION từ đợt đánh giá layout. Ô ghi chú lưu trong trình duyệt của máy này (localStorage)
        — không gửi lên đâu, chỉ để dùng trong buổi họp.
      </Typography.Paragraph>
      {DECISIONS.map((item) => (
        <DecisionCard key={item.id} item={item} />
      ))}
    </>
  );
}
