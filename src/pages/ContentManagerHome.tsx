import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Card, Space, Row, Col, Spin } from 'antd';
import { useDocumentTypes } from '@/api';
import { ArrowRightOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const ContentManagerHome: FC = () => {
  const { data: documentTypes, isLoading } = useDocumentTypes();

  if (isLoading && !documentTypes) {
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
                <span style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}>
                  {type.type}
                </span>
              }
              style={{ background: 'var(--antd-color-bg-container)', border: '1px solid var(--antd-color-border-secondary)' }}
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
export default ContentManagerHome;
