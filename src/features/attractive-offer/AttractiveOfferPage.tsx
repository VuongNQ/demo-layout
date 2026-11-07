import { useEffect, useState } from 'react';
import { Skeleton, Typography, message, Table, Input, Switch, Space } from 'antd';
import { AssignedProductsEditor } from '@/components/AssignedProductsEditor';
import { CASH_LOAN_CATALOG } from './demo-attractive-offer-data';
import { useAttractiveOfferConfigQuery, useUpdateAttractiveOfferConfigMutation } from './attractive-offer.queries.hook';
import { ContextualSaveBar, ContextualSaveBarSpacer } from '@/components/ContextualSaveBar';
import { useTranslation } from 'react-i18next';

type Draft = { name: string; enabled: boolean; assignedProductIds: string[] };

// Single-config page — no list, no :id route, no create. Same
// "reorder assigned products" shape as Popular Loans (see
// AssignedProductsEditor), plus a name + on/off toggle this module has
// and Popular Loans doesn't.
export function AttractiveOfferPage() {
  const { t } = useTranslation('claude');
  const { data: config, isLoading } = useAttractiveOfferConfigQuery();
  const updateMutation = useUpdateAttractiveOfferConfigMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (config) setDraft({ name: config.name, enabled: config.enabled, assignedProductIds: config.assignedProductIds });
  }, [config]);

  function update(patch: Partial<Draft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsDirty(true);
  }

  async function handleSave() {
    if (!draft) return;
    await updateMutation.mutateAsync(draft);
    setIsDirty(false);
    message.success(t('pages.attractiveOffer.saved'));
  }

  function handleDiscard() {
    if (config) setDraft({ name: config.name, enabled: config.enabled, assignedProductIds: config.assignedProductIds });
    setIsDirty(false);
  }

  if (isLoading || !config || !draft) {
    return <Skeleton active />;
  }

  return (
    <>
      <ContextualSaveBar
        visible={isDirty}
        saving={updateMutation.isPending}
        label={t('pages.attractiveOffer.dirty')}
        onSave={() => void handleSave()}
        onDiscard={handleDiscard}
      />
      <ContextualSaveBarSpacer visible={isDirty} />
      <Typography.Title level={4}>{t('pages.attractiveOffer.title')}</Typography.Title>

      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space align="center">
          <Switch checked={draft.enabled} onChange={(v) => update({ enabled: v })} />
          <Typography.Text>{draft.enabled ? t('pages.attractiveOffer.enabled') : t('pages.attractiveOffer.disabled')}</Typography.Text>
        </Space>
        <Input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder={t('pages.attractiveOffer.name')}
          style={{ maxWidth: 400 }}
        />
      </Space>

      <AssignedProductsEditor
        catalog={CASH_LOAN_CATALOG}
        value={draft.assignedProductIds}
        onChange={(next) => update({ assignedProductIds: next })}
      />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        {t('pages.attractiveOffer.history')}
      </Typography.Title>
      <Table
        rowKey="id"
        dataSource={config.history}
        pagination={false}
        size="small"
        columns={[
          { title: t('pages.attractiveOffer.time'), dataIndex: 'changedAt' },
          { title: t('pages.attractiveOffer.actor'), dataIndex: 'changedBy' },
          { title: t('pages.attractiveOffer.action'), dataIndex: 'action' }
        ]}
      />
    </>
  );
}
