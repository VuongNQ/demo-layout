import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRequiredInformationById, listRequiredInformation, updateRequiredInformation } from './required-information.service';
import { requiredInformationQueryKeys } from './required-information.query-keys';
import type { RequiredInformation } from './demo-required-information-data';

export function useRequiredInformationListQuery() {
  return useQuery({ queryKey: requiredInformationQueryKeys.lists(), queryFn: listRequiredInformation });
}

export function useRequiredInformationDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: requiredInformationQueryKeys.detail(id ?? ''),
    queryFn: () => getRequiredInformationById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateRequiredInformationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<RequiredInformation> }) =>
      updateRequiredInformation(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: requiredInformationQueryKeys.lists() });
      queryClient.setQueryData(requiredInformationQueryKeys.detail(updated.id), updated);
    }
  });
}
