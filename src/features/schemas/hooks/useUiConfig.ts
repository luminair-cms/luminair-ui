import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uiConfigApi } from '../services/uiConfigApi';
import { ContentTypeViewConfig } from '../types';

export const UI_CONFIG_QUERY_KEY = 'ui-config';

/**
 * Custom hook to fetch UI view configuration for a content type.
 */
export const useUiConfig = (apiId?: string) => {
  return useQuery<ContentTypeViewConfig>({
    queryKey: [UI_CONFIG_QUERY_KEY, apiId],
    queryFn: () => uiConfigApi.fetchUiConfig(apiId!),
    enabled: Boolean(apiId),
  });
};

/**
 * Custom hook to update UI view configuration for a content type.
 */
export const useUpdateUiConfig = (apiId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContentTypeViewConfig) =>
      uiConfigApi.updateUiConfig(apiId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UI_CONFIG_QUERY_KEY, apiId] });
    },
  });
};
