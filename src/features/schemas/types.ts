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

/**
 * How this document type appears when rendered inside a relation field on another type's edit form.
 *
 * - `inline`: Compact tag/select widget. Displays only `settings.mainField`. No extra config.
 * - `block`:  Strapi-style vertical card list. Displays 1–3 chosen scalar fields.
 */
export type RelationAppearance =
  | { displayMode: 'inline' }
  | {
      displayMode: 'block';
      /**
       * Ordered list of this type's own scalar field IDs to show in the relation card.
       * Must contain 1 to 3 elements:
       * - displayFields[0]: Primary card title
       * - displayFields[1..2]: Optional preview sub-badges
       */
      displayFields: [string, ...string[]];
    };

export interface ContentTypeViewConfig {
  apiId: string;
  settings: {
    /** Primary field used for title rendering and as the sole display field in inline relation mode. */
    mainField: string;
  };
  layouts: {
    edit: FieldViewConfig[];
  };
  /**
   * How this document type appears when displayed in any relation field across the system.
   * Configured once here; automatically applied everywhere this type is used as a relation target.
   */
  relationAppearance: RelationAppearance;
}
