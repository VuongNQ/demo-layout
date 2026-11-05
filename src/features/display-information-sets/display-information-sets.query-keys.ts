export const displayInformationSetsQueryKeys = {
  all: () => ['display-information-sets'] as const,
  lists: () => [...displayInformationSetsQueryKeys.all(), 'list'] as const,
  details: () => [...displayInformationSetsQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...displayInformationSetsQueryKeys.details(), id] as const
};
