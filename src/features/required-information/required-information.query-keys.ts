export const requiredInformationQueryKeys = {
  all: () => ['required-information'] as const,
  lists: () => [...requiredInformationQueryKeys.all(), 'list'] as const,
  details: () => [...requiredInformationQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...requiredInformationQueryKeys.details(), id] as const
};
