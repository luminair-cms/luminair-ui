import type { Rule } from 'antd/es/form';
import { Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  FieldAttribute,
  FieldConstraint,
  Attribute,
  DetailedDocumentResponse,
  isRelationAttribute,
} from '@/features/schemas';
import { DocumentRecord } from './types';

const { Text } = Typography;

interface RelationItem {
  documentId?: string | number;
  [key: string]: unknown;
}

/** Convert a snake_case or kebab-case id to a human-readable Title Case label */
export const toLabel = (id: string) =>
  id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Extract the primary type name from a FieldAttribute.type.
 * Handles both plain strings ("text") and tagged-union objects ({"integer": "int32"}).
 */
export const getTypeName = (type: FieldAttribute['type']): string => {
  if (typeof type === 'string') return type;
  return Object.keys(type)[0] ?? 'text';
};

/**
 * Extract type parameters from a tagged-union FieldType object.
 * Returns null for plain string types.
 */
export const getTypeParams = (type: FieldAttribute['type']): unknown => {
  if (typeof type === 'object') return Object.values(type)[0];
  return null;
};

/**
 * Convert a single FieldConstraint (single-key object from backend) to an
 * Ant Design Form Rule.
 */
export const constraintToRule = (c: FieldConstraint): Rule => {
  const entries = Object.entries(c);
  if (entries.length === 0) return {};
  const [key, val] = entries[0];

  switch (key) {
    case 'pattern':
      return {
        pattern: new RegExp(String(val)),
        message: `Must match pattern: ${val}`,
      };
    case 'minimalLength':
      return { min: Number(val), message: `Minimum ${val} characters required` };
    case 'maximalLength':
      return { max: Number(val), message: `Maximum ${val} characters allowed` };
    case 'minimalIntegerValue':
      return {
        validator: (_, value) =>
          value === undefined || value === null || Number(value) >= Number(val)
            ? Promise.resolve()
            : Promise.reject(new Error(`Minimum value is ${val}`)),
      };
    case 'maximalIntegerValue':
      return {
        validator: (_, value) =>
          value === undefined || value === null || Number(value) <= Number(val)
            ? Promise.resolve()
            : Promise.reject(new Error(`Maximum value is ${val}`)),
      };
    default:
      return {};
  }
};

/**
 * Coerce a raw form value to the wire format expected by the backend.
 * DatePicker returns Dayjs objects; JSON fields are kept as strings until submit.
 */
export const coerceValue = (typeName: string, val: unknown): unknown => {
  if (val === undefined || val === null) return val;

  // DatePicker yields Dayjs-like objects with a .format() method
  if (typeName === 'date' && typeof val === 'object' && 'format' in val) {
    return (val as { format: (f: string) => string }).format('YYYY-MM-DD');
  }
  if (typeName === 'dateTime' && typeof val === 'object' && 'toISOString' in val) {
    return (val as { toISOString: () => string }).toISOString();
  }
  // JSON fields: parse string to object
  if (typeName === 'json' && typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val; // validation rule will catch malformed JSON
    }
  }
  return val;
};

/**
 * Returns the primary attribute based on model sorting rules:
 * 1. Field with 'uid' type (if exists)
 * 2. Field named 'name' (if exists)
 * 3. First unique attribute (if neither 1 nor 2 exists)
 * 4. First available attribute as fallback
 */
export const getPrimaryAttribute = (attributes?: Attribute[]): Attribute | undefined => {
  if (!attributes || attributes.length === 0) return undefined;
  const sorted = sortAttributesByDefaultOrder(attributes);
  return sorted[0];
};

/**
 * Formats a field value as string (handling localized objects, numbers, and strings).
 */
export const formatFieldValue = (val: unknown): string | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'object' && !Array.isArray(val)) {
    const entries = Object.entries(val);
    if (entries.length === 0) return undefined;
    const nonFirst = entries.find(([, text]) => text && String(text).trim().length > 0);
    return nonFirst ? String(nonFirst[1]) : String(entries[0][1]);
  }
  return String(val);
};

/** Converts snake_case or kebab-case to camelCase (e.g. legal_entity -> legalEntity) */
export const snakeToCamel = (str: string): string =>
  str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());

/** Retrieves field value from record attempting exact key, camelCase, or snake_case key */
export const getRecordFieldValue = (
  record: DocumentRecord | Record<string, unknown> | null | undefined,
  attrId: string,
): unknown => {
  if (!record) return undefined;
  const camelKey = snakeToCamel(attrId);
  const valDirect = record[attrId];
  const valCamel = record[camelKey];

  if (valDirect !== undefined && valDirect !== null) return valDirect;
  if (valCamel !== undefined && valCamel !== null) return valCamel;
  return undefined;
};

/**
 * Extract the primary field value of a DocumentRecord according to model sorting rules.
 */
