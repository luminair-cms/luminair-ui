import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Button, Popconfirm, Popover, Typography, Space, message, MenuProps } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  SettingOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DocumentRecord } from '../types';

const { Text } = Typography;

export interface DocumentHeaderActionsProps {
  apiId: string;
  documentId?: string;
  document?: DocumentRecord | null;
  isNew: boolean;
  onDelete?: () => void;
  deletePending?: boolean;
}

export const DocumentHeaderActions: FC<DocumentHeaderActionsProps> = ({
  apiId,
  documentId,
  document,
  isNew,
  onDelete,
  deletePending = false,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleCopyId = () => {
    if (documentId) {
      navigator.clipboard.writeText(documentId);
      message.success('Document ID copied to clipboard!');
    }
  };

  const metadataContent = (
    <div style={{ minWidth: 220, padding: 4 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            DOCUMENT ID
          </Text>
          <Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {documentId || '—'}
          </Text>
        </div>
        {document?.createdAt && (
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              CREATED AT
            </Text>
            <Text style={{ fontSize: 12 }}>
              {dayjs(document.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        )}
        {document?.updatedAt && (
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              UPDATED AT
            </Text>
            <Text style={{ fontSize: 12 }}>
              {dayjs(document.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        )}
        {document?.publishedAt && (
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              PUBLISHED AT
            </Text>
            <Text style={{ fontSize: 12 }}>
              {dayjs(document.publishedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );

  const items: MenuProps['items'] = [
    {
      key: 'edit-model',
      icon: <EditOutlined />,
      label: <Link to={`/schemas/${apiId}`}>Edit the model</Link>,
    },
    {
      key: 'configure-view',
      icon: <SettingOutlined />,
      label: <Link to={`/documents/${apiId}/settings/configure-view`}>Configure the view</Link>,
    },
    {
      type: 'divider',
    },
    ...(!isNew && documentId
      ? [
          {
            key: 'copy-id',
            icon: <CopyOutlined />,
            label: 'Copy Document ID',
            onClick: handleCopyId,
          },
          {
            key: 'metadata-info',
            icon: <InfoCircleOutlined />,
            label: (
              <Popover content={metadataContent} title="Entry Details" trigger="hover" placement="left">
                <span>View Details</span>
              </Popover>
            ),
          },
          {
            type: 'divider' as const,
          },
        ]
      : []),
    ...(!isNew && onDelete
      ? [
          {
            key: 'delete-entry',
            danger: true,
            icon: <DeleteOutlined />,
            label: 'Delete entry',
            onClick: () => setDeleteConfirmOpen(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <Button icon={<MoreOutlined style={{ fontSize: 18 }} />} />
      </Dropdown>

      {!isNew && onDelete && (
        <Popconfirm
          open={deleteConfirmOpen}
          title="Delete document"
          description="Are you sure you want to delete this document? This action cannot be undone."
          onConfirm={() => {
            setDeleteConfirmOpen(false);
            onDelete();
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
          okText="Delete"
          okButtonProps={{ danger: true, loading: deletePending }}
          cancelText="Cancel"
        />
      )}
    </>
  );
};
