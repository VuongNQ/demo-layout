import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useFeesListQuery } from './fees.queries.hook';
import type { FeeDefinition } from './demo-fees-data';

export function FeesListPage() {
  const { data: items = [], isLoading } = useFeesListQuery();

  return (
    <Table<FeeDefinition>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: 'Mã', dataIndex: 'code' },
        { title: 'Tên phí', dataIndex: 'name' },
        {
          title: 'Áp dụng',
          dataIndex: 'applicationType',
          render: (v: FeeDefinition['applicationType']) => (v === 'cash-loan' ? 'Vay tiền mặt' : 'Thẻ tín dụng')
        },
        {
          title: 'Giá trị',
          key: 'value',
          render: (_, record) => (record.unit === 'percent' ? `${record.value}%` : record.value.toLocaleString('vi-VN'))
        },
        { title: 'Ngày hiệu lực', dataIndex: 'effectiveDate' },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          render: (status: FeeDefinition['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
        },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={`/fees/${record.id}`}>Cài đặt</Link>
        }
      ]}
    />
  );
}
