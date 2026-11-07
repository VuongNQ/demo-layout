import { useRef } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, useNavigation } from 'react-router-dom';
import { chatgptMenuGroups, chatgptMenuItem } from '../navigation/menu-meta';
import { chatgptPath } from '../routes/route-meta';
import { chatgptCssVars, chatgptTheme } from '../theme/chatgptTheme';
import { PlatformLinks } from '@/routes/PlatformLinks';
import styles from './ChatGPTLayout.module.scss';

export function ChatGPTLayout() {
  const { t } = useTranslation(['chatgpt', 'navigation']);
  const root = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const pageId = pathname === chatgptPath('showcase') ? 'showcase' : 'overview';

  return (
    <div className={styles.root} style={chatgptCssVars} ref={root}>
      <ConfigProvider
        theme={chatgptTheme}
        getPopupContainer={(trigger) => trigger?.parentElement ?? root.current ?? document.body}
      >
        <a className={styles.skip} href="#chatgpt-main">{t('chatgpt:skip')}</a>
        <div className={styles.frame}>
          <aside className={styles.sidebar} aria-label={t('chatgpt:primaryNavigation')}>
            <div className={styles.brand}><span className={styles.mark} aria-hidden="true">H</span><span>HDS Admin Next<small>{t('chatgpt:designPlayground')}</small></span></div>
            <nav aria-label={t('navigation:primary')}>
              {chatgptMenuGroups.map((group) => (
                <div className={styles.group} key={group.label}>
                  <div className={styles.groupLabel}>{group.items[0] === 'overview' ? t('chatgpt:operations') : t('chatgpt:designSystem')}</div>
                  {group.items.map((id) => {
                    const item = chatgptMenuItem(id);
                    return <NavLink end key={id} to={item.path} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>{t(`chatgpt:${id}`)}</NavLink>;
                  })}
                </div>
              ))}
            </nav>
            <p className={styles.disclaimer}>{t('chatgpt:fictionalDisclaimer')}</p>
          </aside>
          <div className={styles.mainColumn}>
            <header className={styles.topbar}><span>{t('chatgpt:workspaceTitle')}</span><PlatformLinks /><span className={styles.prototype}>{t('common:prototype', { ns: 'common' })}</span></header>
            <main id="chatgpt-main" className={styles.main} tabIndex={-1}>
              <nav className={styles.breadcrumb} aria-label={t('navigation:breadcrumb')}>{t('navigation:workspace')} <span aria-hidden="true">/</span> {t(`chatgpt:${pageId}`)}</nav>
              <div className={styles.pageHeader}><h1>{t(pageId === 'overview' ? 'overviewTitle' : 'showcaseTitle')}</h1><p>{t(pageId === 'overview' ? 'overviewDescription' : 'showcaseDescription')}</p></div>
              {navigation.state !== 'idle' && <div className={styles.pending} role="status"><Spin size="small" /> {t('common:loading', { ns: 'common' })}</div>}
              <Outlet />
            </main>
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
}
