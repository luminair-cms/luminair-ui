import { FC } from 'react';
import { Tag, Space } from 'antd';
import { FieldAttribute } from '../types';

export interface AttributeTypeTagProps {
  type: FieldAttribute['type'];
}

export const AttributeTypeTag: FC<AttributeTypeTagProps> = ({ type }) => {
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
        <Tag color="geekblue" style={{ fontSize: 11 }}>
          {detail}
        </Tag>
      </Space>
    );
  }

  // Scalar variant: { integer: "int32" }
  return (
    <Space size={4}>
      <Tag color="blue">{typeName}</Tag>
      <Tag color="geekblue" style={{ fontSize: 11 }}>
        {String(params)}
      </Tag>
    </Space>
  );
};

export default AttributeTypeTag;
