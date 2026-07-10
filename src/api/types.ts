// --- API Schema Interfaces (Conforming to Backend DTOs) ---

export interface DocumentResponse {
  id: string;
  title: string;
  type: 'collection' | 'single';
  description: string | null;
}

export interface DocumentInfo {
  title: string;
  description: string | null;
  singularName: string;
  pluralName: string;
}

export interface DocumentOptions {
  draftAndPublish: boolean;
  localizations: string[];
}

export interface FieldConstraint {
  [key: string]: unknown;
}

export interface FieldAttribute {
  type: string;
  unique: boolean;
  required: boolean;
  constraints?: FieldConstraint[];
}

export interface RelationAttribute {
  relation: string;
  target: string;
}

export interface Attribute {
  id: string;
  type?: string;
  unique?: boolean;
  required?: boolean;
  constraints?: FieldConstraint[];
  relation?: string;
  target?: string;
}

export interface DetailedDocumentResponse {
  id: string;
  title: string;
  type: 'collection' | 'single';
  info: DocumentInfo;
  options: DocumentOptions | null;
  attributes: Attribute[];
}

export interface DocumentRecord {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  [key: string]: unknown;
}
