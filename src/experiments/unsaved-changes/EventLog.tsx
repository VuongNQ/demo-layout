import { List, Typography, Button } from 'antd';
import { useTranslation } from 'react-i18next';

export type LogEntry = { time: string; message: string };

export function EventLog({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  const { t } = useTranslation('claude');
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography.Text strong>{t('pages.experiments.log')}</Typography.Text>
        <Button size="small" onClick={onClear}>
          {t('pages.experiments.clearLog')}
        </Button>
      </div>
      <List
        size="small"
        bordered
        style={{ maxHeight: 220, overflow: 'auto', marginTop: 8 }}
        dataSource={entries}
        locale={{ emptyText: t('pages.experiments.noEvents') }}
        renderItem={(entry) => (
          <List.Item>
            <Typography.Text type="secondary">{entry.time}</Typography.Text>&nbsp;{entry.message}
          </List.Item>
        )}
      />
    </div>
  );
}
