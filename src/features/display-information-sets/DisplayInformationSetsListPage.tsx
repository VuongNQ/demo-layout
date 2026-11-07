import { claudePath } from '@/claude/routes/route-meta';
import { Table, Tag, Avatar, Switch } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDisplayInformationSetsListQuery } from './display-information-sets.queries.hook';
import type { DisplayInformationSet } from './demo-display-information-sets-data';

export function DisplayInformationSetsListPage() {
  const { t } = useTranslation('claude');
  const { data: items = [], isLoading } = useDisplayInformationSetsListQuery();

  return (
    <Table<DisplayInformationSet>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        {
          title: t('pages.displaySet.image'),
          key: 'image',
          width: 56,
          render: (_, record) => <Avatar shape="square" style={{ backgroundColor: record.previewColor }} icon={<PictureOutlined />} />
        },
        { title: t('pages.displaySet.code'), dataIndex: 'code' },
        { title: t('pages.displaySet.name'), dataIndex: 'name' },
        { title: t('pages.displaySet.productLine'), dataIndex: 'productLineCode', render: (v: string) => t(`pages.displaySet.productLines.${v}`) },
        {
          title: t('pages.displaySet.app'),
          key: 'showInApp',
          render: (_, record) => <Switch checked={record.showInApp} disabled />
        },
        {
          title: t('pages.displaySet.web'),
          key: 'showInWeb',
          render: (_, record) => <Switch checked={record.showInWeb} disabled />
        },
        {
          title: t('pages.displaySet.status'),
          dataIndex: 'status',
          render: (status: DisplayInformationSet['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{t(`pages.displaySet.${status}`)}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={claudePath('displayInformationSetEdit', { id: record.id })}>{t('pages.displaySet.configure')}</Link>
        }
      ]}
    />
  );
}
