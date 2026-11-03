export const backgroundLockQueryKeys = {
  all: () => ['background-locks'] as const,
  lists: () => [...backgroundLockQueryKeys.all(), 'list'] as const,
  details: () => [...backgroundLockQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...backgroundLockQueryKeys.details(), id] as const
};
