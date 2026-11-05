import { useEffect, useState } from 'react';
import { Skeleton, Typography, message, Table } from 'antd';
import { AssignedProductsEditor } from '@/components/AssignedProductsEditor';
import { CASH_LOAN_CATALOG } from './demo-popular-loans-data';
import { usePopularLoansConfigQuery, useUpdatePopularLoansConfigMutation } from './popular-loans.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';

// Single-config page — no list, no :id route, matching the real submodule
// (view/edit ONE cash-loan collection, not a set of records).
export function PopularLoansPage() {
  const { data: config, isLoading } = usePopularLoansConfigQuery();
  const updateMutation = useUpdatePopularLoansConfigMutation();
  const [draft, setDraft] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (config) setDraft(config.assignedProductIds);
  }, [config]);

  function handleChange(next: string[]) {
    setDraft(next);
    setIsDirty(true);
  }

  async function handleSave() {
    await updateMutation.mutateAsync(draft);
    setIsDirty(false);
    message.success('Đã lưu.');
  }

  function handleDiscard() {
    if (config) setDraft(config.assignedProductIds);
    setIsDirty(false);
  }

  if (isLoading || !config) {
    return <Skeleton active />;
  }

  return (
    <>
      <ContextualSaveBar
        visible={isDirty}
        saving={updateMutation.isPending}
        label="Có thay đổi chưa lưu — Sản phẩm vay phổ biến"
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <Typography.Title level={4}>Sản phẩm vay phổ biến</Typography.Title>
      <Typography.Paragraph type="secondary">
        Chọn và sắp xếp các sản phẩm vay tiền mặt hiển thị ở mục "Phổ biến" trên app.
      </Typography.Paragraph>
      <AssignedProductsEditor catalog={CASH_LOAN_CATALOG} value={draft} onChange={handleChange} />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Lịch sử thay đổi
      </Typography.Title>
      <Table
        rowKey="id"
        dataSource={config.history}
        pagination={false}
        size="small"
        columns={[
          { title: 'Thời gian', dataIndex: 'changedAt' },
          { title: 'Người thực hiện', dataIndex: 'changedBy' },
          { title: 'Hành động', dataIndex: 'action' }
        ]}
      />
    </>
  );
}
