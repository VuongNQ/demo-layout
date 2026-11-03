import { Button, Typography } from 'antd';
import styles from './ContextualSaveBar.module.scss';

type ContextualSaveBarProps = {
  visible: boolean;
  saving?: boolean;
  label?: string;
  onSave: () => void;
  onDiscard: () => void;
};

// Shopify's "contextual save bar": slides down to COVER the top chrome
// (here: AppLayout's Header) the moment a form becomes dirty, instead of
// a save button living only at the bottom of a long form. Fixed to the
// viewport, so it is visible regardless of scroll position — the point
// of the pattern is that Save/Discard are reachable without scrolling
// back up or down.
//
// Pair this with the spacer below (same component, rendered once at the
// top of the page content) so the page doesn't jump when the bar's fixed
// overlay appears — see ProductSettingsEditPage for the usage.
export function ContextualSaveBar({ visible, saving, label, onSave, onDiscard }: ContextualSaveBarProps) {
  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      <Typography.Text style={{ color: '#fff' }}>{label ?? 'Có thay đổi chưa lưu'}</Typography.Text>
      <div>
        <Button type="text" style={{ color: '#fff' }} onClick={onDiscard} disabled={saving}>
          Huỷ thay đổi
        </Button>
        <Button type="primary" onClick={onSave} loading={saving}>
          Lưu
        </Button>
      </div>
    </div>
  );
}

// Keeps page content from jumping under the fixed bar above. Place this
// immediately where the bar visually covers — in this app, right at the
// top of a full-page route's own content (not globally in AppLayout,
// since only pages that opt into a save bar need the extra space).
export function ContextualSaveBarSpacer({ visible }: { visible: boolean }) {
  return <div className={`${styles.spacer} ${visible ? styles.visible : ''}`} />;
}
