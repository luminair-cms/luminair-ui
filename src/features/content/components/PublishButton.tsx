import { FC } from 'react';
import { Button, message } from 'antd';
import { usePublishDocument } from '../hooks/useDocumentMutations';

export interface PublishButtonProps {
  apiId: string;
  documentId: string;
}

export const PublishButton: FC<PublishButtonProps> = ({ apiId, documentId }) => {
  const publishMutation = usePublishDocument(apiId, documentId);

  const handlePublish = () => {
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        message.success('Document published successfully!');
      },
      onError: (err) => {
        message.error(`Publish failed: ${err.detail || err.title || 'Unknown error'}`);
      },
    });
  };

  return (
    <Button
      size="small"
      type="primary"
      loading={publishMutation.isPending}
      onClick={handlePublish}
      style={{ background: '#10b981', borderColor: '#10b981' }}
    >
      Publish
    </Button>
  );
};
export default PublishButton;
