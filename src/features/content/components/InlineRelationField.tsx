import { FC, useMemo } from 'react';
import { Form, Select, Space, Tag, Typography } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { RelationAttribute, useDetailedDocumentType } from '@/features/schemas';
import { useDocumentSearch } from '../hooks/useDocuments';
import { DocumentRecord } from '../types';
import { toLabel, getDocumentLabel } from '../helpers';

const { Text } = Typography;

type DocStatus = 'draft' | 'modified' | 'published';

const resolveStatus = (doc: DocumentRecord): DocStatus =>
  (doc.status as DocStatus) ?? (doc.publishedAt ? 'published' : 'draft');

const STATUS_COLOR: Record<DocStatus, string> = {
  published: 'success',
  modified: 'processing',
  draft: 'warning',
};

const StatusBadge: FC<{ status: DocStatus }> = ({ status }) => (
  <Tag
    color={STATUS_COLOR[status]}
    style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}
  >
    {status}
  </Tag>
);

export interface InlineRelationFieldProps {
  attr: RelationAttribute;
  label?: string;
  description?: string;
}

export const InlineRelationField: FC<InlineRelationFieldProps> = ({ attr, label, description }) => {
  const isMultiple = attr.relation === 'hasMany';

  const { data: targetSchema } = useDetailedDocumentType(attr.target);
  const { data: docs, isLoading: docsLoading } = useDocumentSearch(attr.target);

  const statusByValue = useMemo<Map<string, DocStatus>>(
    () => new Map((docs ?? []).map((d) => [String(d.documentId), resolveStatus(d)])),
    [docs],
  );

  const options = (docs ?? []).map((doc) => ({
    value: String(doc.documentId),
    label: getDocumentLabel(doc, targetSchema),
    status: resolveStatus(doc),
  }));

  return (
    <Form.Item
      name={attr.id}
      label={
        <Space size={4}>
          {label || toLabel(attr.id)}
          <Tag color="cyan" style={{ fontSize: 10 }}>
            {attr.relation} → {attr.target}
          </Tag>
        </Space>
      }
      help={description}
    >
      <Select
        mode={isMultiple ? 'multiple' : undefined}
        options={options}
        loading={docsLoading}
        allowClear
        showSearch
        placeholder={docsLoading ? 'Loading…' : `Select ${attr.target}…`}
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        optionRender={(option) => {
          const status = (option.data as { status?: DocStatus }).status;
          return (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {option.label}
              </span>
              {status && <StatusBadge status={status} />}
            </div>
          );
        }}
        tagRender={
          isMultiple
            ? ({ label, value, closable, onClose }: CustomTagProps) => {
                const status = statusByValue.get(String(value));
                return (
                  <Tag
                    closable={closable}
                    onClose={onClose}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      margin: '2px 4px 2px 0',
                      padding: '0 6px',
                    }}
                  >
                    <span>{label}</span>
                    {status && <StatusBadge status={status} />}
                  </Tag>
                );
              }
            : undefined
        }
        labelRender={
          !isMultiple
            ? ({ label, value }) => {
                const status = statusByValue.get(String(value));
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {label}
                    {status && <StatusBadge status={status} />}
                  </span>
                );
              }
            : undefined
        }
      />
    </Form.Item>
  );
};
