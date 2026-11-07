import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag, Avatar } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Link, Outlet } from 'react-router-dom';
import { useBackgroundLockListQuery, useReorderBackgroundLocksMutation } from './background-lock.queries.hook';
import { DragHandle, SortableRow } from '@/components/SortableRow';
import { useTranslation } from 'react-i18next';
import type { BackgroundLock } from './demo-background-lock-data';

// Same reorder mechanics as offer-type (shared SortableRow/DragHandle),
// but over an UNPAGINATED list — this is the dataset experiment 2
// compares against offer-type's 120-row paginated case.
export function BackgroundLockListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = useBackgroundLockListQuery();
  const reorderMutation = useReorderBackgroundLocksMutation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = items.findIndex((item) => item.id === active.id);
    const overIndex = items.findIndex((item) => item.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;
    const reordered = arrayMove(items, activeIndex, overIndex);
    reorderMutation.mutate(reordered.map((item) => item.id));
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <Table<BackgroundLock>
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={false}
            components={{ body: { row: SortableRow } }}
            columns={[
              { key: 'drag', width: 32, render: () => <DragHandle /> },
              {
                title: t('pages.background.image'),
                key: 'image',
                width: 56,
                render: (_, record) => (
                  <Avatar shape="square" style={{ backgroundColor: record.imagePreviewColor }} icon={<PictureOutlined />} />
                )
              },
              { title: t('pages.background.name'), dataIndex: 'name' },
              {
                title: t('pages.background.status'),
                dataIndex: 'status',
                render: (status: BackgroundLock['status']) => (
                  <Tag color={status === 'active' ? 'green' : status === 'draft' ? 'gold' : 'default'}>{t(`pages.background.${status}`)}</Tag>
                )
              },
              {
                title: t('pages.background.segments'),
                dataIndex: 'customerSegments',
                render: (segments: string[]) => segments.join(', ')
              },
              { title: t('pages.background.order'), dataIndex: 'priority', width: 80 },
              {
                title: '',
                key: 'actions',
                render: (_, record) => <Link to={claudePath('backgroundLockDetail', { id: record.id })}>{t('pages.background.configure')}</Link>
              }
            ]}
          />
        </SortableContext>
      </DndContext>
      <Outlet />
    </>
  );
}
