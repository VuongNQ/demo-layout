import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useRequiredInformationListQuery } from './required-information.queries.hook';
import type { RequiredInformation } from './demo-required-information-data';

export function RequiredInformationListPage() {
  const { data: items = [], isLoading } = useRequiredInformationListQuery();

  return (
    <Table<RequiredInformation>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: 'Mã', dataIndex: 'code' },
        { title: 'Tên thông tin', dataIndex: 'name' },
        { title: 'Kiểu nhập', dataIndex: 'inputType' },
        { title: 'Cách cung cấp', dataIndex: 'supplyMethod' },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          render: (status: RequiredInformation['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={`/required-information/${record.id}`}>Cài đặt</Link>
        }
      ]}
    />
  );
}
