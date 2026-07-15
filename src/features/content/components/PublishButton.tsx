import { FC } from 'react';
import { Button, message, theme } from 'antd';
import { usePublishDocument } from '../hooks/useDocumentMutations';

export interface PublishButtonProps {
  apiId: string;
  documentId: string;
}

export const PublishButton: FC<PublishButtonProps> = ({ apiId, documentId }) => {
  const publishMutation = usePublishDocument(apiId, documentId);
  const { token } = theme.useToken();

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
      style={{ background: token.colorSuccess, borderColor: token.colorSuccess }}
    >
      Publish
    </Button>
  );
};
export default PublishButton;
