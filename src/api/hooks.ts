import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentResponse, DetailedDocumentResponse, DocumentRecord, CreateDocumentPayload, ProblemDetails } from './types';
import { apiQuery, apiMutate } from './client';

// --- React Query Hooks ---

export const useDocumentTypes = () =>
  useQuery<DocumentResponse[]>({
    queryKey: ['documentTypes'],
    queryFn: () => apiQuery<DocumentResponse[]>('/api/meta/documents'),
  });


export const useDetailedDocumentType = (id: string | undefined) =>
  useQuery<DetailedDocumentResponse | null>({
    queryKey: ['detailedDocumentType', id],
    enabled: !!id,
    queryFn: () => {
      if (!id) return Promise.resolve(null);
      return apiQuery<DetailedDocumentResponse>(`/api/meta/documents/${id}`);
    },
  });

export const useDocuments = (apiId: string | undefined) =>
  useQuery<DocumentRecord[]>({
    queryKey: ['documents', apiId],
    enabled: !!apiId,
    queryFn: () => {
      if (!apiId) return Promise.resolve([]);
      return apiQuery<DocumentRecord[]>(`/api/documents/${apiId}`);
    },
  });


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
      const { headers } = await apiMutate<void, CreateDocumentPayload>(
        `/api/documents/${apiId}`,
        'POST',
        payload,
      );
      // Backend returns 201 Created with an empty body; the new resource URL
      // is in the Location header — extract the documentId from its last segment.
      const location = headers.get('Location') ?? '';
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

export const useDocument = (apiId: string | undefined, documentId: string | undefined) =>
  useQuery<DocumentRecord | null>({
    queryKey: ['document', apiId, documentId],
    enabled: !!apiId && !!documentId && documentId !== 'new',
    queryFn: () => {
      if (!apiId || !documentId || documentId === 'new') return Promise.resolve(null);
      return apiQuery<DocumentRecord>(`/api/documents/${apiId}/${documentId}?status=draft`);
    },
  });

export const useUpdateDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  // TData is DocumentRecord because apiMutate already unwraps the { data: T } envelope.
  return useMutation<DocumentRecord, ProblemDetails, { data: Record<string, unknown> }>({
    mutationFn: async (payload) => {
      const { data } = await apiMutate<DocumentRecord, { data: Record<string, unknown> }>(
        `/api/documents/${apiId}/${documentId}`,
        'PUT',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
      queryClient.invalidateQueries({ queryKey: ['document', apiId, documentId] });
    },
  });
};

export const usePublishDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  // TData is DocumentRecord because apiMutate already unwraps the { data: T } envelope.
  return useMutation<DocumentRecord, ProblemDetails, void>({
    mutationFn: async () => {
      const { data } = await apiMutate<DocumentRecord>(
        `/api/documents/${apiId}/${documentId}/publish`,
        'POST',
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
      queryClient.invalidateQueries({ queryKey: ['document', apiId, documentId] });
    },
  });
};
