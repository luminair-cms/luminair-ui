import { useQuery } from '@tanstack/react-query';
import { DocumentResponse, DetailedDocumentResponse, DocumentRecord } from './types';
import { fallbackDocumentTypes, fallbackDetailedDocumentTypes, fallbackDocuments } from './fallbacks';
import { apiClient } from './client';

// --- React Query Hooks with API Fetching and Defensive Fallbacks ---

export const useDocumentTypes = () => {
  return useQuery<DocumentResponse[]>({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      try {
        return await apiClient<DocumentResponse[]>('/api/meta/documents');
      } catch (err) {
        console.warn('API error fetching document types, falling back to local mock data:', err);
        return fallbackDocumentTypes;
      }
    },
  });
};

export const useDetailedDocumentType = (id: string | undefined) => {
  return useQuery<DetailedDocumentResponse | null>({
    queryKey: ['detailedDocumentType', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      try {
        return await apiClient<DetailedDocumentResponse>(`/api/meta/documents/${id}`);
      } catch (err) {
        console.warn(`API error fetching detailed schema for ${id}, falling back to local mock data:`, err);
        return fallbackDetailedDocumentTypes[id] || null;
      }
    },
  });
};

export const useDocuments = (apiId: string | undefined) => {
  return useQuery<DocumentRecord[]>({
    queryKey: ['documents', apiId],
    enabled: !!apiId,
    queryFn: async () => {
      if (!apiId) return [];
      try {
        return await apiClient<DocumentRecord[]>(`/api/documents/${apiId}`);
      } catch (err) {
        console.warn(`API error fetching documents for ${apiId}, falling back to local mock data:`, err);
        return fallbackDocuments[apiId] || [];
      }
    },
  });
};
