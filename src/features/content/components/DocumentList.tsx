import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Empty, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDetailedDocumentType } from '@/features/schemas';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentTable } from './DocumentTable';

const { Title, Paragraph } = Typography;

export interface DocumentListProps {
  apiId: string | undefined;
}

export const DocumentList: FC<DocumentListProps> = ({ apiId }) => {
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
        <DocumentTable apiId={apiId} documents={documents ?? []} schema={schema} />
      </Card>
    </div>
  );
};

export default DocumentList;
