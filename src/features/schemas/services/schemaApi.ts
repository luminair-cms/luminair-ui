import { apiQuery } from '@/api/client';
import { DocumentResponse } from '@/api/types';
import { DetailedDocumentResponse } from '../types';

/**
 * Service functions for schemas / metadata.
 */
export const schemaApi = {
  /** Fetch all content type models/schemas configured in the backend */
  fetchDocumentTypes: (): Promise<DocumentResponse[]> =>
    apiQuery<DocumentResponse[]>('/api/meta/documents'),

  /** Fetch the detailed schema (with options and attributes) for a specific document type */
  fetchDetailedDocumentType: (id: string): Promise<DetailedDocumentResponse> =>
    apiQuery<DetailedDocumentResponse>(`/api/meta/documents/${id}`),
};
