import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAttractiveOfferConfig, updateAttractiveOfferConfig } from './attractive-offer.service';
import { attractiveOfferQueryKeys } from './attractive-offer.query-keys';

export function useAttractiveOfferConfigQuery() {
  return useQuery({ queryKey: attractiveOfferQueryKeys.config(), queryFn: getAttractiveOfferConfig });
}

export function useUpdateAttractiveOfferConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAttractiveOfferConfig,
    onSuccess: (updated) => {
      queryClient.setQueryData(attractiveOfferQueryKeys.config(), updated);
    }
  });
}
