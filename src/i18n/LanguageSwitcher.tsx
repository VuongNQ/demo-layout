import { useTranslation } from 'react-i18next';
import { setAppLanguage, type AppLanguage } from './index';
import styles from './LanguageSwitcher.module.scss';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const language: AppLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'vi';

  return (
    <label className={styles.control}>
      <span>{t('language')}</span>
      <select
        aria-label={t('language')}
        value={language}
        onChange={(event) => void setAppLanguage(event.currentTarget.value as AppLanguage)}
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
