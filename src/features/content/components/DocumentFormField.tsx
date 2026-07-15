import { FC } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Tabs,
  Space,
  Tag,
} from 'antd';
import type { Rule } from 'antd/es/form';
import { FieldAttribute } from '@/features/schemas';
import {
  toLabel,
  getTypeName,
  getTypeParams,
  constraintToRule,
} from '../helpers';

export interface DocumentFormFieldProps {
  attr: FieldAttribute;
  localizations: string[];
}

export const DocumentFormField: FC<DocumentFormFieldProps> = ({ attr, localizations }) => {
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
          suffix={typeof typeParams === 'string' ? typeParams : undefined}
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
