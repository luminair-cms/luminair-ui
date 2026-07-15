import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { SchemaList } from '@/features/schemas';

export const SchemaInspector: FC = () => {
  const { apiId } = useParams<{ apiId?: string }>();
  return <SchemaList apiId={apiId} />;
};

export default SchemaInspector;
