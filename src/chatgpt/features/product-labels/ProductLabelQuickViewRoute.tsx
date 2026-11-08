import { useEffect, useRef } from 'react';
import { Button, Descriptions, Drawer, Result, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { DEMO_PRODUCT_LABELS } from '@/features/product-labels/demo-product-labels-data';
import { findProductLabel } from '@/features/product-labels/product-labels.utils';
import styles from './ProductLabelQuickViewRoute.module.scss';

export function ProductLabelQuickViewRoute() {
  const { t, i18n } = useTranslation('chatgpt');
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const item = findProductLabel(DEMO_PRODUCT_LABELS, id);
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  const listUrl = `${chatgptPath('productLabels')}${location.search}${location.hash}`;

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
          {item ? t('scenario1.productLabels.quickViewTitle', { name: item.name }) : t('scenario1.productLabels.quickView')}
        </h2>
      }
      onClose={close}
      footer={<div className={styles.closeRow}><Button onClick={close}>{t('scenario1.productLabels.close')}</Button></div>}
    >
      {item ? (
        <>
          <Typography.Text type="secondary" className={styles.recordId}>
            {t('scenario1.productLabels.recordId', { id: item.id })}
          </Typography.Text>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('scenario1.productLabels.name')}><span className={styles.value}>{item.name}</span></Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.code')}><span className={styles.value}>{item.code}</span></Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.productLine')}>
              {t(`scenario1.productLabels.lines.${item.productLine}`)}
            </Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.status')}>
              {t(`scenario1.productLabels.statuses.${item.status}`)}
            </Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.classification')}>
              {item.classification ? t(`scenario1.productLabels.classifications.${item.classification}`) : t('scenario1.productLabels.notProvided')}
            </Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.associatedProduct')}>
              <span className={styles.value}>{item.associatedProductSummary ?? t('scenario1.productLabels.notProvided')}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t('scenario1.productLabels.lastUpdated')}>
              {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(item.updatedAt))}
            </Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Result
          status="404"
          title={t('scenario1.productLabels.notFoundTitle')}
          subTitle={t('scenario1.productLabels.notFoundDescription', { id: id ?? '' })}
          extra={<Button onClick={close}>{t('scenario1.productLabels.returnToList')}</Button>}
        />
      )}
    </Drawer>
  );
}
