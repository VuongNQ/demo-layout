import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { Table, Tag, Button, Space, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromotionsListQuery } from '@/features/promotions/promotions.queries.hook';
import type { Promotion } from '@/features/promotions/demo-promotions-data';
import { getPromotionHistoryEvents } from '@/features/promotions/promotion-history.data';
import { PromotionHistoryLogViewer } from './PromotionHistoryLogViewer';

const STATUS_COLOR: Record<Promotion['status'], string> = { active: 'green', draft: 'gold', expired: 'default' };

export function PromotionsListPage() {
  const { t } = useTranslation('chatgpt');
  const { data: items = [], isLoading } = usePromotionsListQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const [historySelection, setHistorySelection] = useState<{ promotionId: string; eventId?: string; promotionName: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const historyTriggers = useRef(new Map<string, HTMLElement>());
  const returnFocusId = useRef<string>();
  const focusReturnPending = useRef(false);

  function openHistory(record: Promotion) {
    returnFocusId.current = record.id;
    focusReturnPending.current = true;
    const events = getPromotionHistoryEvents(record.id);
    setHistorySelection({ promotionId: record.id, eventId: events?.[0]?.id, promotionName: record.name });
  }

  function restoreListFocus() {
    if (!focusReturnPending.current) return;
    focusReturnPending.current = false;
    window.requestAnimationFrame(() => {
      const trigger = returnFocusId.current ? historyTriggers.current.get(returnFocusId.current) : undefined;
      (trigger ?? headingRef.current)?.focus();
    });
  }

  return (
    <>
      <Typography.Title level={1} ref={headingRef} tabIndex={-1}>{t('pages.promotion.listTitle')}</Typography.Title>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" onClick={() => navigate(`${chatgptPath('promotionCreate')}${location.search}${location.hash}`)}>
          {t('pages.promotion.add')}
        </Button>
      </Space>
      <Table<Promotion>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          { title: t('pages.promotion.code'), dataIndex: 'code' },
          { title: t('pages.promotion.name'), dataIndex: 'name' },
          { title: t('pages.promotion.offerType'), dataIndex: 'offerType' },
          { title: t('pages.promotion.period'), key: 'period', render: (_, record) => `${record.startDate} → ${record.endDate}` },
          {
            title: t('pages.promotion.status'),
            dataIndex: 'status',
            render: (status: Promotion['status']) => <Tag color={STATUS_COLOR[status]}>{t(`pages.promotion.${status}`)}</Tag>
          },
          {
            title: t('actions'),
            key: 'actions',
            render: (_, record) => (
              <Space wrap>
                <Link
                  aria-label={t('pages.promotion.editFor', { name: record.name })}
                  to={`${chatgptPath('promotionEdit', { id: record.id })}${location.search}${location.hash}`}
                >
                  {t('pages.promotion.edit')}
                </Link>
                <Button
                  type="link"
                  ref={(node) => {
                    if (node) historyTriggers.current.set(record.id, node);
                    else historyTriggers.current.delete(record.id);
                  }}
                  aria-label={t('pages.promotion.history.viewFor', { name: record.name })}
                  onClick={() => openHistory(record)}
                >
                  {t('pages.promotion.history.view')}
                </Button>
              </Space>
            )
          }
        ]}
      />
      <PromotionHistoryLogViewer
        open={Boolean(historySelection)}
        promotionId={historySelection?.promotionId}
        promotionName={historySelection?.promotionName}
        selectedEventId={historySelection?.eventId}
        onSelectEvent={(eventId) => setHistorySelection((current) => current ? { ...current, eventId } : current)}
        onClose={() => setHistorySelection(null)}
        onAfterClose={restoreListFocus}
      />
    </>
  );
}
