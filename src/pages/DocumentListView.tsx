import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentList } from '@/features/content';

export const DocumentListView: FC = () => {
  const { apiId } = useParams<{ apiId: string }>();
  return <DocumentList apiId={apiId} />;
};

export default DocumentListView;
