import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Typography, Badge, Popover, Button, Popconfirm, message, Divider, Tooltip, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined, DeleteOutlined, EditOutlined, CloudUploadOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { DetailedDocumentResponse, isRelationAttribute } from '@/features/schemas';
import { DocumentRecord } from '../types';
import { renderLocalizedCell, sortAttributesByDefaultOrder, toLabel, getRecordFieldValue } from '../helpers';
import { useDeleteDocument, usePublishDocument } from '../hooks/useDocumentMutations';

const { Text } = Typography;

interface DocumentRowActionsProps {
  apiId: string;
  record: DocumentRecord;
  schema: DetailedDocumentResponse;
}

const DocumentRowActions: FC<DocumentRowActionsProps> = ({ apiId, record, schema }) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const deleteMutation = useDeleteDocument(apiId);
  const publishMutation = usePublishDocument(apiId, record.documentId);

  const docStatus = record.status || (record.publishedAt ? 'published' : 'draft');
  const showPublish = schema.options?.draftAndPublish && docStatus !== 'published';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(record.documentId);
    setCopied(true);
    message.success('Document ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    navigate(`/documents/${apiId}/${record.documentId}`);
  };

  const handlePublish = (e: React.MouseEvent) => {
    e.stopPropagation();
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        message.success('Document published successfully!');
        setOpen(false);
      },
      onError: (err) => {
        message.error(`Publish failed: ${err.detail || err.title || 'Unknown error'}`);
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(record.documentId, {
      onSuccess: () => {
        message.success('Document deleted successfully!');
        setOpen(false);
      },
      onError: (err) => {
        message.error(`Delete failed: ${err.detail || err.title || 'Unknown error'}`);
      },
    });
  };

  const popoverContent = (
    <div style={{ width: 220, padding: 4 }} onClick={(e) => e.stopPropagation()}>
      {/* Document ID section with copy feedback */}
      <div style={{ padding: '4px 8px 8px 8px' }}>
        <Text
          type="secondary"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 6,
          }}
        >
          Document ID
        </Text>
        <div
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusSM,
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Text
            ellipsis
            code
            style={{
              fontSize: 11,
              margin: 0,
              background: 'transparent',
              border: 'none',
              color: token.colorText,
              maxWidth: 160,
            }}
          >
            {record.documentId}
          </Text>
          <Tooltip title={copied ? 'Copied!' : 'Copy ID'}>
            {copied ? (
              <CheckOutlined style={{ fontSize: 12, color: token.colorSuccess }} />
            ) : (
              <CopyOutlined style={{ fontSize: 12, color: token.colorTextDescription }} />
            )}
          </Tooltip>
        </div>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      {/* Menu Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          type="text"
          block
          icon={<EditOutlined />}
          onClick={handleEdit}
          style={{
            textAlign: 'left',
            justifyContent: 'flex-start',
            height: 34,
            fontSize: 13,
          }}
        >
          Edit Entry
        </Button>

        {showPublish && (
          <Button
            type="text"
            block
            icon={<CloudUploadOutlined style={{ color: token.colorSuccess }} />}
            loading={publishMutation.isPending}
            onClick={handlePublish}
            style={{
              textAlign: 'left',
              justifyContent: 'flex-start',
              height: 34,
              fontSize: 13,
              color: token.colorSuccess,
            }}
          >
            Publish Draft
          </Button>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <Popconfirm
          title="Delete document"
          description="Are you sure you want to delete this document?"
          onConfirm={handleDelete}
          okText="Delete"
          okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          cancelText="Cancel"
        >
          <Button
            danger
            type="text"
            block
            icon={<DeleteOutlined />}
            style={{
              textAlign: 'left',
              justifyContent: 'flex-start',
              height: 34,
              fontSize: 13,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Delete Entry
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover
        content={popoverContent}
        trigger="hover"
        placement="left"
        open={open}
        onOpenChange={setOpen}
        overlayInnerStyle={{ padding: 6, borderRadius: token.borderRadiusLG }}
      >
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined style={{ fontSize: 18 }} />}
          onClick={(e) => e.stopPropagation()}
        />
      </Popover>
    </div>
  );
};

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
        title: toLabel(attr.id),
        key: attr.id,
        width: 200,
        render: (_val: unknown, record: DocumentRecord) => {
          const rawVal = getRecordFieldValue(record, attr.id);
          return renderLocalizedCell(rawVal);
        },
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
    render: (_text: unknown, record: DocumentRecord) => (
      <DocumentRowActions apiId={apiId} record={record} schema={schema} />
    ),
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
