import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Card, Space, Row, Col, Spin, theme } from 'antd';
import { useDocumentTypes } from '../hooks/useSchemas';
import { ArrowRightOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const SchemaOverview: FC = () => {
  const { data: documentTypes, isLoading } = useDocumentTypes();
  const { token } = theme.useToken();

  if (isLoading && !documentTypes) {
    return (
      <div className="loading-container" style={{ height: '100%' }}>
        <Spin size="large" tip="Discovering content schemas..." />
      </div>
    );
  }

  return (
    <Typography style={{ width: '100%' }}>
      <Title level={2}>Content Manager Overview</Title>
      <Paragraph style={{ marginBottom: 32 }}>
        Select a dynamic document type from the sidebar or click one of the registered models below
        to manage its content records.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {documentTypes?.map((type) => (
          <Col xs={24} sm={12} md={8} key={type.id}>
            <Card
              hoverable
              title={
                <Space>
                  <FileTextOutlined style={{ color: token.colorPrimary }} />
                  <span>{type.title}</span>
                </Space>
              }
              extra={
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: token.colorTextSecondary,
                  }}
                >
                  {type.type}
                </span>
              }
              style={{
                background: 'var(--antd-color-bg-container)',
                border: '1px solid var(--antd-color-border-secondary)',
              }}
            >
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ color: token.colorTextSecondary, minHeight: 44 }}
              >
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

export default SchemaOverview;
