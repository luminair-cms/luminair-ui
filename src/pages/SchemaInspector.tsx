import { FC } from 'react';
import { Typography, Table, Tag, Card, Space, Row, Col, Spin } from 'antd';
import { useDocumentTypes, useDetailedDocumentType, Attribute, FieldConstraint } from '@/api';

const { Title, Paragraph, Text } = Typography;

export const SchemaInspector: FC = () => {
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

const DetailedSchemaCard: FC<{ id: string }> = ({ id }) => {
  const { data: schema, isLoading } = useDetailedDocumentType(id);

  if (isLoading) {
    return (
      <Card style={{ background: 'var(--antd-color-bg-container)', border: '1px solid var(--antd-color-border-secondary)' }}>
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
export default SchemaInspector;
