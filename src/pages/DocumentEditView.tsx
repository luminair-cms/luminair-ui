import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentForm } from '@/features/content';

export const DocumentEditView: FC = () => {
  const { apiId, documentId } = useParams<{ apiId: string; documentId: string }>();
  return <DocumentForm apiId={apiId} documentId={documentId} />;
};

export default DocumentEditView;
