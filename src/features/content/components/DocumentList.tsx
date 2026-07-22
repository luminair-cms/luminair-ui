import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Empty, Card, Popover } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDetailedDocumentType } from '@/features/schemas';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentTable } from './DocumentTable';

const { Title } = Typography;

export interface DocumentListProps {
  apiId: string | undefined;
}

export const DocumentList: FC<DocumentListProps> = ({ apiId }) => {
  const navigate = useNavigate();
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

  return (
    <div style={{ width: '100%' }}>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Popover content={description} trigger="hover">
          <Title level={2} style={{ margin: 0, cursor: 'pointer', display: 'inline-block' }}>
            {schema.title}
          </Title>
        </Popover>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/documents/${apiId}/new`)}
        >
          Create New
        </Button>
      </div>

      <Card>
        <DocumentTable apiId={apiId} documents={documents ?? []} schema={schema} />
      </Card>
    </div>
  );
};

export default DocumentList;
