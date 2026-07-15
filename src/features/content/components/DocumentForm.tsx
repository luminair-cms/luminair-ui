import { FC, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Space,
  Spin,
  Empty,
  Tag,
  Form,
  Breadcrumb,
  Alert,
  message,
  Divider,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useDetailedDocumentType, isRelationAttribute, FieldAttribute, RelationAttribute } from '@/features/schemas';
import { useDocument } from '../hooks/useDocuments';
import {
  useCreateDocument,
  useUpdateDocument,
  usePublishDocument,
} from '../hooks/useDocumentMutations';
import { DocumentFormField } from './DocumentFormField';
import { RelationField } from './RelationField';
import { documentToFormValues, coerceValue, getTypeName } from '../helpers';

const { Title, Paragraph } = Typography;

export interface DocumentFormProps {
  apiId: string | undefined;
  documentId: string | undefined;
}

export const DocumentForm: FC<DocumentFormProps> = ({ apiId, documentId }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const isNew = documentId === 'new';

  const { data: schema, isLoading: schemaLoading } = useDetailedDocumentType(apiId);
  const { data: document, isLoading: documentLoading } = useDocument(apiId, documentId);

  const createMutation = useCreateDocument(apiId);
  const updateMutation = useUpdateDocument(apiId, documentId);
  const publishMutation = usePublishDocument(apiId, documentId);

  const localizations = useMemo(() => schema?.options?.localizations ?? [], [schema]);

  // Load document values into form
  useEffect(() => {
    if (document && schema && !isNew) {
      const initialValues = documentToFormValues(document, schema.attributes);
      form.setFieldsValue(initialValues);
    } else if (isNew) {
      form.resetFields();
    }
  }, [document, schema, isNew, form]);

  const onFinish = useCallback(
    (values: Record<string, unknown>) => {
      if (!schema) return;

      const data: Record<string, unknown> = {};

      for (const attr of schema.attributes) {
        if (isRelationAttribute(attr)) {
          const val = values[attr.id];
          if (val !== undefined && val !== null) {
            const ids = Array.isArray(val) ? val : [val];
            data[attr.id] = { connect: ids };
          } else {
            data[attr.id] = { disconnect: [] }; // disconnect all if cleared
          }
        } else {
          const typeName = getTypeName(attr.type);
          if (typeName === 'uuid') continue;

          const raw = values[attr.id];
          if (raw === undefined || raw === null) continue;

          data[attr.id] = coerceValue(typeName, raw);
        }
      }

      if (isNew) {
        createMutation.mutate(
          { data },
          {
            onSuccess: (newDocId) => {
              message.success(`${schema.info.singularName} created successfully!`);
              // Smooth/invisible transition to editing mode
              navigate(`/documents/${apiId}/${newDocId}`, { replace: true });
            },
          },
        );
      } else {
        updateMutation.mutate(
          { data },
          {
            onSuccess: () => {
              message.success(`${schema.info.singularName} updated successfully!`);
            },
          },
        );
      }
    },
    [schema, isNew, createMutation, updateMutation, apiId, navigate],
  );

  const handlePublish = useCallback(() => {
    if (!schema) return;
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        message.success(`${schema.info.singularName} published successfully!`);
      },
    });
  }, [schema, publishMutation]);

  const loading = schemaLoading || (!isNew && documentLoading);

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '300px' }}>
        <Spin size="large" tip="Loading document details..." />
      </div>
    );
  }

  if (!schema) {
    return <Empty description={`Content type '${apiId}' schema not found.`} />;
  }

  if (!isNew && !document) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Document Not Found"
          description={`The requested document with ID '${documentId}' could not be loaded.`}
          showIcon
        />
        <div style={{ marginTop: 16 }}>
          <Link to={`/documents/${apiId}`}>
            <Button icon={<ArrowLeftOutlined />}>Back to list</Button>
          </Link>
        </div>
      </div>
    );
  }

  const mutationError = isNew ? createMutation.error : updateMutation.error;
  const errorMessage = mutationError
    ? `${mutationError.title ?? 'Error'}: ${mutationError.detail ?? 'An unexpected error occurred.'}`
    : null;

  const publishError = publishMutation.error;
  const publishErrorMessage = publishError
    ? `${publishError.title ?? 'Publish Error'}: ${publishError.detail ?? 'Could not publish document.'}`
    : null;

  // Determine current status
  const documentStatus = document?.status || (document?.publishedAt ? 'published' : 'draft');

  return (
    <div style={{ width: '100%' }}>
      {/* Header and Breadcrumbs */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/">Home</Link> },
            { title: <Link to={`/documents/${apiId}`}>{schema.title}</Link> },
            { title: isNew ? 'Create New' : documentId },
          ]}
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Space align="center" size={12}>
              <Title level={2} style={{ margin: 0 }}>
                {isNew ? `Create New ${schema.info.singularName}` : `Edit ${schema.info.singularName}`}
              </Title>
              {!isNew && schema.options?.draftAndPublish && (
                <Tag
                  color={
                    documentStatus === 'published'
                      ? 'success'
                      : documentStatus === 'modified'
                      ? 'processing'
                      : 'warning'
                  }
                  style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                >
                  {documentStatus}
                </Tag>
              )}
            </Space>
            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
              {isNew ? 'Fill in the fields to create a new record.' : `Document ID: ${documentId}`}
            </Paragraph>
          </div>
          <Space>
            <Link to={`/documents/${apiId}`}>
              <Button icon={<ArrowLeftOutlined />}>Back</Button>
            </Link>
            {!isNew && schema.options?.draftAndPublish && (
              <Button
                type="default"
                icon={<CloudUploadOutlined />}
                loading={publishMutation.isPending}
                onClick={handlePublish}
                disabled={documentStatus === 'published'}
                style={{
                  background: documentStatus !== 'published' ? token.colorSuccess : undefined,
                  color: documentStatus !== 'published' ? token.colorTextLightSolid : undefined,
                  borderColor: documentStatus !== 'published' ? token.colorSuccess : undefined,
                }}
              >
                Publish
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isNew ? createMutation.isPending : updateMutation.isPending}
              onClick={() => form.submit()}
            >
              {isNew ? 'Create' : 'Save Changes'}
            </Button>
          </Space>
        </div>
      </div>

      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          showIcon
          closable
          style={{ marginBottom: 20 }}
        />
      )}

      {publishErrorMessage && (
        <Alert
          type="error"
          message={publishErrorMessage}
          showIcon
          closable
          style={{ marginBottom: 20 }}
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          scrollToFirstError
        >
          {/* Field attributes */}
          {schema.attributes
            .filter((a) => !isRelationAttribute(a))
            .map((attr) => (
              <DocumentFormField
                key={attr.id}
                attr={attr as FieldAttribute}
                localizations={localizations}
              />
            ))}

          {/* Relation attributes */}
          {schema.attributes.some((a) => isRelationAttribute(a)) && (
            <>
              <Divider titlePlacement="left" plain style={{ fontSize: 12, color: token.colorTextSecondary, margin: '24px 0 16px' }}>
                Relations
              </Divider>
              {schema.attributes
                .filter((a) => isRelationAttribute(a))
                .map((attr) => (
                  <RelationField key={attr.id} attr={attr as RelationAttribute} />
                ))}
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default DocumentForm;
