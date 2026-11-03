import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { Modal } from 'antd';

// Mirrors the real repo's useUnsavedChangesGuard: blocks navigation while
// `isDirty` is true, behind a stay/leave confirm, with a beforeunload
// fallback for an actual tab close/refresh. react-router 7's useBlocker
// only fires for a REAL navigation attempt (navigate() / <Link>) on a data
// router — a local setState close (setOpen(false)) never reaches it. That
// gap is the thing this experiment measures, not a simplification of this
// hook: the real repo's guard has exactly the same shape (Navigation API /
// popstate, not a generic "something changed" watcher).
export function useUnsavedChangesGuard(isDirty: boolean, onEvent?: (message: string) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!isDirty) return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    onEventRef.current?.('Guard CHẶN điều hướng — hiện modal xác nhận.');
    Modal.confirm({
      title: 'Rời khỏi trang?',
      content: 'Có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi?',
      okText: 'Rời khỏi',
      cancelText: 'Ở lại',
      onOk: () => {
        onEventRef.current?.('Người dùng chọn "Rời khỏi" — điều hướng tiếp tục.');
        blocker.proceed?.();
      },
      onCancel: () => {
        onEventRef.current?.('Người dùng chọn "Ở lại" — điều hướng bị huỷ.');
        blocker.reset?.();
      }
    });
  }, [blocker]);

  // Tab close / refresh fallback — cannot be demoed by a button click in
  // this experiment, but wired so the behavior matches the real guard.
  useEffect(() => {
    if (!isDirty) return;
    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
