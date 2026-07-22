import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Typography, Badge, Popover, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined } from '@ant-design/icons';
import { DetailedDocumentResponse, isRelationAttribute } from '@/features/schemas';
import { DocumentRecord } from '../types';
import { renderLocalizedCell, sortAttributesByDefaultOrder } from '../helpers';
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
  const columns: ColumnsType<DocumentRecord> = [];

  // Map fields (showing relation tags or localized values)
  const sortedAttributes = sortAttributesByDefaultOrder(schema.attributes);
  sortedAttributes.forEach((attr) => {
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

  // Compact Actions column — header name is 3 vertical dots (MoreOutlined)
  columns.push({
    title: <MoreOutlined style={{ fontSize: 16 }} />,
    key: 'actions',
    width: 60,
    align: 'center',
    render: (_text: unknown, record: DocumentRecord) => {
      const docStatus = record.status || (record.publishedAt ? 'published' : 'draft');
      const showPublish = schema.options?.draftAndPublish && docStatus !== 'published';

      const popoverContent = (
        <Space direction="vertical" size={8} style={{ padding: '4px 2px' }} onClick={(e) => e.stopPropagation()}>
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
              Document ID
            </Text>
            <Text copyable code style={{ fontSize: 12 }}>
              {record.documentId}
            </Text>
          </div>
          {showPublish && (
            <PublishButton apiId={apiId} documentId={record.documentId} />
          )}
        </Space>
      );

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Popover content={popoverContent} trigger="hover" placement="left">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined style={{ fontSize: 18 }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popover>
        </div>
      );
    },
  });

  return (
    <Table
      dataSource={documents}
      columns={columns}
      rowKey="id"
      size="middle"
      scroll={{ x: 'max-content' }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
        locale: { items_per_page: 'Entries per page' },
        style: { padding: '16px 24px', margin: 0 },
      }}
      style={{ background: 'transparent' }}
      onRow={(record) => ({
        onClick: () => navigate(`/documents/${apiId}/${record.documentId}`),
        style: { cursor: 'pointer' },
      })}
    />
  );
};

export default DocumentTable;
