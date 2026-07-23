import { apiQuery, apiMutate } from '@/api/client';
import { DocumentRecord, CreateDocumentPayload } from '../types';

/**
 * Service functions for content documents.
 * Encapsulates the raw apiQuery and apiMutate requests to the backend.
 */
export const documentApi = {
  /** Fetch list of documents for a given content type */
  fetchDocuments: (apiId: string): Promise<DocumentRecord[]> =>
    apiQuery<DocumentRecord[]>(`/api/documents/${apiId}?status=draft&populate=*`),

  /** Fetch a single document instance by ID (draft status with populated relations) */
  fetchDocument: (apiId: string, documentId: string): Promise<DocumentRecord> =>
    apiQuery<DocumentRecord>(`/api/documents/${apiId}/${documentId}?status=draft&populate=*`),

  /** Create a new document instance (returns 201 Created with Location header) */
  createDocument: (
    apiId: string,
    payload: CreateDocumentPayload,
  ): Promise<{ data: void; headers: Headers }> =>
    apiMutate<void, CreateDocumentPayload>(`/api/documents/${apiId}`, 'POST', payload),

  /** Update an existing document instance (returns 204 No Content) */
  updateDocument: (
    apiId: string,
    documentId: string,
    payload: { data: Record<string, unknown> },
  ): Promise<{ data: void; headers: Headers }> =>
    apiMutate<void, { data: Record<string, unknown> }>(
      `/api/documents/${apiId}/${documentId}`,
      'PUT',
      payload,
    ),

  /** Publish a draft document instance (returns 204 No Content) */
  publishDocument: (
    apiId: string,
    documentId: string,
  ): Promise<{ data: void; headers: Headers }> =>
    apiMutate<void>(`/api/documents/${apiId}/${documentId}/publish`, 'POST'),

  /** Delete a document instance */
  deleteDocument: (
    apiId: string,
    documentId: string,
  ): Promise<{ data: void; headers: Headers }> =>
    apiMutate<void>(`/api/documents/${apiId}/${documentId}`, 'DELETE'),
};
