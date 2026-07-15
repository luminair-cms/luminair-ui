import { useQuery } from '@tanstack/react-query';
import { schemaApi } from '../services/schemaApi';
import { DocumentResponse } from '@/api/types';
import { DetailedDocumentResponse } from '../types';

/**
 * Hook to fetch all available document schemas.
 */
export const useDocumentTypes = () =>
  useQuery<DocumentResponse[]>({
    queryKey: ['documentTypes'],
    queryFn: () => schemaApi.fetchDocumentTypes(),
  });

/**
 * Hook to fetch detailed schema specifications for a single content type.
 */
export const useDetailedDocumentType = (id: string | undefined) =>
  useQuery<DetailedDocumentResponse | null>({
    queryKey: ['detailedDocumentType', id],
    enabled: !!id,
    queryFn: () => {
      if (!id) return Promise.resolve(null);
      return schemaApi.fetchDetailedDocumentType(id);
    },
  });
