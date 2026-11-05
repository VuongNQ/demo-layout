import { Drawer, Checkbox, Space, Button } from 'antd';
import { useState, useEffect } from 'react';
import { PRODUCT_CATALOG, type LayoutType } from './demo-exclusive-touch-data';
import { useAssignProductsToLayoutTypeMutation } from './exclusive-touch.queries.hook';

type Props = {
  layoutType: LayoutType | null;
  onClose: () => void;
};

// Bulk-assign via checkbox list, not per-product CRUD — matches the real
// submodule's "bulk-assigns products to a layout type" shape.
export function AssignProductsDrawer({ layoutType, onClose }: Props) {
  const assignMutation = useAssignProductsToLayoutTypeMutation();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (layoutType) setSelected(layoutType.assignedProductIds);
  }, [layoutType]);

  async function handleSave() {
    if (!layoutType) return;
    await assignMutation.mutateAsync({ layoutTypeId: layoutType.id, productIds: selected });
    onClose();
  }

  return (
    <Drawer
      open={layoutType !== null}
      title={`Gán sản phẩm: ${layoutType?.name ?? ''}`}
      width={420}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={assignMutation.isPending} onClick={() => void handleSave()}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Checkbox.Group
        value={selected}
        onChange={(checked) => setSelected(checked as string[])}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        options={PRODUCT_CATALOG.map((p) => ({ value: p.id, label: p.name }))}
      />
    </Drawer>
  );
}
