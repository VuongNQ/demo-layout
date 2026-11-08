import { useEffect, useState } from 'react';
import { Skeleton, Typography, message, Table } from 'antd';
import { AssignedProductsEditor } from '@/components/AssignedProductsEditor';
import { CASH_LOAN_CATALOG } from './demo-popular-loans-data';
import { usePopularLoansConfigQuery, useUpdatePopularLoansConfigMutation } from './popular-loans.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import { useTranslation } from 'react-i18next';

// Single-config page — no list, no :id route, matching the real submodule
// (view/edit ONE cash-loan collection, not a set of records).
export function PopularLoansPage() {
  const { t } = useTranslation('claude');
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
    message.success(t('pages.popularLoans.saved'));
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
        label={t('pages.popularLoans.dirty')}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <Typography.Title level={4}>{t('pages.popularLoans.title')}</Typography.Title>
      <Typography.Paragraph type="secondary">
        {t('pages.popularLoans.description')}
      </Typography.Paragraph>
      <AssignedProductsEditor catalog={CASH_LOAN_CATALOG} value={draft} onChange={handleChange} />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        {t('pages.popularLoans.history')}
      </Typography.Title>
      <Table
        rowKey="id"
        dataSource={config.history}
        pagination={false}
        size="small"
        columns={[
          { title: t('pages.popularLoans.time'), dataIndex: 'changedAt' },
          { title: t('pages.popularLoans.actor'), dataIndex: 'changedBy' },
          { title: t('pages.popularLoans.action'), dataIndex: 'action' }
        ]}
      />
    </>
  );
}
