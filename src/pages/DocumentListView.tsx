import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Button, Table, Tag, Card, Space, Spin, Empty, Badge } from 'antd';
import { useDetailedDocumentType, useDocuments, DocumentRecord } from '@/api';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const DocumentListView: FC = () => {
  const { apiId } = useParams<{ apiId: string }>();
  const { data: schema, isLoading: schemaLoading } = useDetailedDocumentType(apiId);
  const { data: documents, isLoading: docsLoading } = useDocuments(apiId);

  if (schemaLoading || docsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="Loading records and schema..." />
      </div>
    );
  }

  if (!schema) {
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
    return String(val);
  };

  // Build columns dynamically based on schema attributes
  const dynamicColumns = [
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
    if (attr.relation) {
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
    dataIndex: 'publishedAt',
    key: 'status',
    width: 120,
    render: (publishedAt: string | null) => (
      <Badge
        status={publishedAt ? 'success' : 'warning'}
        text={<span>{publishedAt ? 'Published' : 'Draft'}</span>}
      />
    ),
  });

  dynamicColumns.push({
    title: 'Actions',
    key: 'actions',
    width: 160,
    render: (_text: unknown, record: DocumentRecord) => (
      <Space>
        <Button size="small">Edit</Button>
        {!record.publishedAt && (
          <Button size="small" type="primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
            Publish
          </Button>
        )}
      </Space>
    ),
  });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography>
          <Title level={2}>{schema.title}</Title>
          <Paragraph type="secondary">{schema.info.description || 'Manage dynamic database entries.'}</Paragraph>
        </Typography>
        <Button type="primary" icon={<PlusOutlined />}>
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
