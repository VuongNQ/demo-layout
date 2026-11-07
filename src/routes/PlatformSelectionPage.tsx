import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { claudePath } from '@/claude/routes/route-meta';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { PlatformLinks } from './PlatformLinks';
import styles from './PlatformSelectionPage.module.scss';

export function PlatformSelectionPage() {
  const { t } = useTranslation(['common', 'navigation', 'chatgpt']);
  const destinations = [
    { key: 'claude', name: t('common:claude'), description: t('navigation:landingClaude'), path: claudePath('offerTypes') },
    { key: 'chatgpt', name: t('common:chatgpt'), description: t('navigation:landingChatgpt'), path: chatgptPath('overview') },
    { key: 'compare', name: t('common:compare'), description: t('navigation:landingCompare'), path: '/compare' }
  ];
  return <main className={styles.page}>
    <div className={styles.content}>
      <PlatformLinks />
      <p className={styles.eyebrow}>HDS Admin Next · {t('chatgpt:designPlayground', { ns: 'chatgpt' })}</p>
      <h1>{t('navigation:landingTitle')}</h1>
      <p className={styles.intro}>{t('navigation:landingIntro')}</p>
      <div className={styles.grid}>
        {destinations.map((item) => <section className={styles.card} key={item.key}>
          <h2>{item.name}</h2><p>{item.description}</p>
          <Link className={styles.link} to={item.path}>{t('common:open')} {item.name}<span aria-hidden="true"> →</span></Link>
        </section>)}
      </div>
      <p className={styles.note}>{t('navigation:landingNote')}</p>
    </div>
  </main>;
}
