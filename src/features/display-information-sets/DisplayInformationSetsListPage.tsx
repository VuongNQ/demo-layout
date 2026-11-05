import { Table, Tag, Avatar, Switch } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDisplayInformationSetsListQuery } from './display-information-sets.queries.hook';
import type { DisplayInformationSet } from './demo-display-information-sets-data';

export function DisplayInformationSetsListPage() {
  const { data: items = [], isLoading } = useDisplayInformationSetsListQuery();

  return (
    <Table<DisplayInformationSet>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        {
          title: 'Ảnh',
          key: 'image',
          width: 56,
          render: (_, record) => <Avatar shape="square" style={{ backgroundColor: record.previewColor }} icon={<PictureOutlined />} />
        },
        { title: 'Mã', dataIndex: 'code' },
        { title: 'Tên bộ hiển thị', dataIndex: 'name' },
        { title: 'Dòng sản phẩm', dataIndex: 'productLineCode' },
        {
          title: 'Hiện ở App',
          key: 'showInApp',
          render: (_, record) => <Switch checked={record.showInApp} disabled />
        },
        {
          title: 'Hiện ở Web',
          key: 'showInWeb',
          render: (_, record) => <Switch checked={record.showInWeb} disabled />
        },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          render: (status: DisplayInformationSet['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={`/display-information-sets/${record.id}`}>Cài đặt</Link>
        }
      ]}
    />
  );
}
