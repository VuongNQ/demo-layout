import { useState } from 'react';
import { Segmented, Typography, Table, Pagination, Button, Space, InputNumber, Alert } from 'antd';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DragHandle, SortableRow } from '@/components/SortableRow';
import { useOfferTypeListQuery, useReorderOfferTypesMutation } from '@/features/offer-type/offer-type.queries.hook';
import type { OfferType } from '@/data/demo-data';

type Mode = 'paginated' | 'sort-mode' | 'position-input';

const PAGE_SIZE = 20;
const ALL_SIZE = 1000;

// NEEDS-TEAM-DECISION #8: which reorder mode for a list with pagination?
// All three run against the SAME offer-type data/service as the real
// /offer-types screen — this page only changes how the list is fetched
// and how dnd-kit is wired, to make the three options comparable.
function PaginatedMode() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOfferTypeListQuery({ page, pageSize: PAGE_SIZE });
  const reorderMutation = useReorderOfferTypesMutation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const items = data?.items ?? [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = items.findIndex((item) => item.id === active.id);
    const overIndex = items.findIndex((item) => item.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;
    reorderMutation.mutate(arrayMove(items, activeIndex, overIndex).map((item) => item.id));
  }

  return (
    <>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message='Thử: ở trang 1, kéo item xuống cuối danh sách rồi sang trang 2. Item sẽ KHÔNG di chuyển sang trang 2 — dnd-kit chỉ biết các item đang render trên trang hiện tại. Đây đúng là vấn đề django-admin-sortable và Atlassian JSDCLOUD-19359 đã nêu, không phải lỗi giả lập.'
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <Table<OfferType>
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={false}
            components={{ body: { row: SortableRow } }}
            columns={[
              { key: 'drag', width: 32, render: () => <DragHandle /> },
              { title: 'Tên', dataIndex: 'name' },
              { title: 'Thứ tự', dataIndex: 'priority', width: 80 }
            ]}
          />
        </SortableContext>
      </DndContext>
      <Pagination style={{ marginTop: 16, textAlign: 'right' }} current={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
    </>
  );
}

function SortModeMode() {
  const { data, isLoading } = useOfferTypeListQuery({ page: 1, pageSize: ALL_SIZE });
  const reorderMutation = useReorderOfferTypesMutation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [localOrder, setLocalOrder] = useState<OfferType[] | null>(null);
  const items = localOrder ?? data?.items ?? [];
  const isDirty = localOrder !== null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const base = localOrder ?? data?.items ?? [];
    const activeIndex = base.findIndex((item) => item.id === active.id);
    const overIndex = base.findIndex((item) => item.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;
    setLocalOrder(arrayMove(base, activeIndex, overIndex));
  }

  return (
    <>
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="Toàn bộ danh sách (bỏ phân trang) được tải một lần. Kéo thả tự do từ đầu tới cuối, không bị chặn ở biên trang. Bấm 'Lưu thứ tự' để ghi lại — trước đó thay đổi chỉ ở local."
      />
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          disabled={!isDirty}
          loading={reorderMutation.isPending}
          onClick={async () => {
            if (!localOrder) return;
            await reorderMutation.mutateAsync(localOrder.map((i) => i.id));
            setLocalOrder(null);
          }}
        >
          Lưu thứ tự
        </Button>
        {isDirty && <Typography.Text type="warning">Có thay đổi chưa lưu</Typography.Text>}
      </Space>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <Table<OfferType>
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={false}
            scroll={{ y: 480 }}
            components={{ body: { row: SortableRow } }}
            columns={[
              { key: 'drag', width: 32, render: () => <DragHandle /> },
              { title: 'Tên', dataIndex: 'name' },
              { title: 'Thứ tự', dataIndex: 'priority', width: 80 }
            ]}
          />
        </SortableContext>
      </DndContext>
    </>
  );
}

function PositionInputMode() {
  const { data, isLoading } = useOfferTypeListQuery({ page: 1, pageSize: ALL_SIZE });
  const reorderMutation = useReorderOfferTypesMutation();
  const items = data?.items ?? [];

  function moveToPosition(id: string, targetPosition: number) {
    const clamped = Math.max(1, Math.min(items.length, targetPosition));
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;
    const reordered = arrayMove(items, currentIndex, clamped - 1);
    reorderMutation.mutate(reordered.map((item) => item.id));
  }

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Không cần kéo thả: nhập số thứ tự mong muốn và nhấn Enter. Hoạt động xuyên trang vì không có trang — nhưng kém trực quan hơn kéo thả, và không dùng được bàn phím-chỉ (accessible hơn) theo đúng nghĩa đó."
      />
      <Table<OfferType>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        scroll={{ y: 480 }}
        columns={[
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Thứ tự',
            dataIndex: 'priority',
            width: 120,
            render: (priority: number, record) => (
              <InputNumber
                size="small"
                min={1}
                max={items.length}
                defaultValue={priority}
                onPressEnter={(e) => moveToPosition(record.id, Number((e.target as HTMLInputElement).value))}
                onBlur={(e) => moveToPosition(record.id, Number(e.target.value))}
              />
            )
          }
        ]}
      />
    </>
  );
}

export function ReorderExperimentPage() {
  const [mode, setMode] = useState<Mode>('paginated');

  return (
    <>
      <Typography.Title level={4}>Thí nghiệm 2 — Kéo thả reorder trên danh sách có phân trang</Typography.Title>
      <Typography.Paragraph>
        Cùng một dữ liệu offer-type (120 item), ba cách lấy/sắp xếp khác nhau. NEEDS-TEAM-DECISION #8: chọn một chế
        độ áp cho mọi màn có reorder (hiện offer-type và background-locks đang khác nhau).
      </Typography.Paragraph>
      <Segmented
        style={{ marginBottom: 16 }}
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { label: 'Phân trang (hiện tại)', value: 'paginated' },
          { label: 'Chế độ sắp xếp riêng', value: 'sort-mode' },
          { label: 'Nhập vị trí trực tiếp', value: 'position-input' }
        ]}
      />
      {mode === 'paginated' && <PaginatedMode />}
      {mode === 'sort-mode' && <SortModeMode />}
      {mode === 'position-input' && <PositionInputMode />}
    </>
  );
}
