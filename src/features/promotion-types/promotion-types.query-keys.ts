export const promotionTypesQueryKeys = {
  all: () => ['promotion-types'] as const,
  lists: () => [...promotionTypesQueryKeys.all(), 'list'] as const,
  details: () => [...promotionTypesQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...promotionTypesQueryKeys.details(), id] as const
};
