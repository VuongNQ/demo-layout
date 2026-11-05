import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPromotionType,
  getPromotionTypeById,
  listPromotionTypes,
  togglePromotionTypeStatus,
  updatePromotionType
} from './promotion-types.service';
import { promotionTypesQueryKeys } from './promotion-types.query-keys';
import type { PromotionType } from './demo-promotion-types-data';

export function usePromotionTypesListQuery() {
  return useQuery({ queryKey: promotionTypesQueryKeys.lists(), queryFn: listPromotionTypes });
}

export function usePromotionTypeDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: promotionTypesQueryKeys.detail(id ?? ''),
    queryFn: () => getPromotionTypeById(id as string),
    enabled: Boolean(id)
  });
}

export function useCreatePromotionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPromotionType,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: promotionTypesQueryKeys.lists() });
    }
  });
}

export function useUpdatePromotionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PromotionType> }) => updatePromotionType(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: promotionTypesQueryKeys.lists() });
      queryClient.setQueryData(promotionTypesQueryKeys.detail(updated.id), updated);
    }
  });
}

export function useTogglePromotionTypeStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePromotionTypeStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: promotionTypesQueryKeys.lists() });
    }
  });
}
