import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useProductSettingsListQuery } from './product-settings.queries.hook';
import type { ProductSettings } from './demo-product-settings-data';

export function ProductSettingsListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = useProductSettingsListQuery();

  return (
    <Table<ProductSettings>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: t('productSettings.productName'), dataIndex: 'name' },
        { title: t('code'), dataIndex: 'code' },
        {
          title: t('status'),
          dataIndex: 'status',
          render: (status: ProductSettings['status']) => (
            <Tag color={status === 'active' ? 'green' : status === 'draft' ? 'gold' : 'default'}>{t(`offer.${status}`)}</Tag>
          )
        },
        { title: t('productSettings.audience'), dataIndex: 'customerType', render: (v: string) => t(`productSettings.${v}`) },
        { title: t('productSettings.tierCount'), dataIndex: 'tiers', render: (tiers: unknown[]) => tiers.length },
        {
          title: t('actions'),
          key: 'actions',
          render: (_, record) => <Link to={claudePath('productSettingsEdit', { id: record.id })}>{t('productSettings.configure')}</Link>
        }
      ]}
    />
  );
}
