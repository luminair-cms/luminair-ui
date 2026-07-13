import { FC, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Select,
  Tabs,
  Button,
  Space,
  Alert,
  Spin,
  Typography,
  Tag,
  Divider,
} from 'antd';
import type { Rule } from 'antd/es/form';
import {
  DetailedDocumentResponse,
  FieldAttribute,
  RelationAttribute,
  FieldConstraint,
  isRelationAttribute,
  ProblemDetails,
  DocumentRecord,
} from '@/api/types';
import { useCreateDocument, useDocumentSearch } from '@/api/hooks';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a snake_case or kebab-case id to a human-readable Title Case label */
const toLabel = (id: string) =>
  id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Extract the primary type name from a FieldAttribute.type.
 * Handles both plain strings ("text") and tagged-union objects ({"integer": "int32"}).
 */
const getTypeName = (type: FieldAttribute['type']): string => {
  if (typeof type === 'string') return type;
  return Object.keys(type)[0] ?? 'text';
};

/**
 * Extract type parameters from a tagged-union FieldType object.
 * Returns null for plain string types.
 */
const getTypeParams = (type: FieldAttribute['type']): unknown => {
  if (typeof type === 'object') return Object.values(type)[0];
  return null;
};

/**
 * Convert a single FieldConstraint (single-key object from backend) to an
 * Ant Design Form Rule.
 */
