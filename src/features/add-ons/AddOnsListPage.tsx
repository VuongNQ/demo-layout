import { useState } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useAddOnProductsListQuery, useBatchSetAddOnProductsStatusMutation } from './add-ons.queries.hook';
import type { AddOnProduct } from './demo-add-ons-data';

const DISTRIBUTION_LABEL: Record<AddOnProduct['distribution'], string> = {
  standalone: 'Độc lập',
  'cash-loan': 'Vay tiền mặt',
  'credit-card': 'Thẻ tín dụng',
  'offset-loan': 'Vay cấn trừ'
};

// Batch activate/deactivate over row selection — matches the real repo's
// add-on list (single-row and batch activate/deactivate).
export function AddOnsListPage() {
  const { data: items = [], isLoading } = useAddOnProductsListQuery();
  const batchMutation = useBatchSetAddOnProductsStatusMutation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button disabled={selectedIds.length === 0} loading={batchMutation.isPending} onClick={() => batchMutation.mutate({ ids: selectedIds, status: 'active' })}>
          Kích hoạt đã chọn
        </Button>
        <Button disabled={selectedIds.length === 0} loading={batchMutation.isPending} onClick={() => batchMutation.mutate({ ids: selectedIds, status: 'inactive' })}>
          Vô hiệu hoá đã chọn
        </Button>
      </Space>
      <Table<AddOnProduct>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        rowSelection={{ selectedRowKeys: selectedIds, onChange: (keys) => setSelectedIds(keys as string[]) }}
        columns={[
          { title: 'Mã', dataIndex: 'code' },
          { title: 'Tên sản phẩm', dataIndex: 'name' },
          { title: 'Phân phối', dataIndex: 'distribution', render: (v: AddOnProduct['distribution']) => DISTRIBUTION_LABEL[v] },
          { title: 'Đối tác liên kết', dataIndex: 'associatedPartner' },
          { title: 'Phí', dataIndex: 'feeValue', render: (v: number) => v.toLocaleString('vi-VN') },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: AddOnProduct['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
          },
          {
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={`/add-ons/${record.id}`}>Cài đặt</Link>
          }
        ]}
      />
    </>
  );
}
