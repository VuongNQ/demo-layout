import { Empty, Input, Select, Table, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { chatgptPath } from '@/chatgpt/routes/route-meta';
import { DEMO_PRODUCT_LABELS, type ProductLabel, type ProductLabelProductLine, type ProductLabelStatus } from '@/features/product-labels/demo-product-labels-data';
import { filterProductLabels, getProductLabelPage, parseProductLabelFilters, PRODUCT_LABEL_PAGE_SIZE, updateProductLabelSearch } from '@/features/product-labels/product-labels.utils';
import styles from './ProductLabelsListPage.module.scss';

export function ProductLabelsListPage() {
  const { t } = useTranslation('chatgpt');
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const listPath = chatgptPath('productLabels');
  const previousPathname = useRef(location.pathname);
  const filters = parseProductLabelFilters(location.search);
  const filtered = useMemo(() => filterProductLabels(DEMO_PRODUCT_LABELS, filters), [filters.query, filters.productLine, filters.status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCT_LABEL_PAGE_SIZE));
  const currentPage = Math.min(filters.page, pageCount);
  const pageItems = getProductLabelPage(filtered, currentPage);

  useEffect(() => {
    const previousPathnameValue = previousPathname.current;
    if (previousPathnameValue.startsWith(`${listPath}/`) && location.pathname === listPath) {
      const rawId = previousPathnameValue.slice(listPath.length + 1);
      let id = rawId;
      try {
        id = decodeURIComponent(rawId);
      } catch {
        // A malformed deep-link segment falls back to the list heading.
      }
      window.requestAnimationFrame(() => {
        const trigger = document.getElementById(`product-label-view-${id}`);
        (trigger ?? document.getElementById('product-labels-list-heading'))?.focus();
      });
    }
    previousPathname.current = location.pathname;
  }, [listPath, location.pathname]);

  function updateFilters(changes: Partial<typeof filters>, replace = true) {
    const nextSearch = updateProductLabelSearch(location.search, changes);
    setSearchParams(new URLSearchParams(nextSearch), { replace });
  }

  const columns: ColumnsType<ProductLabel> = [
    { title: t('scenario1.productLabels.name'), dataIndex: 'name', key: 'name' },
    { title: t('scenario1.productLabels.code'), dataIndex: 'code', key: 'code' },
    {
      title: t('scenario1.productLabels.productLine'), dataIndex: 'productLine', key: 'productLine',
      render: (line: ProductLabelProductLine) => t(`scenario1.productLabels.lines.${line}`)
    },
    {
      title: t('scenario1.productLabels.status'), dataIndex: 'status', key: 'status',
      render: (status: ProductLabelStatus) => t(`scenario1.productLabels.statuses.${status}`)
    },
    {
      title: t('scenario1.productLabels.actions'), key: 'actions',
      render: (_, record) => (
        <Link
          id={`product-label-view-${record.id}`}
          className={styles.rowAction}
          aria-label={t('scenario1.productLabels.viewDetailsFor', { name: record.name })}
          to={{ pathname: chatgptPath('productLabelDetail', { id: record.id }), search: location.search, hash: location.hash }}
        >
          {t('scenario1.productLabels.viewDetails')}
        </Link>
      )
    }
  ];

  return (
    <section className={styles.page} aria-labelledby="product-labels-list-heading">
      <Typography.Title level={1} id="product-labels-list-heading" tabIndex={-1} className={styles.heading}>
        {t('scenario1.productLabels.title')}
      </Typography.Title>
      <div className={styles.filters} role="group" aria-label={t('scenario1.productLabels.filters')}>
        <Input
          allowClear
          value={filters.query}
          prefix={<SearchOutlined aria-hidden="true" />}
          aria-label={t('scenario1.productLabels.search')}
          placeholder={t('scenario1.productLabels.searchPlaceholder')}
          onChange={(event) => updateFilters({ query: event.target.value, page: 1 })}
        />
        <Select
          value={filters.productLine || undefined}
          allowClear
          aria-label={t('scenario1.productLabels.productLineFilter')}
          placeholder={t('scenario1.productLabels.allProductLines')}
          options={[
            { value: 'cash-loan', label: t('scenario1.productLabels.lines.cash-loan') },
            { value: 'credit-card', label: t('scenario1.productLabels.lines.credit-card') }
          ]}
          onChange={(value) => updateFilters({ productLine: value ?? '', page: 1 })}
        />
        <Select
          value={filters.status || undefined}
          allowClear
          aria-label={t('scenario1.productLabels.statusFilter')}
          placeholder={t('scenario1.productLabels.allStatuses')}
          options={[
            { value: 'active', label: t('scenario1.productLabels.statuses.active') },
            { value: 'inactive', label: t('scenario1.productLabels.statuses.inactive') }
          ]}
          onChange={(value) => updateFilters({ status: value ?? '', page: 1 })}
        />
      </div>
      <div className={styles.tableWrap}>
        <Table<ProductLabel>
          rowKey="id"
          dataSource={pageItems}
          columns={columns}
          scroll={{ x: 720 }}
          locale={{ emptyText: <Empty description={t('scenario1.productLabels.empty')} /> }}
          pagination={{
            current: currentPage,
            pageSize: PRODUCT_LABEL_PAGE_SIZE,
            total: filtered.length,
            showSizeChanger: false,
            showTotal: (total, range) => t('scenario1.productLabels.range', { from: range[0], to: range[1], total }),
            onChange: (page) => updateFilters({ page }, false)
          }}
        />
      </div>
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {t('scenario1.productLabels.resultCount', { count: filtered.length })}
      </span>
      <Outlet />
    </section>
  );
}
