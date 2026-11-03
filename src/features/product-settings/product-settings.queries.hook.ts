import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductSettingsById, listProductSettings, updateProductSettings } from './product-settings.service';
import { productSettingsQueryKeys } from './product-settings.query-keys';
import type { ProductSettings } from './demo-product-settings-data';

export function useProductSettingsListQuery() {
  return useQuery({ queryKey: productSettingsQueryKeys.lists(), queryFn: listProductSettings });
}

export function useProductSettingsDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: productSettingsQueryKeys.detail(id ?? ''),
    queryFn: () => getProductSettingsById(id as string),
    enabled: Boolean(id)
  });
}

export function useUpdateProductSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProductSettings> }) => updateProductSettings(id, patch),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: productSettingsQueryKeys.lists() });
      queryClient.setQueryData(productSettingsQueryKeys.detail(updated.id), updated);
    }
  });
}
