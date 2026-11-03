// Key factory only, no service import — same convention as offer-type.
export const productSyncQueryKeys = {
  all: () => ['product-sync'] as const,
  rows: () => [...productSyncQueryKeys.all(), 'rows'] as const,
  kpis: () => [...productSyncQueryKeys.all(), 'kpis'] as const,
  history: () => [...productSyncQueryKeys.all(), 'history'] as const
};
