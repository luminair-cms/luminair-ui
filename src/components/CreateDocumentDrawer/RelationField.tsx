import { FC } from 'react';
import { Form, Select, Space, Tag, Typography } from 'antd';
import { RelationAttribute } from '@/api/types';
import { useDocumentSearch } from '@/api/hooks';
import { toLabel, getDocumentLabel } from './helpers';

const { Text } = Typography;

export interface RelationFieldProps {
  attr: RelationAttribute;
}

export const RelationField: FC<RelationFieldProps> = ({ attr }) => {
  const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';
  const isMultiple = attr.relation === 'hasMany';

  const { data: docs, isLoading } = useDocumentSearch(isOwning ? attr.target : undefined);

  if (!isOwning) {
    return (
      <Form.Item label={toLabel(attr.id)}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Inverse relation via{' '}
          <Tag color="cyan" style={{ margin: 0 }}>
            {attr.target}
          </Tag>{' '}
          — managed from the owning side.
        </Text>
      </Form.Item>
    );
  }

  const options = (docs ?? []).map((doc) => ({
    value: String(doc.documentId),
    label: getDocumentLabel(doc),
  }));

  return (
    <Form.Item
      name={attr.id}
      label={
        <Space size={4}>
          {toLabel(attr.id)}
          <Tag color="cyan" style={{ fontSize: 10 }}>
            {attr.relation} → {attr.target}
          </Tag>
        </Space>
      }
    >
      <Select
        mode={isMultiple ? 'multiple' : undefined}
        options={options}
        loading={isLoading}
        allowClear
        showSearch
        placeholder={isLoading ? 'Loading…' : `Select ${attr.target}…`}
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    </Form.Item>
  );
};
