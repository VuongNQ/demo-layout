import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRequiredInformationListQuery } from './required-information.queries.hook';
import type { RequiredInformation } from './demo-required-information-data';

export function RequiredInformationListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = useRequiredInformationListQuery();

  return (
    <Table<RequiredInformation>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: t('pages.requiredInfo.code'), dataIndex: 'code' },
        { title: t('pages.requiredInfo.name'), dataIndex: 'name' },
        { title: t('pages.requiredInfo.inputType'), dataIndex: 'inputType', render: (v: string) => t(`pages.requiredInfo.inputTypes.${v}`, { defaultValue: v }) },
        { title: t('pages.requiredInfo.supplyMethod'), dataIndex: 'supplyMethod', render: (v: string) => t(`pages.requiredInfo.supplyMethods.${v}`, { defaultValue: v }) },
        {
          title: t('pages.requiredInfo.status'),
          dataIndex: 'status',
          render: (status: RequiredInformation['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{t(`pages.requiredInfo.${status}`)}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={claudePath('requiredInformationEdit', { id: record.id })}>{t('pages.requiredInfo.configure')}</Link>
        }
      ]}
    />
  );
}
