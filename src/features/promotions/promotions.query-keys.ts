export const promotionsQueryKeys = {
  all: () => ['promotions'] as const,
  lists: () => [...promotionsQueryKeys.all(), 'list'] as const,
  details: () => [...promotionsQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...promotionsQueryKeys.details(), id] as const
};
