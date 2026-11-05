import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDisplayInformationSetById,
  listDisplayInformationSets,
  updateDisplayInformationSet
} from './display-information-sets.service';
import { displayInformationSetsQueryKeys } from './display-information-sets.query-keys';
import type { DisplayInformationSet } from './demo-display-information-sets-data';

export function useDisplayInformationSetsListQuery() {
  return useQuery({ queryKey: displayInformationSetsQueryKeys.lists(), queryFn: listDisplayInformationSets });
}

export function useDisplayInformationSetDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: displayInformationSetsQueryKeys.detail(id ?? ''),
    queryFn: () => getDisplayInformationSetById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateDisplayInformationSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<DisplayInformationSet> }) =>
      updateDisplayInformationSet(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: displayInformationSetsQueryKeys.lists() });
      queryClient.setQueryData(displayInformationSetsQueryKeys.detail(updated.id), updated);
    }
  });
}
