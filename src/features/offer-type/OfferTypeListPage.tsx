import { claudePath } from '@/claude/routes/route-meta';
import { useState } from 'react';
import { Table, Tag, Button, Space, Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useOfferTypeListQuery, useReorderOfferTypesMutation } from './offer-type.queries.hook';
import { DragHandle, SortableRow } from '@/components/SortableRow';
import { ImportLocalDataButton } from './components/ImportLocalDataButton';
import type { OfferType, OfferStatus } from '@/data/demo-data';

const STATUS_COLOR: Record<OfferStatus, string> = {
  active: 'green',
  draft: 'gold',
  inactive: 'default'
};

const PAGE_SIZE = 20;

// Substrate A lives here: the list stays mounted at all times, and
// create/view/edit render as a Drawer via the child route's <Outlet/>.
// That is the whole point of this substrate — pagination state and the
// in-flight drag order in this component never unmount when the Drawer
// opens, unlike substrate B (full page) where navigating away does
// unmount this list.
export function OfferTypeListPage() {
  const { t } = useTranslation('claude');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
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
    // Demo deliberately reorders only within the current page — this is
    // option (3) from the layout note (kéo chỉ trong phạm vi trang hiện
    // tại). Experiment 2 adds the other two modes (sort mode without
    // pagination, and direct position entry) as alternates to compare.
    const reordered = arrayMove(items, activeIndex, overIndex);
    void reorderMutation.mutate(reordered.map((item) => item.id));
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate(claudePath('offerTypeCreate'))}>
          {t('offer.createNew')}
        </Button>
        <ImportLocalDataButton />
      </Space>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <Table<OfferType>
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={false}
            components={{ body: { row: SortableRow } }}
            columns={[
              { key: 'drag', width: 32, render: () => <DragHandle /> },
              { title: t('offer.tableName'), dataIndex: 'name' },
              {
                title: t('offer.tableStatus'),
                dataIndex: 'status',
                render: (status: OfferStatus) => <Tag color={STATUS_COLOR[status]}>{t(`offer.${status}`)}</Tag>
              },
              { title: t('offer.order'), dataIndex: 'priority', width: 80 },
              {
                title: t('claude:actions'),
                key: 'actions',
                render: (_, record) => <Link to={claudePath('offerTypeDetail', { id: record.id })}>{t('offer.configure')}</Link>
              }
            ]}
          />
        </SortableContext>
      </DndContext>

      <Pagination
        style={{ marginTop: 16, textAlign: 'right' }}
        current={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onChange={setPage}
      />

      {/* Child routes (/offer-types/:id, /offer-types/create) render their
          Drawer here, as a sibling of the table above rather than
          replacing it. */}
      <Outlet />
    </>
  );
}
