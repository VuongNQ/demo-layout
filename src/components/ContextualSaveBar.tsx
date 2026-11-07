import { Button, Typography } from 'antd';
import styles from './ContextualSaveBar.module.scss';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('claude');
  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      <Typography.Text style={{ color: '#fff' }}>{label ?? t('common:unsavedChanges')}</Typography.Text>
      <div>
        <Button type="text" style={{ color: '#fff' }} onClick={onDiscard} disabled={saving}>
          {t('common:discardChanges')}
        </Button>
        <Button type="primary" onClick={onSave} loading={saving}>
          {t('common:save')}
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
