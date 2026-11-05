import { Table, Tag, Button, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { usePromotionsListQuery } from './promotions.queries.hook';
import type { Promotion } from './demo-promotions-data';

const STATUS_COLOR: Record<Promotion['status'], string> = { active: 'green', draft: 'gold', expired: 'default' };

export function PromotionsListPage() {
  const { data: items = [], isLoading } = usePromotionsListQuery();
  const navigate = useNavigate();

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" onClick={() => navigate('/promotions/create')}>
          Thêm khuyến mãi
        </Button>
      </Space>
      <Table<Promotion>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          { title: 'Mã', dataIndex: 'code' },
          { title: 'Tên khuyến mãi', dataIndex: 'name' },
          { title: 'Loại ưu đãi', dataIndex: 'offerType' },
          { title: 'Hiệu lực', key: 'period', render: (_, record) => `${record.startDate} → ${record.endDate}` },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: Promotion['status']) => <Tag color={STATUS_COLOR[status]}>{status}</Tag>
          },
          {
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={`/promotions/${record.id}/edit`}>Sửa</Link>
          }
        ]}
      />
    </>
  );
}
