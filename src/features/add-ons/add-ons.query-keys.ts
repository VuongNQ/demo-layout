export const addOnsQueryKeys = {
  all: () => ['add-ons'] as const,
  lists: () => [...addOnsQueryKeys.all(), 'list'] as const,
  details: () => [...addOnsQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...addOnsQueryKeys.details(), id] as const
};
