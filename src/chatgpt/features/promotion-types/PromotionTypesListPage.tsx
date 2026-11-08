import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { Alert, Table, Switch, Button, Space, Typography } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromotionTypesListQuery, useTogglePromotionTypeStatusMutation } from '@/features/promotion-types/promotion-types.queries.hook';
import type { PromotionType } from '@/features/promotion-types/demo-promotion-types-data';

// No delete action here — matches the real repo's promotion-type (list,
// create, view/edit drawer, status toggle only).
export function PromotionTypesListPage() {
  const { t } = useTranslation('chatgpt');
  const location = useLocation();
  const { data: items = [], isLoading, isError, refetch } = usePromotionTypesListQuery();
  const toggleMutation = useTogglePromotionTypeStatusMutation();
  const navigate = useNavigate();
  const listPath = chatgptPath('promotionTypes');
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const actionRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const activeIdRef = useRef<string>();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = location.pathname;
    if (!previousPath.startsWith(`${listPath}/`) || location.pathname !== listPath) return;

    const frame = window.requestAnimationFrame(() => {
      const trigger = activeIdRef.current ? actionRefs.current[activeIdRef.current] : undefined;
      (trigger ?? createButtonRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [listPath, location.pathname]);

  return (
    <>
      <Typography.Title level={1}>{t('pages.promotionType.title')}</Typography.Title>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button ref={createButtonRef} type="primary" onClick={() => {
          activeIdRef.current = undefined;
          navigate(`${chatgptPath('promotionTypeCreate')}${location.search}${location.hash}`);
        }}>
          {t('pages.promotionType.add')}
        </Button>
      </Space>
      {isError && (
        <Alert
          type="error"
          showIcon
          role="alert"
          message={t('pages.promotionType.listLoadError')}
          action={<Button size="small" onClick={() => void refetch()}>{t('pages.promotionType.retry')}</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <Table<PromotionType>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          { title: t('pages.promotionType.code'), dataIndex: 'code' },
          { title: t('pages.promotionType.name'), dataIndex: 'name' },
          {
            title: t('pages.promotionType.status'),
            key: 'status',
            render: (_, record) => (
              <Switch
                checked={record.status === 'active'}
                aria-label={`${t('pages.promotionType.status')}: ${t(`pages.promotionType.${record.status}`)}`}
                loading={toggleMutation.isPending && toggleMutation.variables === record.id}
                onChange={() => toggleMutation.mutate(record.id)}
              />
            )
          },
          {
            title: t('actions'),
            key: 'actions',
            render: (_, record) => (
              <Link
                ref={(element) => { actionRefs.current[record.id] = element; }}
                aria-label={t('pages.promotionType.editFor', { name: record.name })}
                to={`${chatgptPath('promotionTypeDetail', { id: record.id })}${location.search}${location.hash}`}
                onClick={() => { activeIdRef.current = record.id; }}
              >
                {t('pages.promotionType.edit')}
              </Link>
            )
          }
        ]}
      />
      <Outlet />
    </>
  );
}
