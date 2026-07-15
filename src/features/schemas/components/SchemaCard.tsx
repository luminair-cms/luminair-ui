import { FC } from 'react';
import { Card, Table, Tag, Space, Typography, Spin } from 'antd';
import { Attribute, FieldAttribute, isRelationAttribute } from '../types';
import { useDetailedDocumentType } from '../hooks/useSchemas';
import AttributeTypeTag from './AttributeTypeTag';
import ConstraintTags from './ConstraintTags';

const { Text } = Typography;

export interface SchemaCardProps {
  id: string;
}

export const SchemaCard: FC<SchemaCardProps> = ({ id }) => {
  const { data: schema, isLoading } = useDetailedDocumentType(id);

  if (isLoading && !schema) {
    return (
      <Card
        style={{
          background: 'var(--antd-color-bg-container)',
          border: '1px solid var(--antd-color-border-secondary)',
        }}
      >
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
        return <AttributeTypeTag type={(record as FieldAttribute).type} />;
      },
    },
    {
      title: 'Unique',
      dataIndex: 'unique',
      key: 'unique',
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
      render: (constraints?: any[]) => <ConstraintTags constraints={constraints} />,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Text strong style={{ fontSize: 16 }}>
            {schema.title}
          </Text>
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

export default SchemaCard;
