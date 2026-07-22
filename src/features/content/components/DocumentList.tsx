import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Empty, Card, Popover, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDetailedDocumentType } from '@/features/schemas';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentTable } from './DocumentTable';

const { Title, Text } = Typography;

export interface DocumentListProps {
  apiId: string | undefined;
}

export const DocumentList: FC<DocumentListProps> = ({ apiId }) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { data: schema, isLoading: schemaLoading } = useDetailedDocumentType(apiId);
  const { data: documents, isLoading: docsLoading } = useDocuments(apiId);

  if (schemaLoading || docsLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading records and schema..." />
      </div>
    );
  }

  if (!schema || !apiId) {
    return <Empty description={`Content type '${apiId}' schema not found.`} />;
  }

  const description = schema.info.description || 'Manage dynamic database entries.';
  const entriesCount = documents?.length ?? 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Header section sitting directly on page layout */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <div>
          <Popover content={description} trigger="hover">
            <Title level={2} style={{ margin: 0, cursor: 'pointer', display: 'inline-block' }}>
              {schema.title}
            </Title>
          </Popover>
          <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
            {entriesCount} {entriesCount === 1 ? 'entry' : 'entries'} found
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/documents/${apiId}/new`)}
        >
          Create New
        </Button>
      </div>

      {/* White table container */}
      <Card
        bordered={false}
        style={{
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <DocumentTable apiId={apiId} documents={documents ?? []} schema={schema} />
      </Card>
    </div>
  );
};

export default DocumentList;
