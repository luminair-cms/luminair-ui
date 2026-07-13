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
  id: string;
  /** Backend may return a plain string ("text") or a tagged object ({"decimal":{"precision":10,"scale":8}}) */
  type: string | Record<string, unknown>;
  unique: boolean;
  required: boolean;
  constraints?: FieldConstraint[];
}

export interface RelationAttribute {
  id: string;
  relation: string;
  target: string;
}

export type Attribute = FieldAttribute | RelationAttribute;

export const isRelationAttribute = (attr: Attribute): attr is RelationAttribute => {
  return 'relation' in attr;
};

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
