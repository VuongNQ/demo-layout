import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag, Button, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePromotionsListQuery } from './promotions.queries.hook';
import type { Promotion } from './demo-promotions-data';

const STATUS_COLOR: Record<Promotion['status'], string> = { active: 'green', draft: 'gold', expired: 'default' };

export function PromotionsListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = usePromotionsListQuery();
  const navigate = useNavigate();

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" onClick={() => navigate(claudePath('promotionCreate'))}>
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
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={claudePath('promotionEdit', { id: record.id })}>{t('pages.promotion.edit')}</Link>
          }
        ]}
      />
    </>
  );
}
