import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Table, Tag, Card, Space, Row, Col, Spin, Empty } from 'antd';
import { useDocumentTypes, useDetailedDocumentType, Attribute, FieldConstraint, FieldAttribute, isRelationAttribute } from '@/api';

const { Title, Paragraph, Text } = Typography;

/**
 * Converts a backend `type` value to a human-readable label.
 * The backend may return:
 *   - a plain string:                  "text" | "uid" | "localizedText" | …
 *   - a scalar variant object:         { "integer": "int32" }
 *   - a parameterised variant object:  { "decimal": { "precision": 10, "scale": 8 } }
 */
const renderAttributeType = (type: FieldAttribute['type']) => {
  if (typeof type === 'string') {
    return <Tag color="blue">{type}</Tag>;
  }

  // Tagged-union object — exactly one key is the type name
  const entries = Object.entries(type);
  if (entries.length === 0) {
    return <Tag color="blue">unknown</Tag>;
  }

  const [typeName, params] = entries[0];

  if (params !== null && typeof params === 'object') {
    // Parameterised: { decimal: { precision: 10, scale: 8 } }
    const detail = Object.entries(params as Record<string, unknown>)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    return (
      <Space size={4}>
        <Tag color="blue">{typeName}</Tag>
        <Tag color="geekblue" style={{ fontSize: 11 }}>{detail}</Tag>
      </Space>
    );
  }

  // Scalar variant: { integer: "int32" }
  return (
    <Space size={4}>
      <Tag color="blue">{typeName}</Tag>
      <Tag color="geekblue" style={{ fontSize: 11 }}>{String(params)}</Tag>
    </Space>
  );
};

export const SchemaInspector: FC = () => {
  const { apiId } = useParams<{ apiId?: string }>();
  const { data: documentTypes, isLoading } = useDocumentTypes();

  if (isLoading && !documentTypes) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
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
            <DetailedSchemaCard id={type.id} />
          </Col>
        ))}
      </Row>
    </Typography>
  );
};

const DetailedSchemaCard: FC<{ id: string }> = ({ id }) => {
  const { data: schema, isLoading } = useDetailedDocumentType(id);

  if (isLoading && !schema) {
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
        if (isRelationAttribute(record)) {
          return (
            <Space>
              <Tag color="cyan">Relation</Tag>
              <Text type="secondary">
                {record.relation} → <Text strong>{record.target}</Text>
              </Text>
            </Space>
          );
        }
        return renderAttributeType((record as FieldAttribute).type);
      },
    },
    {
      title: 'Unique',
      dataIndex: 'unique',
      key: 'unique',
      // Relation attributes don't carry unique/required — guard against undefined/null
      render: (unique: unknown) =>
        unique === true ? <Tag color="purple">Yes</Tag> : <Tag color="default">No</Tag>,
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      render: (required: unknown) =>
        required === true ? <Tag color="red">Yes</Tag> : <Tag color="default">No</Tag>,
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
                {Object.entries(c)
                  .map(([k, v]) => {
                    // Constraint values may be nested objects (e.g. { decimal: { precision, scale } })
                    const display =
                      v !== null && typeof v === 'object'
                        ? JSON.stringify(v)
                        : String(v);
                    return `${k}: ${display}`;
                  })
                  .join(', ')}
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
