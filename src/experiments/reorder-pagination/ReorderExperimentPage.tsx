import { useState } from 'react';
import { Segmented, Typography, Table, Pagination, Button, Space, InputNumber, Alert } from 'antd';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DragHandle, SortableRow } from '@/components/SortableRow';
import { useOfferTypeListQuery, useReorderOfferTypesMutation } from '@/features/offer-type/offer-type.queries.hook';
import type { OfferType } from '@/data/demo-data';
import { useTranslation } from 'react-i18next';

type Mode = 'paginated' | 'sort-mode' | 'position-input';

const PAGE_SIZE = 20;
const ALL_SIZE = 1000;

// NEEDS-TEAM-DECISION #8: which reorder mode for a list with pagination?
// All three run against the SAME offer-type data/service as the real
// /offer-types screen — this page only changes how the list is fetched
// and how dnd-kit is wired, to make the three options comparable.
function PaginatedMode() {
  const { t } = useTranslation('claude');
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
        message={t('pages.experiments.pageBoundary')}
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
              { title: t('pages.experiments.name'), dataIndex: 'name' },
              { title: t('pages.experiments.order'), dataIndex: 'priority', width: 80 }
            ]}
          />
        </SortableContext>
      </DndContext>
      <Pagination style={{ marginTop: 16, textAlign: 'right' }} current={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
    </>
  );
}

function SortModeMode() {
  const { t } = useTranslation('claude');
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
        message={t('pages.experiments.allItems')}
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
          {t('pages.experiments.saveOrder')}
        </Button>
        {isDirty && <Typography.Text type="warning">{t('pages.experiments.dirtyNotice')}</Typography.Text>}
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
              { title: t('pages.experiments.name'), dataIndex: 'name' },
              { title: t('pages.experiments.order'), dataIndex: 'priority', width: 80 }
            ]}
          />
        </SortableContext>
      </DndContext>
    </>
  );
}

function PositionInputMode() {
  const { t } = useTranslation('claude');
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
        message={t('pages.experiments.keyboardMove')}
      />
      <Table<OfferType>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        scroll={{ y: 480 }}
        columns={[
          { title: t('pages.experiments.name'), dataIndex: 'name' },
          {
            title: t('pages.experiments.order'),
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
  const { t } = useTranslation('claude');
  const [mode, setMode] = useState<Mode>('paginated');

  return (
    <>
      <Typography.Title level={4}>{t('pages.experiments.reorderTitle')}</Typography.Title>
      <Typography.Paragraph>
        {t('pages.experiments.reorderIntro')}
      </Typography.Paragraph>
      <Segmented
        style={{ marginBottom: 16 }}
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { label: t('pages.experiments.paginated'), value: 'paginated' },
          { label: t('pages.experiments.sortMode'), value: 'sort-mode' },
          { label: t('pages.experiments.positionMode'), value: 'position-input' }
        ]}
      />
      {mode === 'paginated' && <PaginatedMode />}
      {mode === 'sort-mode' && <SortModeMode />}
      {mode === 'position-input' && <PositionInputMode />}
    </>
  );
}