export const getPrimaryFieldValue = (
  doc: DocumentRecord | null | undefined,
  attributes?: Attribute[],
): string | undefined => {
  if (!doc) return undefined;

  if (attributes && attributes.length > 0) {
    const primaryAttr = getPrimaryAttribute(attributes);
    if (primaryAttr) {
      const rawVal = getRecordFieldValue(doc, primaryAttr.id);
      const formatted = formatFieldValue(rawVal);
      if (formatted) return formatted;
    }
  }

  // Fallback to checking common display properties if attributes not supplied or primary value empty
  const nameVal = formatFieldValue(doc.name);
  if (nameVal) return nameVal;

  const titleVal = formatFieldValue(doc.title);
  if (titleVal) return titleVal;

  const uidVal = formatFieldValue(doc.uid);
  if (uidVal) return uidVal;

  return undefined;
};

/**
 * Formats a document record for relation select dropdown display.
 * Returns the primary field value, or the raw documentId as a fallback.
 */
export const getDocumentLabel = (
  doc: DocumentRecord | null | undefined,
  schemaOrAttributes?: Attribute[] | DetailedDocumentResponse | null,
): string => {
  if (!doc) return '';
  const attributes = Array.isArray(schemaOrAttributes)
    ? schemaOrAttributes
    : schemaOrAttributes?.attributes;
  const primaryVal = getPrimaryFieldValue(doc, attributes);
  if (primaryVal) return primaryVal;
  return String(doc.documentId);
};

/**
 * Maps a retrieved DocumentRecord into form-compatible initial values.
 */
export const documentToFormValues = (
  record: DocumentRecord,
  attributes: Attribute[],
): Record<string, unknown> => {
  const values: Record<string, unknown> = {};

  for (const attr of attributes) {
    const rawVal = getRecordFieldValue(record, attr.id);
    if (rawVal === undefined || rawVal === null) continue;

    if (isRelationAttribute(attr)) {
      const isSingleRelation = attr.relation === 'hasOne' || attr.relation === 'belongsToOne';
      if (Array.isArray(rawVal)) {
        if (isSingleRelation) {
          const first = rawVal[0];
          values[attr.id] = first ? String((first as RelationItem).documentId ?? first) : undefined;
        } else {
          values[attr.id] = rawVal.map((item: RelationItem) => String(item.documentId ?? item));
        }
      } else if (typeof rawVal === 'object' && rawVal !== null) {
        values[attr.id] = String((rawVal as RelationItem).documentId ?? rawVal);
      } else {
        values[attr.id] = String(rawVal);
      }
    } else {
      const typeName = getTypeName(attr.type);
      if (typeName === 'date' || typeName === 'dateTime') {
        values[attr.id] = dayjs(rawVal as string);
      } else if (typeName === 'json') {
        values[attr.id] = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal, null, 2);
      } else {
        values[attr.id] = rawVal;
      }
    }
  }

  return values;
};

export const renderLocalizedCell = (val: unknown) => {
  if (!val) return <Text type="secondary">—</Text>;
  if (typeof val === 'object' && !Array.isArray(val)) {
    return (
      <Space size={[4, 4]} direction="vertical" align="start" style={{ display: 'flex' }}>
        {Object.entries(val).map(([locale, text]) => (
          <Tag
            key={locale}
            style={{
              margin: 0,
              fontSize: 11,
              background: 'var(--antd-color-bg-container)',
              border: '1px solid var(--antd-color-border-secondary)',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                color: 'var(--antd-color-primary)',
                textTransform: 'uppercase',
                marginRight: 4,
              }}
            >
              {locale}
            </span>
            {String(text)}
          </Tag>
        ))}
      </Space>
    );
  }
  return <Text>{String(val)}</Text>;
};

/**
 * Sorts schema attributes according to implicit default ordering:
 * 1. First, field with Uid type (if exists)
 * 2. Second, field named 'name' (if exists)
 * 3. If neither Uid type nor name field exists, place the first unique attribute first.
 * Remaining attributes maintain their original relative order.
 */
export const sortAttributesByDefaultOrder = (attributes: Attribute[]): Attribute[] => {
  const attrs = [...attributes];

  const uidAttr = attrs.find(
    (attr) => !isRelationAttribute(attr) && getTypeName(attr.type).toLowerCase() === 'uid',
  );
  const nameAttr = attrs.find((attr) => attr.id.toLowerCase() === 'name');

  const priorityAttrs: Attribute[] = [];

  if (uidAttr) {
    priorityAttrs.push(uidAttr);
  }
  if (nameAttr && nameAttr !== uidAttr) {
    priorityAttrs.push(nameAttr);
  }

  if (!uidAttr && !nameAttr) {
    const uniqueAttr = attrs.find((attr) => !isRelationAttribute(attr) && attr.unique);
    if (uniqueAttr) {
      priorityAttrs.push(uniqueAttr);
    }
  }

  const prioritySet = new Set(priorityAttrs);
  const remainingAttrs = attrs.filter((attr) => !prioritySet.has(attr));

  return [...priorityAttrs, ...remainingAttrs];
};

