import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeeById, listFees, updateFee } from './fees.service';
import { feesQueryKeys } from './fees.query-keys';
import type { FeeDefinition } from './demo-fees-data';

export function useFeesListQuery() {
  return useQuery({ queryKey: feesQueryKeys.lists(), queryFn: listFees });
}

export function useFeeDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: feesQueryKeys.detail(id ?? ''),
    queryFn: () => getFeeById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateFeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FeeDefinition> }) => updateFee(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: feesQueryKeys.lists() });
      queryClient.setQueryData(feesQueryKeys.detail(updated.id), updated);
    }
  });
}
