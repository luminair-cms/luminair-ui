import { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Table, Tag, Card, Space, Spin, Empty, Badge, message } from 'antd';
import {
  useDetailedDocumentType,
  useDocuments,
  usePublishDocument,
  DocumentRecord,
  isRelationAttribute,
} from '@/api';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// Inline subcomponent to handle hook invocation per row safely
const PublishButton: FC<{ apiId: string; documentId: string }> = ({ apiId, documentId }) => {
  const publishMutation = usePublishDocument(apiId, documentId);

  const handlePublish = () => {
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        message.success('Document published successfully!');
      },
      onError: (err) => {
        message.error(`Publish failed: ${err.detail || err.title || 'Unknown error'}`);
      },
    });
  };

  return (
    <Button
      size="small"
      type="primary"
      loading={publishMutation.isPending}
      onClick={handlePublish}
      style={{ background: '#10b981', borderColor: '#10b981' }}
    >
      Publish
    </Button>
  );
};

export const DocumentListView: FC = () => {
  const { apiId } = useParams<{ apiId: string }>();
  const navigate = useNavigate();
  const { data: schema, isLoading: schemaLoading } = useDetailedDocumentType(apiId);
  const { data: documents, isLoading: docsLoading } = useDocuments(apiId);

  if (schemaLoading || docsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="Loading records and schema..." />
      </div>
    );
  }

  if (!schema || !apiId) {
    return <Empty description={`Content type '${apiId}' schema not found.`} />;
  }

  // Helper to render localized values (e.g. { en: "text", ro: "text" })
  const renderLocalizedCell = (val: unknown) => {
    if (!val) return <Text type="secondary">—</Text>;
    if (typeof val === 'object' && !Array.isArray(val)) {
      return (
        <Space size={[4, 4]} wrap>
          {Object.entries(val).map(([locale, text]) => (
            <Tag key={locale} style={{ margin: 0, fontSize: 11, background: 'var(--antd-color-bg-container)', border: '1px solid var(--antd-color-border-secondary)' }}>
              <span style={{ fontWeight: 'bold', color: '#a5b4fc', textTransform: 'uppercase', marginRight: 4 }}>{locale}</span>
              {String(text)}
            </Tag>
          ))}
        </Space>
      );
    }
    return <Text>{String(val)}</Text>;
  };

  // Build columns dynamically based on schema attributes
  const dynamicColumns: any[] = [
    {
      title: 'Document ID',
      dataIndex: 'documentId',
      key: 'documentId',
      width: 140,
      render: (text: string) => <Text copyable code style={{ fontSize: 12 }}>{text}</Text>,
    },
  ];

  // Map fields (ignoring relations for lists, or showing target tags)
  schema.attributes.forEach((attr) => {
    if (isRelationAttribute(attr)) {
      dynamicColumns.push({
        title: attr.id,
        dataIndex: attr.id,
        key: attr.id,
        width: 150,
        render: () => <Tag color="geekblue">Relation ({attr.relation})</Tag>,
      });
    } else {
      dynamicColumns.push({
        title: attr.id.charAt(0).toUpperCase() + attr.id.slice(1),
        dataIndex: attr.id,
        key: attr.id,
        width: 200,
        render: (val: unknown) => renderLocalizedCell(val),
      });
    }
  });

  // Add standard timestamp / publication columns
  dynamicColumns.push({
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

  dynamicColumns.push({
    title: 'Actions',
    key: 'actions',
    width: 160,
    render: (_text: unknown, record: DocumentRecord) => {
      const docStatus = record.status || (record.publishedAt ? 'published' : 'draft');
      const showPublish = schema.options?.draftAndPublish && docStatus !== 'published';

      return (
        <Space>
          <Button size="small" onClick={() => navigate(`/documents/${apiId}/${record.documentId}`)}>
            Edit
          </Button>
          {showPublish && (
            <PublishButton apiId={apiId} documentId={record.documentId} />
          )}
        </Space>
      );
    },
  });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography>
          <Title level={2}>{schema.title}</Title>
          <Paragraph type="secondary">{schema.info.description || 'Manage dynamic database entries.'}</Paragraph>
        </Typography>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/documents/${apiId}/new`)}>
          Create New {schema.info.singularName}
        </Button>
      </div>

      <Card>
        <Table
          dataSource={documents}
          columns={dynamicColumns}
          rowKey="id"
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          style={{ background: 'transparent' }}
        />
      </Card>
    </div>
  );
};
export default DocumentListView;
