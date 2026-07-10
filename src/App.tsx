import { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider, Typography, Button, Table, Tag, Card, Space, Row, Col } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themeConfig } from './themeConfig';
import { DashboardLayout } from './DashboardLayout';

const { Title, Paragraph, Text } = Typography;

interface Field {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  localized: boolean;
}

interface DocumentType {
  apiId: string;
  displayName: string;
  type: 'collection' | 'single';
  fields: Field[];
}

const mockSchemas: DocumentType[] = [
  {
    apiId: 'articles',
    displayName: 'Articles',
    type: 'collection',
    fields: [
      { name: 'id', type: 'Uuid', required: true, unique: true, localized: false },
      { name: 'title', type: 'LocalizedText', required: true, unique: false, localized: true },
      { name: 'slug', type: 'Uid', required: true, unique: true, localized: false },
      { name: 'content', type: 'LocalizedText', required: false, unique: false, localized: true },
      { name: 'publishedAt', type: 'DateTime', required: false, unique: false, localized: false },
    ],
  },
  {
    apiId: 'categories',
    displayName: 'Categories',
    type: 'collection',
    fields: [
      { name: 'id', type: 'Uuid', required: true, unique: true, localized: false },
      { name: 'name', type: 'LocalizedText', required: true, unique: true, localized: true },
      { name: 'description', type: 'Text', required: false, unique: false, localized: false },
    ],
  },
  {
    apiId: 'homepage',
    displayName: 'Homepage',
    type: 'single',
    fields: [
      { name: 'id', type: 'Uuid', required: true, unique: true, localized: false },
      { name: 'heroTitle', type: 'LocalizedText', required: true, unique: false, localized: true },
      { name: 'heroSubtitle', type: 'LocalizedText', required: false, unique: false, localized: true },
    ],
  },
];

// Initial placeholders for pages
const ContentManagerHome: FC = () => (
  <Typography>
    <Title level={2}>Content Manager</Title>
    <Paragraph>
      Welcome to the Luminair Content Manager. This interface dynamically discovers schema layouts from the backend API and presents them here.
    </Paragraph>
    <Button type="primary">Discover Schemas</Button>
  </Typography>
);

const SchemaInspector: FC = () => {
  const columns = [
    {
      title: 'Field Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) => (required ? <Tag color="red">Yes</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Unique',
      dataIndex: 'unique',
      key: 'unique',
      render: (unique: boolean) => (unique ? <Tag color="purple">Yes</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Localized',
      dataIndex: 'localized',
      key: 'localized',
      render: (localized: boolean) => (localized ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag>),
    },
  ];

  return (
    <Typography style={{ width: '100%' }}>
      <Title level={2}>Schema Inspector</Title>
      <Paragraph style={{ marginBottom: 24 }}>
        Below are the content structures dynamically resolved from the CMS schema definitions. These configuration formats map directly to underlying database entities.
      </Paragraph>

      <Row gutter={[16, 24]}>
        {mockSchemas.map((schema) => (
          <Col span={24} key={schema.apiId}>
            <Card
              title={
                <Space>
                  <span>{schema.displayName}</span>
                  <Tag color={schema.type === 'collection' ? 'cyan' : 'orange'}>
                    {schema.type.toUpperCase()} TYPE
                  </Tag>
                  <Text type="secondary">({schema.apiId})</Text>
                </Space>
              }
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <Table
                dataSource={schema.fields}
                columns={columns}
                rowKey="name"
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Typography>
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
