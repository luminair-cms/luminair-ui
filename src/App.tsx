import { FC } from 'react';
import { createBrowserRouter, RouterProvider, useParams, Link } from 'react-router-dom';
import { ConfigProvider, Typography, Button, Table, Tag, Card, Space, Row, Col, Spin, Empty, Badge } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themeConfig } from '@/themeConfig';
import { DashboardLayout } from '@/DashboardLayout';
import { useDocumentTypes, useDetailedDocumentType, useDocuments, Attribute, DocumentRecord, FieldConstraint } from '@/api';
import { ArrowRightOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// --- Content Manager Dashboard Overview (Home Page) ---
const ContentManagerHome: FC = () => {
  const { data: documentTypes, isLoading } = useDocumentTypes();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Discovering content schemas..." />
      </div>
    );
  }

  return (
    <Typography style={{ width: '100%' }}>
      <Title level={2}>Content Manager Overview</Title>
      <Paragraph style={{ marginBottom: 32 }}>
        Select a dynamic document type from the sidebar or click one of the registered models below to manage its content records.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {documentTypes?.map((type) => (
          <Col xs={24} sm={12} md={8} key={type.id}>
            <Card
              hoverable
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#6366f1' }} />
                  <span>{type.title}</span>
                </Space>
              }
              extra={
                <Tag color={type.type === 'collection' ? 'cyan' : 'orange'}>
                  {type.type}
                </Tag>
              }
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#94a3b8', minHeight: 44 }}>
                {type.description || 'No description provided.'}
              </Paragraph>
              <Link to={`/documents/${type.id}`}>
                <Button type="primary" icon={<ArrowRightOutlined />} style={{ width: '100%' }}>
                  Manage Content
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </Typography>
  );
};

// --- Dynamic Document List View (Phase 2 & 3) ---
const DocumentListView: FC = () => {
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
            <Tag key={locale} style={{ margin: 0, fontSize: 11, background: '#334155', border: 'none', color: '#f8fafc' }}>
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
    // Skip target attributes that act as relations in simple table lists
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
        text={<span style={{ color: publishedAt ? '#10b981' : '#f59e0b' }}>{publishedAt ? 'Published' : 'Draft'}</span>}
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

      <Card style={{ background: '#1e293b', border: '1px solid #334155' }}>
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

// --- Schema Inspector View (Phase 2 Detail view) ---
const SchemaInspector: FC = () => {
  const { data: documentTypes, isLoading } = useDocumentTypes();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="Loading schemas list..." />
      </div>
    );
  }

  return (
    <Typography style={{ width: '100%' }}>
      <Title level={2}>Schema Inspector</Title>
      <Paragraph style={{ marginBottom: 24 }}>
        Discovered content models active in the CMS backend. Select a schema below to inspect its detailed specifications.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {documentTypes?.map((type) => (
          <Col span={24} key={type.id}>
            <DetailedSchemaCard id={type.id} />
          </Col>
        ))}
      </Row>
    </Typography>
  );
};

// Subcomponent to load and inspect details of a specific schema
const DetailedSchemaCard: FC<{ id: string }> = ({ id }) => {
  const { data: schema, isLoading } = useDetailedDocumentType(id);

  if (isLoading) {
    return (
      <Card style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <Spin size="small" /> Loading schema details...
      </Card>
    );
  }

  if (!schema) return null;

  const columns = [
    {
      title: 'Attribute / Relation',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Type / Connection',
      key: 'type',
      render: (_: unknown, record: Attribute) => {
        if (record.relation) {
          return (
            <Space>
              <Tag color="cyan">Relation</Tag>
              <Text type="secondary">
                {record.relation} → <Text strong>{record.target}</Text>
              </Text>
            </Space>
          );
        }
        return <Tag color="blue">{record.type}</Tag>;
      },
    },
    {
      title: 'Unique',
      dataIndex: 'unique',
      key: 'unique',
      render: (unique: boolean) => (unique ? <Tag color="purple">Yes</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) => (required ? <Tag color="red">Yes</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Constraints',
      dataIndex: 'constraints',
      key: 'constraints',
      render: (constraints?: FieldConstraint[]) => {
        if (!constraints || constraints.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Space size={[4, 4]} wrap>
            {constraints.map((c, i) => (
              <Tag key={i} color="orange" style={{ fontSize: 11 }}>
                {Object.entries(c).map(([k, v]) => `${k}: ${v}`).join(', ')}
              </Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Text strong style={{ fontSize: 16 }}>{schema.title}</Text>
          <Tag color={schema.type === 'collection' ? 'cyan' : 'orange'}>
            {schema.type.toUpperCase()} TYPE
          </Tag>
          <Text type="secondary">({schema.id})</Text>
        </Space>
      }
      extra={
        <Space>
          {schema.options?.draftAndPublish && <Tag color="success">Draft & Publish</Tag>}
          {schema.options?.localizations?.length ? (
            <Tag color="geekblue">L10n: {schema.options.localizations.join(', ')}</Tag>
          ) : null}
        </Space>
      }
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      <Table
        dataSource={schema.attributes}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ background: 'transparent' }}
      />
    </Card>
  );
};

const Settings: FC = () => (
  <Typography>
    <Title level={2}>Settings</Title>
    <Paragraph>
      Global system configuration, localized languages registry, and SSO authentication endpoints management.
    </Paragraph>
  </Typography>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: '',
        element: <ContentManagerHome />,
      },
      {
        path: 'documents/:apiId',
        element: <DocumentListView />,
      },
      {
        path: 'schemas',
        element: <SchemaInspector />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

// TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  );
};
