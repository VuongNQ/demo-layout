import { Alert, Card, Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { chatgptPath } from '../routes/route-meta';
import styles from './ChatGPTOverviewPage.module.scss';

export function ChatGPTOverviewPage() {
  const { t } = useTranslation('chatgpt');
  return (
    <div className={styles.stack}>
      <Card title={t('workspaceFoundation')} className={styles.card}>
        <p>{t('foundationDescription')}</p>
        <p><Link to={chatgptPath('showcase')}>{t('reviewShowcase')}</Link></p>
      </Card>
      <div className={styles.stateGrid} aria-label={t('lifecycleExamples')}>
        <Card title={t('loadingTitle')} className={styles.card}><div className={styles.state}><Spin aria-label={t('loadingTitle')} /><span>{t('loadingExample')}</span></div></Card>
        <Card title={t('emptyTitle')} className={styles.card}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('emptyExample')} /></Card>
        <Card title={t('errorTitle')} className={styles.card}><Alert type="error" showIcon message={t('errorExample')} description={t('errorHelp')} /></Card>
      </div>
    </div>
  );
}
