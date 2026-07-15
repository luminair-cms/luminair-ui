import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../services/documentApi';
import { DocumentRecord } from '../types';

/**
 * Hook to fetch all documents of a specific content type.
 */
export const useDocuments = (apiId: string | undefined) =>
  useQuery<DocumentRecord[]>({
    queryKey: ['documents', apiId],
    enabled: !!apiId,
    queryFn: () => {
      if (!apiId) return Promise.resolve([]);
      return documentApi.fetchDocuments(apiId);
    },
  });

/**
 * Hook to fetch a single document instance.
 */
export const useDocument = (apiId: string | undefined, documentId: string | undefined) =>
  useQuery<DocumentRecord | null>({
    queryKey: ['document', apiId, documentId],
    enabled: !!apiId && !!documentId && documentId !== 'new',
    queryFn: () => {
      if (!apiId || !documentId || documentId === 'new') return Promise.resolve(null);
      return documentApi.fetchDocument(apiId, documentId);
    },
  });

/**
 * Fetches documents for a related collection to populate relation Select inputs.
 * Reuses the same query key and hook as useDocuments.
 */
export const useDocumentSearch = (targetApiId: string | undefined) => useDocuments(targetApiId);
