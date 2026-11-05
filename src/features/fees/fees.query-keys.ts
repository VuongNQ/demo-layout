export const feesQueryKeys = {
  all: () => ['fees'] as const,
  lists: () => [...feesQueryKeys.all(), 'list'] as const,
  details: () => [...feesQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...feesQueryKeys.details(), id] as const
};
