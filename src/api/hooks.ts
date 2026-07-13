import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentResponse, DetailedDocumentResponse, DocumentRecord, CreateDocumentPayload, ProblemDetails } from './types';
import { fallbackDocumentTypes, fallbackDetailedDocumentTypes, fallbackDocuments } from './fallbacks';
import { apiClient } from './client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// --- React Query Hooks with API Fetching and Defensive Fallbacks ---

export const useDocumentTypes = () => {
  return useQuery<DocumentResponse[]>({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      try {
        return await apiClient<DocumentResponse[]>('/api/meta/documents');
      } catch (err) {
        if (import.meta.env.MODE === 'test') {
          console.warn('API error fetching document types, falling back to local mock data:', err);
          return fallbackDocumentTypes;
        }
        throw err;
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
        if (import.meta.env.MODE === 'test') {
          console.warn(`API error fetching detailed schema for ${id}, falling back to local mock data:`, err);
          return fallbackDetailedDocumentTypes[id] || null;
        }
        throw err;
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
        if (import.meta.env.MODE === 'test') {
          console.warn(`API error fetching documents for ${apiId}, falling back to local mock data:`, err);
          return fallbackDocuments[apiId] || [];
        }
        throw err;
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

  return useMutation<string, ProblemDetails, CreateDocumentPayload>({
    mutationFn: async (payload) => {
      const response = await fetch(`${BASE_URL}/api/documents/${apiId}`, {
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

export const useDocument = (apiId: string | undefined, documentId: string | undefined) => {
  return useQuery<DocumentRecord | null>({
    queryKey: ['document', apiId, documentId],
    enabled: !!apiId && !!documentId && documentId !== 'new',
    queryFn: async () => {
      if (!apiId || !documentId || documentId === 'new') return null;
      try {
        return await apiClient<DocumentRecord>(`/api/documents/${apiId}/${documentId}?status=draft`);
      } catch (err) {
        if (import.meta.env.MODE === 'test') {
          console.warn(`API error fetching document ${documentId} for ${apiId}, falling back to local mock data:`, err);
          const docs = fallbackDocuments[apiId] || [];
          return docs.find(d => d.documentId === documentId) || null;
        }
        throw err;
      }
    },
  });
};

export const useUpdateDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<{ data: DocumentRecord }, ProblemDetails, { data: Record<string, unknown> }>({
    mutationFn: async (payload) => {
      const response = await fetch(`${BASE_URL}/api/documents/${apiId}/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err: ProblemDetails = await response.json();
        throw err;
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
      queryClient.invalidateQueries({ queryKey: ['document', apiId, documentId] });
    },
  });
};

export const usePublishDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<{ data: DocumentRecord }, ProblemDetails, void>({
    mutationFn: async () => {
      const response = await fetch(`${BASE_URL}/api/documents/${apiId}/${documentId}/publish`, {
        method: 'POST',
      });
      if (!response.ok) {
        const err: ProblemDetails = await response.json();
        throw err;
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
      queryClient.invalidateQueries({ queryKey: ['document', apiId, documentId] });
    },
  });
};
