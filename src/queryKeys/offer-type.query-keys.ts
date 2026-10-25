// Key factory returns keys only — mirrors the real repo's rule that
// queryKeys/ must not import services/. Composition (useQuery, etc.) lives
// in feature hooks, not here.
import type { OfferTypeListParams } from '@/services/offer-type.service';

export const offerTypeQueryKeys = {
  all: () => ['offer-types'] as const,
  lists: () => [...offerTypeQueryKeys.all(), 'list'] as const,
  list: (params: OfferTypeListParams) => [...offerTypeQueryKeys.lists(), params] as const,
  details: () => [...offerTypeQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...offerTypeQueryKeys.details(), id] as const
};
