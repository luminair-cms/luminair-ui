import { FC } from 'react';
import { Typography, Row, Col, Spin, Empty } from 'antd';
import { useDocumentTypes } from '../hooks/useSchemas';
import { SchemaCard } from './SchemaCard';

const { Title, Paragraph } = Typography;

export interface SchemaListProps {
  apiId: string | undefined;
}

export const SchemaList: FC<SchemaListProps> = ({ apiId }) => {
  const { data: documentTypes, isLoading } = useDocumentTypes();

  if (isLoading && !documentTypes) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading schemas list..." />
      </div>
    );
  }

  // Filter schemas to display depending on route param
  const schemasToRender = apiId
    ? documentTypes?.filter((t) => t.id === apiId)
    : documentTypes;

  if (apiId && (!schemasToRender || schemasToRender.length === 0)) {
    return <Empty description={`Schema for '${apiId}' not found.`} />;
  }

  return (
    <Typography style={{ width: '100%' }}>
      <Title level={2}>{apiId ? `${apiId.toUpperCase()} Schema` : 'Schema Inspector'}</Title>
      <Paragraph style={{ marginBottom: 24 }}>
        {apiId
          ? `Detailed specifications for the ${apiId} document type configuration.`
          : 'Discovered content models active in the CMS backend. Select a schema from the sidebar or inspect them below.'}
      </Paragraph>

      <Row gutter={[16, 16]}>
        {schemasToRender?.map((type) => (
          <Col span={24} key={type.id}>
            <SchemaCard id={type.id} />
          </Col>
        ))}
      </Row>
    </Typography>
  );
};

export default SchemaList;
