import { FC, useMemo } from 'react';
import { Form, Select, Space, Tag, Typography } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { RelationAttribute, useDetailedDocumentType } from '@/features/schemas';
import { useDocumentSearch } from '../hooks/useDocuments';
import { DocumentRecord } from '../types';
import { toLabel, getDocumentLabel } from '../helpers';

const { Text } = Typography;

// ── Status helpers ────────────────────────────────────────────────────────────

type DocStatus = 'draft' | 'modified' | 'published';

/** Derive the display status from a DocumentRecord, mirroring DocumentForm logic. */
const resolveStatus = (doc: DocumentRecord): DocStatus =>
  (doc.status as DocStatus) ?? (doc.publishedAt ? 'published' : 'draft');

const STATUS_COLOR: Record<DocStatus, string> = {
  published: 'success',
  modified: 'processing',
  draft: 'warning',
};

/** Compact coloured badge, styled like Strapi's status pill. */
const StatusBadge: FC<{ status: DocStatus }> = ({ status }) => (
  <Tag
    color={STATUS_COLOR[status]}
    style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}
  >
    {status}
  </Tag>
);

// ── Component ─────────────────────────────────────────────────────────────────

export interface RelationFieldProps {
  attr: RelationAttribute;
}

export const RelationField: FC<RelationFieldProps> = ({ attr }) => {
  const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';
  const isMultiple = attr.relation === 'hasMany';

  const { data: targetSchema } = useDetailedDocumentType(isOwning ? attr.target : undefined);
  const { data: docs, isLoading: docsLoading } = useDocumentSearch(
    isOwning ? attr.target : undefined,
  );

  // ── Inverse side ─────────────────────────────────────────────────────────

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

  // ── Owning side ──────────────────────────────────────────────────────────

  /** Map value → status for fast lookup in tagRender / labelRender. */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const statusByValue = useMemo<Map<string, DocStatus>>(
    () => new Map((docs ?? []).map((d) => [String(d.documentId), resolveStatus(d)])),
    [docs],
  );

  const options = (docs ?? []).map((doc) => ({
    value: String(doc.documentId),
    label: getDocumentLabel(doc, targetSchema),
    // extra field consumed by optionRender
    status: resolveStatus(doc),
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
        loading={docsLoading}
        allowClear
        showSearch
        placeholder={docsLoading ? 'Loading…' : `Select ${attr.target}…`}
        // Text-only filter so ReactNode labels don't break search
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        // ── Dropdown option row: label + status badge ──────────────────────
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
              <span
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {option.label}
              </span>
              {status && <StatusBadge status={status} />}
            </div>
          );
        }}
        // ── Selected tag (multi-select): label + status badge ──────────────
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
        // ── Selected value (single-select): label + status badge ───────────
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
