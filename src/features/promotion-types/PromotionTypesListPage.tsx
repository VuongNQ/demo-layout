import { claudePath } from '@/claude/routes/route-meta';
import { Table, Switch, Button, Space } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePromotionTypesListQuery, useTogglePromotionTypeStatusMutation } from './promotion-types.queries.hook';
import type { PromotionType } from './demo-promotion-types-data';

// No delete action here — matches the real repo's promotion-type (list,
// create, view/edit drawer, status toggle only).
export function PromotionTypesListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = usePromotionTypesListQuery();
  const toggleMutation = useTogglePromotionTypeStatusMutation();
  const navigate = useNavigate();

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" onClick={() => navigate(claudePath('promotionTypeCreate'))}>
          {t('pages.promotionType.add')}
        </Button>
      </Space>
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
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={claudePath('promotionTypeDetail', { id: record.id })}>{t('pages.promotionType.edit')}</Link>
          }
        ]}
      />
      <Outlet />
    </>
  );
}
