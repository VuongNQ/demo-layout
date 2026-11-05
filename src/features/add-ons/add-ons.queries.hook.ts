import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batchSetAddOnProductsStatus, getAddOnProductById, listAddOnProducts, updateAddOnProduct } from './add-ons.service';
import { addOnsQueryKeys } from './add-ons.query-keys';
import type { AddOnProduct } from './demo-add-ons-data';

export function useAddOnProductsListQuery() {
  return useQuery({ queryKey: addOnsQueryKeys.lists(), queryFn: listAddOnProducts });
}

export function useAddOnProductDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: addOnsQueryKeys.detail(id ?? ''),
    queryFn: () => getAddOnProductById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateAddOnProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AddOnProduct> }) => updateAddOnProduct(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: addOnsQueryKeys.lists() });
      queryClient.setQueryData(addOnsQueryKeys.detail(updated.id), updated);
    }
  });
}

export function useBatchSetAddOnProductsStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: AddOnProduct['status'] }) =>
      batchSetAddOnProductsStatus(ids, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addOnsQueryKeys.lists() });
    }
  });
}
