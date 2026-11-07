import { useEffect, useRef } from 'react';
import { Button, Descriptions, Drawer, Result, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { claudePath } from '@/claude/routes/route-meta';
import { DEMO_PRODUCT_LABELS } from './demo-product-labels-data';
import { findProductLabel } from './product-labels.utils';
import styles from './ProductLabelQuickViewRoute.module.scss';

export function ProductLabelQuickViewRoute() {
  const { t, i18n } = useTranslation('claude');
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const item = findProductLabel(DEMO_PRODUCT_LABELS, id);
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  const listUrl = `${claudePath('productLabels')}${location.search}${location.hash}`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function close() {
    navigate(listUrl, { replace: true });
  }

  return (
    <Drawer
      open
      autoFocus
      keyboard
      destroyOnClose
      className={styles.drawer}
      aria-labelledby="product-label-quick-view-title"
      width="min(560px, 100vw)"
      title={
        <h2 id="product-label-quick-view-title" ref={headingRef} tabIndex={-1} className={styles.title}>
          {item ? t('pages.productLabels.quickViewTitle', { name: item.name }) : t('pages.productLabels.quickView')}
        </h2>
      }
      onClose={close}
      footer={<div className={styles.closeRow}><Button onClick={close}>{t('pages.productLabels.close')}</Button></div>}
    >
      {item ? (
        <>
          <Typography.Text type="secondary" className={styles.recordId}>
            {t('pages.productLabels.recordId', { id: item.id })}
          </Typography.Text>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('pages.productLabels.name')}><span className={styles.value}>{item.name}</span></Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.code')}><span className={styles.value}>{item.code}</span></Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.productLine')}>
              {t(`pages.productLabels.lines.${item.productLine}`)}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.status')}>
              {t(`pages.productLabels.statuses.${item.status}`)}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.classification')}>
              {item.classification ? t(`pages.productLabels.classifications.${item.classification}`) : t('pages.productLabels.notProvided')}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.associatedProduct')}>
              <span className={styles.value}>{item.associatedProductSummary ?? t('pages.productLabels.notProvided')}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.productLabels.lastUpdated')}>
              {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(item.updatedAt))}
            </Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Result
          status="404"
          title={t('pages.productLabels.notFoundTitle')}
          subTitle={t('pages.productLabels.notFoundDescription', { id: id ?? '' })}
          extra={<Button onClick={close}>{t('pages.productLabels.returnToList')}</Button>}
        />
      )}
    </Drawer>
  );
}
