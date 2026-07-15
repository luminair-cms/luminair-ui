import type { Rule } from 'antd/es/form';
import { Space, Tag, Typography } from 'antd';
// @ts-ignore
import dayjs from 'dayjs';
import {
  FieldAttribute,
  FieldConstraint,
  Attribute,
  isRelationAttribute,
} from '@/features/schemas';
import { DocumentRecord } from './types';

const { Text } = Typography;

/** Convert a snake_case or kebab-case id to a human-readable Title Case label */
export const toLabel = (id: string) =>
  id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
 * Get display label for a DocumentRecord in a relation Select option.
 * Attempts common display fields (name, title, uid) before falling back to documentId.
 */
export const getDocumentLabel = (doc: DocumentRecord): string => {
  const display =
    (typeof doc.name === 'string' && doc.name) ||
    (typeof doc.title === 'string' && doc.title) ||
    (typeof doc.uid === 'string' && doc.uid);

  if (display) {
    const shortId = String(doc.documentId).substring(0, 8);
    return `${display} (${shortId}…)`;
  }
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
    const rawVal = record[attr.id];
    if (rawVal === undefined || rawVal === null) continue;

    if (isRelationAttribute(attr)) {
      if (Array.isArray(rawVal)) {
        values[attr.id] = rawVal.map((item: any) => String(item.documentId || item));
      } else if (typeof rawVal === 'object' && rawVal !== null) {
        values[attr.id] = String((rawVal as any).documentId || rawVal);
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
      <Space size={[4, 4]} wrap>
        {Object.entries(val).map(([locale, text]) => (
          <Tag
            key={locale}
            style={{
              margin: 0,
              fontSize: 11,
              background: 'var(--antd-color-bg-container)',
              border: '1px solid var(--antd-color-border-secondary)',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                color: '#a5b4fc',
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


