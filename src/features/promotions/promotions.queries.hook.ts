import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPromotion, getPromotionById, listPromotions, updatePromotion } from './promotions.service';
import { promotionsQueryKeys } from './promotions.query-keys';
import type { Promotion } from './demo-promotions-data';

export function usePromotionsListQuery() {
  return useQuery({ queryKey: promotionsQueryKeys.lists(), queryFn: listPromotions });
}

export function usePromotionDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: promotionsQueryKeys.detail(id ?? ''),
    queryFn: () => getPromotionById(id as string),
    enabled: Boolean(id)
  });
}

export function useCreatePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
    }
  });
}

export function useUpdatePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Promotion> }) => updatePromotion(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
      queryClient.setQueryData(promotionsQueryKeys.detail(updated.id), updated);
    }
  });
}
