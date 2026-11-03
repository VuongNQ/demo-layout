export const productSettingsQueryKeys = {
  all: () => ['product-settings'] as const,
  lists: () => [...productSettingsQueryKeys.all(), 'list'] as const,
  details: () => [...productSettingsQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...productSettingsQueryKeys.details(), id] as const
};
