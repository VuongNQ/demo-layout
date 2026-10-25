import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOfferType,
  getOfferTypeById,
  listOfferTypes,
  reorderOfferTypes,
  updateOfferType,
  type OfferTypeListParams
} from '@/services/offer-type.service';
import { offerTypeQueryKeys } from '@/queryKeys/offer-type.query-keys';
import type { OfferType } from '@/data/demo-data';

export function useOfferTypeListQuery(params: OfferTypeListParams) {
  return useQuery({
    queryKey: offerTypeQueryKeys.list(params),
    queryFn: () => listOfferTypes(params),
    placeholderData: keepPreviousData
  });
}

export function useOfferTypeDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: offerTypeQueryKeys.detail(id ?? ''),
    queryFn: () => getOfferTypeById(id as string),
    enabled: Boolean(id)
  });
}

export function useCreateOfferTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOfferType,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offerTypeQueryKeys.lists() });
    }
  });
}

export function useUpdateOfferTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<OfferType> }) => updateOfferType(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: offerTypeQueryKeys.lists() });
      queryClient.setQueryData(offerTypeQueryKeys.detail(updated.id), updated);
    }
  });
}

export function useReorderOfferTypesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderOfferTypes,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offerTypeQueryKeys.lists() });
    }
  });
}
