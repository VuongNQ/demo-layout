import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPopularLoansConfig, updatePopularLoansConfig } from './popular-loans.service';
import { popularLoansQueryKeys } from './popular-loans.query-keys';

export function usePopularLoansConfigQuery() {
  return useQuery({ queryKey: popularLoansQueryKeys.config(), queryFn: getPopularLoansConfig });
}

export function useUpdatePopularLoansConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePopularLoansConfig,
    onSuccess: (updated) => {
      queryClient.setQueryData(popularLoansQueryKeys.config(), updated);
    }
  });
}
