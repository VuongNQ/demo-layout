import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { claudePath } from '@/claude/routes/route-meta';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import styles from './PlatformLinks.module.scss';

export function PlatformLinks() {
  const { t } = useTranslation(['common', 'navigation']);
  return <nav className={styles.links} aria-label={t('navigation:switcher')}>
    <Link to="/">{t('common:platforms')}</Link>
    <Link to={claudePath('offerTypes')}>{t('common:claude')}</Link>
    <Link to={chatgptPath('overview')}>{t('common:chatgpt')}</Link>
    <Link to="/compare">{t('common:compare')}</Link>
    <LanguageSwitcher />
  </nav>;
}
