import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeesListQuery } from './fees.queries.hook';
import type { FeeDefinition } from './demo-fees-data';

export function FeesListPage() {
  const { t, i18n } = useTranslation('claude');
  const { data: items = [], isLoading } = useFeesListQuery();

  return (
    <Table<FeeDefinition>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: t('code'), dataIndex: 'code' },
        { title: t('feeName'), dataIndex: 'name' },
        {
          title: t('application'),
          dataIndex: 'applicationType',
          render: (v: FeeDefinition['applicationType']) => (v === 'cash-loan' ? t('cashLoan') : t('creditCard'))
        },
        {
          title: t('value'),
          key: 'value',
          render: (_, record) => (record.unit === 'percent' ? `${record.value}%` : new Intl.NumberFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN').format(record.value))
        },
        { title: t('effectiveDate'), dataIndex: 'effectiveDate', render: (value: string) => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN').format(new Date(`${value}T00:00:00`)) },
        {
          title: t('status'),
          dataIndex: 'status',
          render: (status: FeeDefinition['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{t(status)}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={claudePath('feesEdit', { id: record.id })}>{t('configure')}</Link>
        }
      ]}
    />
  );
}
