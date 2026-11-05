import { Table, Switch, Button, Space } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { usePromotionTypesListQuery, useTogglePromotionTypeStatusMutation } from './promotion-types.queries.hook';
import type { PromotionType } from './demo-promotion-types-data';

// No delete action here — matches the real repo's promotion-type (list,
// create, view/edit drawer, status toggle only).
export function PromotionTypesListPage() {
  const { data: items = [], isLoading } = usePromotionTypesListQuery();
  const toggleMutation = useTogglePromotionTypeStatusMutation();
  const navigate = useNavigate();

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" onClick={() => navigate('/promotion-types/create')}>
          Thêm loại khuyến mãi
        </Button>
      </Space>
      <Table<PromotionType>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          { title: 'Mã', dataIndex: 'code' },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
              <Switch
                checked={record.status === 'active'}
                loading={toggleMutation.isPending && toggleMutation.variables === record.id}
                onChange={() => toggleMutation.mutate(record.id)}
              />
            )
          },
          {
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={`/promotion-types/${record.id}`}>Sửa</Link>
          }
        ]}
      />
      <Outlet />
    </>
  );
}
