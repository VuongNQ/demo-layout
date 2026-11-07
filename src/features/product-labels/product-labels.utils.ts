import type { ProductLabel, ProductLabelProductLine, ProductLabelStatus } from './demo-product-labels-data';

export const PRODUCT_LABEL_PAGE_SIZE = 8;
export type ProductLabelFilters = { query: string; productLine: '' | ProductLabelProductLine; status: '' | ProductLabelStatus; page: number };

export function parseProductLabelFilters(search: string): ProductLabelFilters {
  const params = new URLSearchParams(search);
  const requestedPage = Number(params.get('page'));
  return {
    query: params.get('q') ?? '',
    productLine: params.get('line') === 'cash-loan' || params.get('line') === 'credit-card' ? params.get('line') as ProductLabelProductLine : '',
    status: params.get('status') === 'active' || params.get('status') === 'inactive' ? params.get('status') as ProductLabelStatus : '',
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  };
}

export function updateProductLabelSearch(search: string, changes: Partial<ProductLabelFilters>): string {
  const params = new URLSearchParams(search);
  const queryKeys: Record<keyof ProductLabelFilters, string> = { query: 'q', productLine: 'line', status: 'status', page: 'page' };
  for (const key of Object.keys(changes) as Array<keyof ProductLabelFilters>) {
    const value = changes[key];
    const serialized = key === 'page' ? String(value ?? 1) : String(value ?? '');
    if (key !== 'page' && serialized === '') params.delete(queryKeys[key]);
    else params.set(queryKeys[key], serialized);
  }
  return params.toString();
}

export function filterProductLabels(items: ProductLabel[], filters: ProductLabelFilters): ProductLabel[] {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) =>
    (!query || item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)) &&
    (!filters.productLine || item.productLine === filters.productLine) &&
    (!filters.status || item.status === filters.status)
  );
}

export function getProductLabelPage(items: ProductLabel[], page: number, pageSize = PRODUCT_LABEL_PAGE_SIZE): ProductLabel[] {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : PRODUCT_LABEL_PAGE_SIZE;
  return items.slice((safePage - 1) * safePageSize, safePage * safePageSize);
}

export function findProductLabel(items: ProductLabel[], id: string | undefined): ProductLabel | undefined {
  return items.find((item) => item.id === id);
}
