import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Tag, Typography } from 'antd';
import { RelationAttribute, useUiConfig } from '@/features/schemas';
import { InlineRelationField } from './InlineRelationField';
import { BlockRelationField } from './BlockRelationField';
import { toLabel } from '../helpers';

const { Text } = Typography;

export interface RelationFieldProps {
  attr: RelationAttribute;
}

export const RelationField: FC<RelationFieldProps> = ({ attr }) => {
  const { apiId } = useParams<{ apiId: string }>();
  const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';

  const { data: uiConfig } = useUiConfig(apiId);

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

  const relConfig = uiConfig?.layouts?.relations?.find(
    (r) => r.attributeId === attr.id,
  );

  if (relConfig?.displayMode === 'block') {
    return <BlockRelationField attr={attr} config={relConfig} />;
  }

  return <InlineRelationField attr={attr} />;
};
