import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Typography, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DetailedDocumentResponse, isRelationAttribute } from '@/features/schemas';
import { DocumentRecord } from '../types';
import { renderLocalizedCell } from '../helpers';
import PublishButton from './PublishButton';

const { Text } = Typography;

export interface DocumentTableProps {
  apiId: string;
  documents: DocumentRecord[];
  schema: DetailedDocumentResponse;
}

export const DocumentTable: FC<DocumentTableProps> = ({ apiId, documents, schema }) => {
  const navigate = useNavigate();

  // Build columns dynamically based on schema attributes
  const columns: ColumnsType<DocumentRecord> = [
    {
      title: 'Document ID',
      dataIndex: 'documentId',
      key: 'documentId',
      width: 140,
      render: (text: string) => (
        <Text copyable code style={{ fontSize: 12 }}>
          {text}
        </Text>
      ),
    },
  ];

  // Map fields (showing relation tags or localized values)
  schema.attributes.forEach((attr) => {
    if (isRelationAttribute(attr)) {
      columns.push({
        title: attr.id,
        dataIndex: attr.id,
        key: attr.id,
        width: 150,
        render: () => <Tag color="geekblue">Relation ({attr.relation})</Tag>,
      });
    } else {
      columns.push({
        title: attr.id.charAt(0).toUpperCase() + attr.id.slice(1),
        dataIndex: attr.id,
        key: attr.id,
        width: 200,
        render: (val: unknown) => renderLocalizedCell(val),
      });
    }
  });

  // Add standard Status column
  columns.push({
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: string | undefined, record: DocumentRecord) => {
      const docStatus = status || (record.publishedAt ? 'published' : 'draft');
      const normalized = String(docStatus).toLowerCase();

      if (normalized === 'published') {
        return <Badge status="success" text="Published" />;
      }
      if (normalized === 'modified') {
        return <Badge status="processing" text="Modified" />;
      }
      return <Badge status="warning" text="Draft" />;
    },
  });

  // Actions column — Publish only (row click handles navigation to edit)
  columns.push({
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (_text: unknown, record: DocumentRecord) => {
      const docStatus = record.status || (record.publishedAt ? 'published' : 'draft');
      const showPublish = schema.options?.draftAndPublish && docStatus !== 'published';

      return showPublish ? (
        <Space>
          <PublishButton apiId={apiId} documentId={record.documentId} />
        </Space>
      ) : null;
    },
  });

  return (
    <Table
      dataSource={documents}
      columns={columns}
      rowKey="id"
      size="middle"
      scroll={{ x: 'max-content' }}
      pagination={{ pageSize: 10 }}
      style={{ background: 'transparent' }}
      onRow={(record) => ({
        onClick: () => navigate(`/documents/${apiId}/${record.documentId}`),
        style: { cursor: 'pointer' },
      })}
    />
  );
};

export default DocumentTable;
