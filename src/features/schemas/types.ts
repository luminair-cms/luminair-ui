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

export interface FieldViewConfig {
  attributeId: string;
  label?: string;
  description?: string;
  placeholder?: string;
  editable?: boolean;
  size?: 50 | 100;
}

export interface RelationViewConfig {
  attributeId: string;
  displayMode: 'inline' | 'block';
  /**
   * Ordered list of fields to display:
   * - displayFields[0]: Primary title/label
   * - displayFields[1..3]: Additional preview fields for 'block' mode (max 3 preview fields)
   */
  displayFields: string[];
}

export interface ContentTypeViewConfig {
  apiId: string;
  settings: {
    mainField: string;
  };
  layouts: {
    edit: FieldViewConfig[];
    relations: RelationViewConfig[];
  };
}
