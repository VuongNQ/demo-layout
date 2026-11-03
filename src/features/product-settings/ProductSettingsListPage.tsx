import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useProductSettingsListQuery } from './product-settings.queries.hook';
import type { ProductSettings } from './demo-product-settings-data';

export function ProductSettingsListPage() {
  const { data: items = [], isLoading } = useProductSettingsListQuery();

  return (
    <Table<ProductSettings>
      rowKey="id"
      loading={isLoading}
      dataSource={items}
      pagination={false}
      columns={[
        { title: 'Tên sản phẩm', dataIndex: 'name' },
        { title: 'Mã', dataIndex: 'code' },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          render: (status: ProductSettings['status']) => (
            <Tag color={status === 'active' ? 'green' : status === 'draft' ? 'gold' : 'default'}>{status}</Tag>
          )
        },
        { title: 'Đối tượng', dataIndex: 'customerType', render: (v: string) => (v === 'individual' ? 'Cá nhân' : 'Doanh nghiệp') },
        { title: 'Số bậc lãi suất', dataIndex: 'tiers', render: (tiers: unknown[]) => tiers.length },
        {
          title: '',
          key: 'actions',
          render: (_, record) => <Link to={`/product-settings/${record.id}`}>Cài đặt</Link>
        }
      ]}
    />
  );
}
