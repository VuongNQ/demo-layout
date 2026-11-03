import { List, Typography, Button } from 'antd';

export type LogEntry = { time: string; message: string };

export function EventLog({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography.Text strong>Nhật ký</Typography.Text>
        <Button size="small" onClick={onClear}>
          Xoá nhật ký
        </Button>
      </div>
      <List
        size="small"
        bordered
        style={{ maxHeight: 220, overflow: 'auto', marginTop: 8 }}
        dataSource={entries}
        locale={{ emptyText: 'Chưa có sự kiện nào.' }}
        renderItem={(entry) => (
          <List.Item>
            <Typography.Text type="secondary">{entry.time}</Typography.Text>&nbsp;{entry.message}
          </List.Item>
        )}
      />
    </div>
  );
}
