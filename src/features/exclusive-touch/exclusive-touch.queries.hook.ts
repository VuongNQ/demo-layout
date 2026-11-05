import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignProductsToLayoutType,
  getExclusiveTouchPreview,
  listLayoutTypes,
  updateExclusiveTouchPreview
} from './exclusive-touch.service';
import { exclusiveTouchQueryKeys } from './exclusive-touch.query-keys';
import type { ExclusiveTouchPreview } from './demo-exclusive-touch-data';

export function useLayoutTypesQuery() {
  return useQuery({ queryKey: exclusiveTouchQueryKeys.layoutTypes(), queryFn: listLayoutTypes });
}

export function useExclusiveTouchPreviewQuery() {
  return useQuery({ queryKey: exclusiveTouchQueryKeys.preview(), queryFn: getExclusiveTouchPreview });
}

export function useAssignProductsToLayoutTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ layoutTypeId, productIds }: { layoutTypeId: string; productIds: string[] }) =>
      assignProductsToLayoutType(layoutTypeId, productIds),
    onSuccess: (layoutTypes) => {
      queryClient.setQueryData(exclusiveTouchQueryKeys.layoutTypes(), layoutTypes);
    }
  });
}

export function useUpdateExclusiveTouchPreviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preview: ExclusiveTouchPreview) => updateExclusiveTouchPreview(preview),
    onSuccess: (preview) => {
      queryClient.setQueryData(exclusiveTouchQueryKeys.preview(), preview);
    }
  });
}
