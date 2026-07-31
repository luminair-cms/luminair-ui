import { apiQuery, apiMutate } from '@/api/client';
import { ContentTypeViewConfig } from '../types';

/**
 * Service functions for UI View Configurations (`/api/ui/views/...`).
 */
export const uiConfigApi = {
  /** Fetch UI view configuration for a content type */
  fetchUiConfig: (apiId: string): Promise<ContentTypeViewConfig> =>
    apiQuery<ContentTypeViewConfig>(`/api/ui/views/${apiId}`),

  /** Update & persist UI view configuration for a content type */
  updateUiConfig: (
    apiId: string,
    payload: ContentTypeViewConfig,
  ): Promise<{ data: ContentTypeViewConfig; headers: Headers }> =>
    apiMutate<ContentTypeViewConfig, ContentTypeViewConfig>(
      `/api/ui/views/${apiId}`,
      'PUT',
      payload,
    ),
};
