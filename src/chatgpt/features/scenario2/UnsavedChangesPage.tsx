import { Alert, Card, Space, Table, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import styles from './UnsavedChangesPage.module.scss';

export type DraftRecord = { id: string; name: string; note: string };
export type UnsavedChangesContext = {
  records: DraftRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DraftRecord[]>>;
  setNotice: (notice: string) => void;
};

const INITIAL_RECORDS: DraftRecord[] = [
  { id: 'demo-campaign-1', name: 'Spring welcome offer', note: 'Review eligibility summary.' },
  { id: 'demo-campaign-2', name: 'Everyday card reminder', note: 'Keep the existing schedule.' }
];

export function UnsavedChangesPage() {
  const { t } = useTranslation('chatgpt');
  const location = useLocation();
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [notice, setNotice] = useState('');
  const context: UnsavedChangesContext = { records, setRecords, setNotice };

  return (
    <div className={styles.page}>
      <Typography.Title level={1}>{t('pages.scenario2.title')}</Typography.Title>
      <Typography.Paragraph>{t('pages.scenario2.intro')}</Typography.Paragraph>
      <Alert className={styles.notice} type="info" showIcon message={t('pages.scenario2.lifetime')} />
      {notice && <Alert className={styles.notice} type="success" showIcon role="status" message={notice} />}
      <Card title={t('pages.scenario2.listTitle')}>
        <Table<DraftRecord>
          rowKey="id"
          pagination={false}
          dataSource={records}
          columns={[
            { title: t('pages.scenario2.name'), dataIndex: 'name' },
            { title: t('pages.scenario2.note'), dataIndex: 'note' },
            {
              title: t('pages.scenario2.actions'),
              key: 'actions',
              render: (_, record) => <Link to={{ pathname: `${chatgptPath('unsavedChanges')}/${record.id}`, search: location.search, hash: location.hash }}>{t('pages.scenario2.open')}</Link>
            }
          ]}
        />
      </Card>
      <Card className={styles.instructions} title={t('pages.scenario2.exitTitle')}>
        <Typography.Paragraph>{t('pages.scenario2.exitInstructions')}</Typography.Paragraph>
        <Space wrap>
          {records.map((record) => <Link key={record.id} to={{ pathname: `${chatgptPath('unsavedChanges')}/${record.id}`, search: location.search, hash: location.hash }}>{t('pages.scenario2.openRecord', { name: record.name })}</Link>)}
        </Space>
      </Card>
      <Outlet context={context} />
    </div>
  );
}
