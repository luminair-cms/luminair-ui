import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentResponse, DetailedDocumentResponse, DocumentRecord, CreateDocumentPayload, ProblemDetails } from './types';
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

/**
 * Mutation hook for creating a new document instance.
 *
 * The backend returns 201 Created with an empty body and a Location header
 * containing the URL of the new resource. The hook resolves to the new documentId
 * extracted from the last path segment of that header.
 *
 * Throws a {@link ProblemDetails} object on any non-2xx response.
 */
export const useCreateDocument = (apiId: string | undefined) => {
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  return useMutation<string, ProblemDetails, CreateDocumentPayload>({
    mutationFn: async (payload) => {
      const response = await fetch(`${baseUrl}/api/documents/${apiId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // Backend returns RFC 7807 Problem Details on error
        const err: ProblemDetails = await response.json();
        throw err;
      }
      const location = response.headers.get('Location') ?? '';
      return location.split('/').pop() ?? '';
    },
    onSuccess: () => {
      // Refresh the document list so the new record appears immediately
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
    },
  });
};

/**
 * Fetches documents for a related collection to populate relation Select inputs.
 * Reuses the same query key as {@link useDocuments} so the result is shared from cache.
 */
export const useDocumentSearch = (targetApiId: string | undefined) =>
  useDocuments(targetApiId);
