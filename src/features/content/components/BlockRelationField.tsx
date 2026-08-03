import { FC, useMemo } from 'react';
import { Form, Select, Space, Tag, Typography, Card, Button, theme } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { RelationAttribute, RelationAppearance, useDetailedDocumentType } from '@/features/schemas';
import { useDocumentSearch } from '../hooks/useDocuments';
import { DocumentRecord } from '../types';
import { toLabel } from '../helpers';

const { Text } = Typography;

type DocStatus = 'draft' | 'modified' | 'published';

const resolveStatus = (doc: DocumentRecord): DocStatus =>
  (doc.status as DocStatus) ?? (doc.publishedAt ? 'published' : 'draft');

const STATUS_COLOR: Record<DocStatus, string> = {
  published: 'success',
  modified: 'processing',
  draft: 'warning',
};

export interface BlockRelationFieldProps {
  attr: RelationAttribute;
  appearance?: Extract<RelationAppearance, { displayMode: 'block' }>;
  label?: string;
  description?: string;
}

export const BlockRelationField: FC<BlockRelationFieldProps> = ({
  attr,
  appearance,
  label,
  description,
}) => {
  const { token } = theme.useToken();
  const isMultiple = attr.relation === 'hasMany';

  const { data: targetSchema } = useDetailedDocumentType(attr.target);
  const { data: docs, isLoading: docsLoading } = useDocumentSearch(attr.target);

  const displayFields = appearance?.displayFields && appearance.displayFields.length > 0
    ? appearance.displayFields
    : ['name'];
  const primaryField = displayFields[0];
  const previewFields = displayFields.slice(1, 4);

  // Map documentId -> DocumentRecord for quick rendering
  const docMap = useMemo<Map<string, DocumentRecord>>(
    () => new Map((docs ?? []).map((d) => [String(d.documentId), d])),
    [docs],
  );

  return (
    <Form.Item
      name={attr.id}
      label={
        <Space size={4}>
          {label || toLabel(attr.id)}
          <Tag color="blue" style={{ fontSize: 10 }}>
            block ({attr.relation}) → {attr.target}
          </Tag>
        </Space>
      }
      help={description}
    >
      <Form.Item name={attr.id} noStyle>
        {/* Ant Design Form custom control adapter */}
        {({ value, onChange }: { value?: string | string[]; onChange?: (val: unknown) => void }) => {
          const currentIds: string[] = Array.isArray(value)
            ? value.filter(Boolean)
            : value
              ? [String(value)]
              : [];

          const handleSelect = (selectedId: string) => {
            if (!onChange) return;
            if (isMultiple) {
              if (!currentIds.includes(selectedId)) {
                onChange([...currentIds, selectedId]);
              }
            } else {
              onChange(selectedId);
            }
          };

          const handleRemove = (removeId: string) => {
            if (!onChange) return;
            if (isMultiple) {
              onChange(currentIds.filter((id) => id !== removeId));
            } else {
              onChange(undefined);
            }
          };

          // Filter out already selected documents from search options
          const unselectedDocs = (docs ?? []).filter(
            (d) => !currentIds.includes(String(d.documentId)),
          );

          const searchOptions = unselectedDocs.map((d) => {
            const primaryVal = String(d[primaryField] ?? d.documentId);
            return {
              value: String(d.documentId),
              label: primaryVal,
            };
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {/* Search Header */}
              <Select
                showSearch
                value={undefined}
                placeholder={docsLoading ? 'Loading…' : 'Add or create a relation…'}
                loading={docsLoading}
                options={searchOptions}
                onSelect={(val) => handleSelect(String(val))}
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ width: '100%' }}
              />

              {/* Vertical Card List */}
              {currentIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 360,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {currentIds.map((id) => {
                    const doc = docMap.get(id);
                    const titleVal = doc
                      ? String(doc[primaryField] ?? doc.documentId)
                      : id;
                    const status = doc ? resolveStatus(doc) : undefined;

                    return (
                      <Card
                        key={id}
                        size="small"
                        style={{
                          background: token.colorBgContainer,
                          borderColor: token.colorBorderSecondary,
                          borderRadius: token.borderRadiusSM,
                        }}
                        bodyStyle={{ padding: '8px 12px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                              overflow: 'hidden',
                            }}
                          >
                            <Text strong style={{ color: token.colorPrimary, fontSize: 13 }}>
                              {titleVal}
                            </Text>

                            {/* Preview Sub-Badges */}
                            {doc &&
                              previewFields.map((fieldKey) => {
                                const val = doc[fieldKey];
                                if (!val) return null;
                                return (
                                  <Tag key={fieldKey} color="default" style={{ margin: 0, fontSize: 10 }}>
                                    {fieldKey}: {String(val)}
                                  </Tag>
                                );
                              })}

                            {/* Status Tag */}
                            {status && (
                              <Tag
                                color={STATUS_COLOR[status]}
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {status}
                              </Tag>
                            )}
                          </div>

                          {/* Delete / Disconnect Action */}
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<CloseOutlined style={{ fontSize: 12 }} />}
                            onClick={() => handleRemove(id)}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      </Form.Item>
    </Form.Item>
  );
};
