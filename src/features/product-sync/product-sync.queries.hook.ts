import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSyncHistory, getSyncKpis, listSyncRows, triggerSync } from './product-sync.service';
import { productSyncQueryKeys } from './product-sync.query-keys';

export function useSyncRowsQuery() {
  return useQuery({ queryKey: productSyncQueryKeys.rows(), queryFn: listSyncRows });
}

export function useSyncKpisQuery() {
  return useQuery({ queryKey: productSyncQueryKeys.kpis(), queryFn: getSyncKpis });
}

export function useSyncHistoryQuery(enabled: boolean) {
  return useQuery({ queryKey: productSyncQueryKeys.history(), queryFn: getSyncHistory, enabled });
}

export function useTriggerSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productSyncQueryKeys.rows() });
      void queryClient.invalidateQueries({ queryKey: productSyncQueryKeys.kpis() });
    }
  });
}
