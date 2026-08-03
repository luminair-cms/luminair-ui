import { FC } from 'react';
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
  const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';

  // Fetch the TARGET type's config — it declares how it wants to appear in relation fields.
  const { data: targetConfig } = useUiConfig(attr.target);

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

  const appearance = targetConfig?.relationAppearance;

  if (appearance?.displayMode === 'block') {
    return <BlockRelationField attr={attr} appearance={appearance} />;
  }

  // Inline mode: InlineRelationField already uses targetSchema's primary field via getDocumentLabel.
  return <InlineRelationField attr={attr} />;
};