const constraintToRule = (c: FieldConstraint): Rule => {
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
const coerceValue = (typeName: string, val: unknown): unknown => {
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
const getDocumentLabel = (doc: DocumentRecord): string => {
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

// ---------------------------------------------------------------------------
// RelationField sub-component
// (separate component so each can call its own hook at the top level)
// ---------------------------------------------------------------------------

interface RelationFieldProps {
  attr: RelationAttribute;
}

const RelationField: FC<RelationFieldProps> = ({ attr }) => {
  const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';
  const isMultiple = attr.relation === 'hasMany';

  const { data: docs, isLoading } = useDocumentSearch(isOwning ? attr.target : undefined);

  if (!isOwning) {
    return (
      <Form.Item label={toLabel(attr.id)}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Inverse relation via{' '}
          <Tag color="cyan" style={{ margin: 0 }}>
            {attr.target}
          </Tag>{' '}
          — managed from the owning side.
        </Text>
      </Form.Item>
    );
  }

  const options = (docs ?? []).map((doc) => ({
    value: String(doc.documentId),
    label: getDocumentLabel(doc),
  }));

  return (
    <Form.Item
      name={attr.id}
      label={
        <Space size={4}>
          {toLabel(attr.id)}
          <Tag color="cyan" style={{ fontSize: 10 }}>
            {attr.relation} → {attr.target}
          </Tag>
        </Space>
      }
    >
      <Select
        mode={isMultiple ? 'multiple' : undefined}
        options={options}
        loading={isLoading}
        allowClear
        showSearch
        placeholder={isLoading ? 'Loading…' : `Select ${attr.target}…`}
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    </Form.Item>
  );
};

// ---------------------------------------------------------------------------
// Main drawer component
// ---------------------------------------------------------------------------

export interface CreateDocumentDrawerProps {
  open: boolean;
  onClose: () => void;
  schema: DetailedDocumentResponse;
  apiId: string;
}

/**
 * Schema-driven Ant Design Drawer + Form for creating a new document instance.
 *
 * Field inputs are generated entirely from the DetailedDocumentResponse schema:
 * - Every FieldType variant maps to the appropriate input component.
 * - FieldConstraints are converted to Ant Design Form Rules.
 * - localizedText fields render a Tabs layout with one input per active locale.
 * - Owning relations render a searchable Select; inverse relations show an info note.
 *
 * On successful creation the drawer closes and the document list cache is invalidated.
 * Backend RFC 7807 errors are surfaced inline without closing the drawer.
 */
export const CreateDocumentDrawer: FC<CreateDocumentDrawerProps> = ({
  open,
  onClose,
  schema,
  apiId,
}) => {
  const [form] = Form.useForm();
  const mutation = useCreateDocument(apiId);

  const localizations: string[] = schema.options?.localizations ?? [];

  // -------------------------------------------------------------------------
  // Field renderers
  // -------------------------------------------------------------------------

  const renderField = (attr: FieldAttribute) => {
    const typeName = getTypeName(attr.type);
    const typeParams = getTypeParams(attr.type);

    // uuid — backend auto-generates, hide from create form
    if (typeName === 'uuid') return null;

    const baseRules: Rule[] = attr.required ? [{ required: true, message: `${toLabel(attr.id)} is required` }] : [];
    const constraintRules: Rule[] = (attr.constraints ?? []).map(constraintToRule);
    const rules = [...baseRules, ...constraintRules];

    const label = (
      <Space size={4}>
        {toLabel(attr.id)}
        <Tag color="blue" style={{ fontSize: 10 }}>
          {typeName}
        </Tag>
        {attr.unique && (
          <Tag color="purple" style={{ fontSize: 10 }}>
            unique
          </Tag>
        )}
      </Space>
    );

    // localizedText — Tabs, one textarea per locale
    if (typeName === 'localizedText') {
      const firstLocale = localizations[0];
      return (
        <Form.Item key={attr.id} label={label} required={attr.required}>
          <Tabs
            size="small"
            items={localizations.map((locale) => ({
              key: locale,
              label: locale.toUpperCase(),
              children: (
                <Form.Item
                  name={[attr.id, locale]}
                  rules={
                    attr.required && locale === firstLocale
                      ? [{ required: true, message: `${toLabel(attr.id)} [${locale}] is required` }]
                      : []
                  }
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea rows={3} placeholder={`${toLabel(attr.id)} in ${locale}…`} />
                </Form.Item>
              ),
            }))}
          />
        </Form.Item>
      );
    }

    // boolean — Switch
    if (typeName === 'boolean') {
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>
      );
    }

    // date
    if (typeName === 'date') {
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} rules={rules}>
          <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
        </Form.Item>
      );
    }

    // dateTime
    if (typeName === 'dateTime') {
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} rules={rules}>
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
        </Form.Item>
      );
    }

    // integer — InputNumber
    if (typeName === 'integer') {
      const minRule = constraintRules.find((r) => 'validator' in r && String(r).includes('Minimum'));
      const maxRule = constraintRules.find((r) => 'validator' in r && String(r).includes('Maximum'));
      void minRule; void maxRule; // constraint rules already in `rules`
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} rules={rules}>
          <InputNumber
            precision={0}
            style={{ width: '100%' }}
            placeholder={`Enter ${toLabel(attr.id)}…`}
            addonAfter={typeof typeParams === 'string' ? typeParams : undefined}
          />
        </Form.Item>
      );
    }

    // decimal — InputNumber with precision derived from scale
    if (typeName === 'decimal') {
      const params = typeParams as { precision?: number; scale?: number } | null;
      const scale = params?.scale ?? 2;
      const step = Math.pow(10, -scale);
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} rules={rules}>
          <InputNumber
            step={step}
            precision={scale}
            style={{ width: '100%' }}
            placeholder={`Enter ${toLabel(attr.id)}…`}
          />
        </Form.Item>
      );
    }

    // json — TextArea with JSON validation
    if (typeName === 'json') {
      const jsonRules: Rule[] = [
        ...rules,
        {
          validator: (_, value) => {
            if (!value) return Promise.resolve();
            try {
              JSON.parse(value as string);
              return Promise.resolve();
            } catch {
              return Promise.reject(new Error('Must be valid JSON'));
            }
          },
        },
      ];
      return (
        <Form.Item key={attr.id} name={attr.id} label={label} rules={jsonRules}>
          <Input.TextArea
            rows={4}
            placeholder='{"key": "value"}'
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      );
    }

    // text / uid — plain Input
    return (
      <Form.Item key={attr.id} name={attr.id} label={label} rules={rules}>
        <Input placeholder={`Enter ${toLabel(attr.id)}…`} />
      </Form.Item>
    );
  };

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onFinish = useCallback(
    (values: Record<string, unknown>) => {
      const data: Record<string, unknown> = {};

      for (const attr of schema.attributes) {
        if (isRelationAttribute(attr)) {
          const val = values[attr.id];
          if (val !== undefined && val !== null) {
            const ids = Array.isArray(val) ? val : [val];
            if (ids.length > 0) {
              data[attr.id] = { connect: ids };
            }
          }
        } else {
          const typeName = getTypeName(attr.type);
          // uuid is hidden from the form and generated by the backend
          if (typeName === 'uuid') continue;

          const raw = values[attr.id];
          if (raw === undefined || raw === null) continue;

          data[attr.id] = coerceValue(typeName, raw);
        }
      }

      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            form.resetFields();
            onClose();
          },
        },
      );
    },
    [form, mutation, onClose, schema.attributes],
  );

  // -------------------------------------------------------------------------
  // Error display
  // -------------------------------------------------------------------------

  const error = mutation.error as ProblemDetails | null;
  const errorMessage = error
    ? `${error.title ?? 'Error'}: ${error.detail ?? 'An unexpected error occurred.'}`
    : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button
        onClick={() => {
          form.resetFields();
          mutation.reset();
          onClose();
        }}
      >
        Cancel
      </Button>
      <Button
        type="primary"
        loading={mutation.isPending}
        onClick={() => form.submit()}
      >
        Create {schema.info.singularName}
      </Button>
    </div>
  );

  return (
    <Drawer
      title={`Create New ${schema.info.title}`}
      placement="right"
      width={600}
      open={open}
      onClose={() => {
        form.resetFields();
        mutation.reset();
        onClose();
      }}
      footer={footer}
      destroyOnHidden
    >
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          showIcon
          closable
          onClose={() => mutation.reset()}
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        scrollToFirstError
      >
        {/* Field attributes */}
        {schema.attributes
          .filter((a) => !isRelationAttribute(a))
          .map((attr) => renderField(attr as FieldAttribute))}

        {/* Relation attributes */}
        {schema.attributes.some((a) => isRelationAttribute(a)) && (
          <>
            <Divider orientation="left" plain style={{ fontSize: 12, color: '#6b7280' }}>
              Relations
            </Divider>
            {schema.attributes
              .filter((a) => isRelationAttribute(a))
              .map((attr) => (
                <RelationField key={attr.id} attr={attr as RelationAttribute} />
              ))}
          </>
        )}

        {mutation.isPending && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Spin tip="Creating…" />
          </div>
        )}
      </Form>
    </Drawer>
  );
};
