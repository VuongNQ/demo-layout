import { List, Select, Button, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } from '@ant-design/icons';

export type ProductCatalogItem = { id: string; name: string };

type Props = {
  catalog: ProductCatalogItem[];
  value: string[];
  onChange: (next: string[]) => void;
};

// Single-record "collection config" pattern — an ordered list of assigned
// products with move-up/down and remove, plus a select-to-add control.
// Deliberately NOT dnd-kit: the repo's drag-drop reorder is already
// explored in experiment 2 (reorder-pagination); this is a second,
// lighter-weight reorder interaction for a short (3-6 item) list, so the
// two can be compared side by side rather than reusing the same mechanism
// everywhere a list can be reordered. Shared by Popular Loans and
// Attractive Offer, which both "select/reorder assigned products".
export function AssignedProductsEditor({ catalog, value, onChange }: Props) {
  const catalogById = new Map(catalog.map((item) => [item.id, item.name]));
  const availableOptions = catalog.filter((item) => !value.includes(item.id)).map((item) => ({ value: item.id, label: item.name }));

  function move(index: number, direction: -1 | 1) {
    const next = [...value];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <List
        bordered
        dataSource={value}
        locale={{ emptyText: 'Chưa gán sản phẩm nào' }}
        renderItem={(id, index) => (
          <List.Item
            actions={[
              <Button key="up" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, -1)} />,
              <Button
                key="down"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              />,
              <Button key="remove" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(id)} />
            ]}
          >
            <Typography.Text>
              {index + 1}. {catalogById.get(id) ?? id}
            </Typography.Text>
          </List.Item>
        )}
      />
      <Select
        style={{ width: '100%' }}
        placeholder="Thêm sản phẩm vào danh sách"
        options={availableOptions}
        value={null}
        onChange={(id: string) => onChange([...value, id])}
      />
    </Space>
  );
}
