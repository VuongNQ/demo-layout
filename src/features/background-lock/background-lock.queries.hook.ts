import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBackgroundLockById,
  listBackgroundLocks,
  reorderBackgroundLocks,
  updateBackgroundLock
} from './background-lock.service';
import { backgroundLockQueryKeys } from './background-lock.query-keys';
import type { BackgroundLock } from './demo-background-lock-data';

export function useBackgroundLockListQuery() {
  return useQuery({ queryKey: backgroundLockQueryKeys.lists(), queryFn: listBackgroundLocks });
}

export function useBackgroundLockDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: backgroundLockQueryKeys.detail(id ?? ''),
    queryFn: () => getBackgroundLockById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateBackgroundLockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BackgroundLock> }) => updateBackgroundLock(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: backgroundLockQueryKeys.lists() });
      queryClient.setQueryData(backgroundLockQueryKeys.detail(updated.id), updated);
    }
  });
}

export function useReorderBackgroundLocksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderBackgroundLocks,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backgroundLockQueryKeys.lists() });
    }
  });
}
