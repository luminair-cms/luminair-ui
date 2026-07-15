import { FC } from 'react';
import { Tag, Space, Typography } from 'antd';
import { FieldConstraint } from '../types';

const { Text } = Typography;

export interface ConstraintTagsProps {
  constraints?: FieldConstraint[];
}

export const ConstraintTags: FC<ConstraintTagsProps> = ({ constraints }) => {
  if (!constraints || constraints.length === 0) {
    return <Text type="secondary">—</Text>;
  }

  return (
    <Space size={[4, 4]} wrap>
      {constraints.map((c, i) => (
        <Tag key={i} color="orange" style={{ fontSize: 11 }}>
          {Object.entries(c)
            .map(([k, v]) => {
              // Constraint values may be nested objects (e.g. { decimal: { precision, scale } })
              const display = v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v);
              return `${k}: ${display}`;
            })
            .join(', ')}
        </Tag>
      ))}
    </Space>
  );
};

export default ConstraintTags;
