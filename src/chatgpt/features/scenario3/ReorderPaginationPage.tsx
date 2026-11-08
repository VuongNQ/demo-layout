import { Alert, Button, Card, Form, Input, InputNumber, Space, Typography, message } from 'antd';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfferTypeListQuery, useReorderOfferTypesMutation } from '@/features/offer-type/offer-type.queries.hook';
import { INITIAL_OFFER_TYPE_COUNT, type OfferType } from '@/data/demo-data';
import styles from './ReorderPaginationPage.module.scss';

const PAGE_SIZE = 20;
type PositionValues = { offerId: string; targetPosition: number };

function SortableOffer({ item, index, position, count, onMove }: {
  item: OfferType; index: number; position: number; count: number; onMove: (id: string, delta: number) => void;
}) {
  const { t } = useTranslation('chatgpt');
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      className={`${styles.row} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        ref={setActivatorNodeRef}
        className={styles.dragButton}
        aria-label={t('pages.scenario3.dragItem', { name: item.name })}
        {...attributes}
        {...listeners}
      >{t('pages.scenario3.drag')}</Button>
      <div className={styles.itemText}><strong>{item.name}</strong><span>{item.id} · {t('pages.scenario3.position', { position })}</span></div>
      <Space wrap>
        <Button aria-label={t('pages.scenario3.moveUp', { name: item.name })} disabled={index === 0} onClick={() => onMove(item.id, -1)}>{t('pages.scenario3.up')}</Button>
        <Button aria-label={t('pages.scenario3.moveDown', { name: item.name })} disabled={index === count - 1} onClick={() => onMove(item.id, 1)}>{t('pages.scenario3.down')}</Button>
      </Space>
    </li>
  );
}

export function ReorderPaginationPage() {
  const { t } = useTranslation('chatgpt');
  const { data, isLoading, isError, refetch } = useOfferTypeListQuery({ page: 1, pageSize: INITIAL_OFFER_TYPE_COUNT });
  const reorder = useReorderOfferTypesMutation();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<'page' | 'all' | 'position'>('page');
  const [draftOrder, setDraftOrder] = useState<OfferType[] | null>(null);
  const [feedback, setFeedback] = useState('');
  const [positionForm] = Form.useForm<PositionValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sourceOrder = data?.items ?? [];
  const order = draftOrder ?? sourceOrder;
  const isDirty = draftOrder !== null;
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = useMemo(() => order.slice(start, end), [end, order, start]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function replacePageOrder(nextPageItems: OfferType[]) {
    const next = [...order];
    next.splice(start, pageItems.length, ...nextPageItems);
    setDraftOrder(next);
    setFeedback('');
  }

  function moveItem(id: string, delta: number) {
    const visible = mode === 'page' ? pageItems : order;
    const visibleIndex = visible.findIndex((item) => item.id === id);
    const targetIndex = visibleIndex + delta;
    if (visibleIndex < 0 || targetIndex < 0 || targetIndex >= visible.length) return;
    if (mode === 'page') replacePageOrder(arrayMove(visible, visibleIndex, targetIndex));
    else setDraftOrder(arrayMove(order, visibleIndex, targetIndex));
    setFeedback('');
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const visible = mode === 'page' ? pageItems : order;
    const from = visible.findIndex((item) => item.id === active.id);
    const to = visible.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    if (mode === 'page') replacePageOrder(arrayMove(visible, from, to));
    else setDraftOrder(arrayMove(order, from, to));
    setFeedback('');
  }

  async function saveOrder() {
    if (!draftOrder) return;
    const uniqueIds = new Set(draftOrder.map((item) => item.id));
    if (draftOrder.length !== total || uniqueIds.size !== total) {
      setFeedback(t('pages.scenario3.invalidOrder'));
      return;
    }
    try {
      await reorder.mutateAsync(draftOrder.map((item) => item.id));
      setDraftOrder(null);
      setFeedback(t('pages.scenario3.saved'));
      messageApi.success(t('pages.scenario3.saved'));
    } catch {
      setFeedback(t('pages.scenario3.saveError'));
    }
  }

  function applyPosition(values: PositionValues) {
    const currentIndex = order.findIndex((item) => item.id === values.offerId.trim());
    if (currentIndex < 0) {
      setFeedback(t('pages.scenario3.unknownOffer', { id: values.offerId }));
      return;
    }
    const targetIndex = Math.max(0, Math.min(order.length - 1, Math.trunc(values.targetPosition) - 1));
    setDraftOrder(arrayMove(order, currentIndex, targetIndex));
    setFeedback(t('pages.scenario3.positionPreview', { id: values.offerId, position: targetIndex + 1 }));
  }

  const itemsToRender = mode === 'page' ? pageItems : order;

  return (
    <div className={styles.page}>
      {contextHolder}
      <Typography.Title level={1}>{t('pages.scenario3.title')}</Typography.Title>
      <Typography.Paragraph>{t('pages.scenario3.intro')}</Typography.Paragraph>
      <Alert type="info" showIcon message={t(mode === 'page' ? 'pages.scenario3.pageScope' : 'pages.scenario3.globalScope')} />
      {isError && <Alert type="error" showIcon message={t('pages.scenario3.loadError')} action={<Button onClick={() => void refetch()}>{t('pages.scenario3.retry')}</Button>} />}
      <Card>
        <Space className={styles.controls} wrap>
          <Button type={mode === 'page' ? 'primary' : 'default'} onClick={() => setMode('page')}>{t('pages.scenario3.pageMode')}</Button>
          <Button type={mode === 'all' ? 'primary' : 'default'} onClick={() => setMode('all')}>{t('pages.scenario3.allMode')}</Button>
          <Button type={mode === 'position' ? 'primary' : 'default'} onClick={() => setMode('position')}>{t('pages.scenario3.positionMode')}</Button>
        </Space>
        <div className={styles.orderActions}>
          <Typography.Text aria-live="polite">{isDirty ? t('pages.scenario3.dirty') : t('pages.scenario3.clean')}</Typography.Text>
          <Space wrap>
            <Button disabled={!isDirty || reorder.isPending} onClick={() => { setDraftOrder(null); setFeedback(t('pages.scenario3.discarded')); }}>{t('pages.scenario3.discard')}</Button>
            <Button type="primary" disabled={!isDirty} loading={reorder.isPending} onClick={() => void saveOrder()}>{t('pages.scenario3.save')}</Button>
          </Space>
        </div>
        {mode === 'position' && (
          <Form form={positionForm} layout="inline" className={styles.positionForm} onFinish={applyPosition}>
            <Form.Item name="offerId" label={t('pages.scenario3.offerId')} rules={[{ required: true, message: t('pages.scenario3.offerIdRequired') }]}>
              <Input placeholder={t('pages.scenario3.offerIdExample')} />
            </Form.Item>
            <Form.Item name="targetPosition" label={t('pages.scenario3.targetPosition')} rules={[{ required: true, message: t('pages.scenario3.positionRequired') }]}>
              <InputNumber min={1} max={total || INITIAL_OFFER_TYPE_COUNT} />
            </Form.Item>
            <Button htmlType="submit">{t('pages.scenario3.previewMove')}</Button>
          </Form>
        )}
        <Typography.Paragraph className={styles.range} aria-live="polite">
          {mode === 'page' ? t('pages.scenario3.range', { from: total ? start + 1 : 0, to: end, total }) : t('pages.scenario3.allRange', { total })}
        </Typography.Paragraph>
        {isLoading ? <Typography.Paragraph role="status">{t('common:loading')}</Typography.Paragraph> : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={itemsToRender.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ol className={styles.list} aria-label={t('pages.scenario3.offerList')}>
                {itemsToRender.map((item, index) => {
                  const boundaryStart = mode === 'page' ? start : 0;
                  const boundaryEnd = mode === 'page' ? end : order.length;
                  return <SortableOffer key={item.id} item={item} index={index} position={(mode === 'page' ? start : 0) + index + 1} count={boundaryEnd - boundaryStart} onMove={moveItem} />;
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        {mode === 'page' && <nav className={styles.pager} aria-label={t('pages.scenario3.pagination')}>
          <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('pages.scenario3.previous')}</Button>
          <Typography.Text>{t('pages.scenario3.page', { page, pageCount })}</Typography.Text>
          <Button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{t('pages.scenario3.next')}</Button>
        </nav>}
        {feedback && <Typography.Paragraph role="status" className={styles.feedback}>{feedback}</Typography.Paragraph>}
      </Card>
    </div>
  );
}
