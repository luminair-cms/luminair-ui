import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../services/documentApi';
import { ProblemDetails } from '@/api/types';
import { DocumentRecord, CreateDocumentPayload } from '../types';

/**
 * Mutation hook for creating a new document instance.
 */
export const useCreateDocument = (apiId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetails, CreateDocumentPayload>({
    mutationFn: async (payload) => {
      if (!apiId) throw new Error('apiId is required to create a document');
      const { headers } = await documentApi.createDocument(apiId, payload);
      const location = headers.get('Location') ?? '';
      return location.split('/').pop() ?? '';
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
    },
  });
};

/**
 * Mutation hook for updating an existing document instance.
 */
export const useUpdateDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<DocumentRecord, ProblemDetails, { data: Record<string, unknown> }>({
    mutationFn: async (payload) => {
      if (!apiId || !documentId) throw new Error('apiId and documentId are required to update');
      const { data } = await documentApi.updateDocument(apiId, documentId, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document'] });
    },
  });
};

/**
 * Mutation hook for publishing a draft document instance.
 */
export const usePublishDocument = (apiId: string | undefined, documentId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<DocumentRecord, ProblemDetails, void>({
    mutationFn: async () => {
      if (!apiId || !documentId) throw new Error('apiId and documentId are required to publish');
      const { data } = await documentApi.publishDocument(apiId, documentId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', apiId] });
      queryClient.invalidateQueries({ queryKey: ['document', apiId, documentId] });
    },
  });
};
