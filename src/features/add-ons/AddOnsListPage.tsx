import { claudePath } from '@/claude/routes/route-meta';
import { useState } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAddOnProductsListQuery, useBatchSetAddOnProductsStatusMutation } from './add-ons.queries.hook';
import type { AddOnProduct } from './demo-add-ons-data';

// Batch activate/deactivate over row selection — matches the real repo's
// add-on list (single-row and batch activate/deactivate).
export function AddOnsListPage() {
  const { t, i18n } = useTranslation('claude');
  const { data: items = [], isLoading } = useAddOnProductsListQuery();
  const batchMutation = useBatchSetAddOnProductsStatusMutation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button disabled={selectedIds.length === 0} loading={batchMutation.isPending} onClick={() => batchMutation.mutate({ ids: selectedIds, status: 'active' })}>
          {t('activateSelected')}
        </Button>
        <Button disabled={selectedIds.length === 0} loading={batchMutation.isPending} onClick={() => batchMutation.mutate({ ids: selectedIds, status: 'inactive' })}>
          {t('deactivateSelected')}
        </Button>
      </Space>
      <Table<AddOnProduct>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={false}
        rowSelection={{ selectedRowKeys: selectedIds, onChange: (keys) => setSelectedIds(keys as string[]) }}
        columns={[
          { title: t('code'), dataIndex: 'code' },
          { title: t('addOnName'), dataIndex: 'name' },
          { title: t('distribution'), dataIndex: 'distribution', render: (v: AddOnProduct['distribution']) => t(v === 'cash-loan' ? 'cashLoan' : v === 'credit-card' ? 'creditCard' : v === 'offset-loan' ? 'offsetLoan' : 'standalone') },
          { title: t('partner'), dataIndex: 'associatedPartner' },
          { title: t('fee'), dataIndex: 'feeValue', render: (v: number) => new Intl.NumberFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN').format(v) },
          {
            title: t('status'),
            dataIndex: 'status',
            render: (status: AddOnProduct['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{t(status)}</Tag>
          },
          {
            title: '',
            key: 'actions',
            render: (_, record) => <Link to={claudePath('addOnEdit', { id: record.id })}>{t('configure')}</Link>
          }
        ]}
      />
    </>
  );
}
