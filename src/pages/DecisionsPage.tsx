import { claudePath } from '@/claude/routes/route-meta';
import { useState } from 'react';
import { Card, Typography, Input, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type DecisionItem = {
  id: string;
  linkTo?: string;
};

const DECISIONS: DecisionItem[] = [
  { id: 'drawer-vs-page-threshold', linkTo: claudePath('offerTypes') },
  { id: 'brand-token' },
  { id: 'unsaved-changes-overlay', linkTo: claudePath('unsavedChanges') },
  { id: 'breadcrumb-no-menu', linkTo: claudePath('offerTypes') },
  { id: 'global-search' },
  { id: 'sidebar-depth' },
  { id: 'edit-route-pattern', linkTo: claudePath('offerTypes') },
  { id: 'reorder-pagination-mode', linkTo: claudePath('reorderPagination') }
];

const DECISION_LABELS: Record<string, { title: string; context: string; link?: string }> = {
  'drawer-vs-page-threshold': { title: 'offerThreshold', context: 'offerThresholdContext', link: 'offerLink' },
  'brand-token': { title: 'brandToken', context: 'brandTokenContext' },
  'unsaved-changes-overlay': { title: 'unsaved', context: 'unsavedContext', link: 'runUnsaved' },
  'breadcrumb-no-menu': { title: 'breadcrumb', context: 'breadcrumbContext', link: 'openFullPage' },
  'global-search': { title: 'search', context: 'searchContext' },
  'sidebar-depth': { title: 'depth', context: 'depthContext' },
  'edit-route-pattern': { title: 'editRoute', context: 'editRouteContext', link: 'offerLinkShort' },
  'reorder-pagination-mode': { title: 'reorder', context: 'reorderContext', link: 'runReorder' }
};

function loadNote(id: string): string {
  try {
    return localStorage.getItem(`decision-note:${id}`) ?? '';
  } catch {
    return '';
  }
}

function saveNote(id: string, value: string) {
  try {
    localStorage.setItem(`decision-note:${id}`, value);
  } catch {
    // Private window / blocked storage — note simply won't persist across
    // a reload. Acceptable for a meeting-time scratch pad.
  }
}

function DecisionCard({ item }: { item: DecisionItem }) {
  const { t } = useTranslation('claude');
  const [note, setNote] = useState(() => loadNote(item.id));
  const label = DECISION_LABELS[item.id];

  return (
    <Card size="small" style={{ marginBottom: 12 }} title={t(`pages.decisions.${label.title}`)}>
      <Typography.Paragraph>{t(`pages.decisions.${label.context}`)}</Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }}>
        {item.linkTo && label.link && (
          <Link to={item.linkTo}>
            <Tag color="blue">{t(`pages.decisions.${label.link}`)}</Tag>
          </Link>
        )}
        <Input.TextArea
          placeholder={t('pages.decisions.placeholder')}
          rows={2}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            saveNote(item.id, e.target.value);
          }}
        />
      </Space>
    </Card>
  );
}

export function DecisionsPage() {
  const { t } = useTranslation('claude');
  return (
    <>
      <Typography.Title level={3}>{t('pages.decisions.title')}</Typography.Title>
      <Typography.Paragraph type="secondary">
        {t('pages.decisions.intro')}
      </Typography.Paragraph>
      {DECISIONS.map((item) => (
        <DecisionCard key={item.id} item={item} />
      ))}
    </>
  );
}
