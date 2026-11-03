import { createContext, useContext, type PropsWithChildren } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';

type RowContextValue = {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  listeners?: DraggableSyntheticListeners;
};

const RowContext = createContext<RowContextValue>({ setActivatorNodeRef: () => {} });

// Drag handle cell — the `:: ` icon column from the layout proposals,
// using the same HolderOutlined icon suggested there. Only this cell is
// draggable, not the whole row, so clicking elsewhere in the row (e.g. a
// "Cài đặt" action link) still works normally.
export function DragHandle() {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <HolderOutlined
      ref={setActivatorNodeRef}
      {...listeners}
      style={{ cursor: 'grab', touchAction: 'none' }}
    />
  );
}

type SortableRowProps = PropsWithChildren<{ 'data-row-key': string }>;

export function SortableRow({ children, ...props }: SortableRowProps) {
  const rowKey = props['data-row-key'];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: rowKey });

  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 10, background: '#fafafa' } : {})
  };

  return (
    <RowContext.Provider value={{ setActivatorNodeRef, listeners }}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes}>
        {children}
      </tr>
    </RowContext.Provider>
  );
}
