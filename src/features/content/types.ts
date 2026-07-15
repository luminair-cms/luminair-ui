export interface DocumentRecord {
  id: number;
  documentId: string;
  status?: 'draft' | 'modified' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  [key: string]: unknown;
}

/** Payload envelope for POST /api/documents/:apiId */
export interface CreateDocumentPayload {
  data: Record<string, unknown>;
}
