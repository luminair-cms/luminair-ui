import { FC, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Empty,
  Tag,
  Form,
  Breadcrumb,
  Alert,
  message,
  Divider,
  Popconfirm,
  theme,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useDetailedDocumentType,
  isRelationAttribute,
  FieldAttribute,
  RelationAttribute,
} from '@/features/schemas';
import { useDocument } from '../hooks/useDocuments';
import { DocumentHeaderActions } from './DocumentHeaderActions';
import {
  useCreateDocument,
  useUpdateDocument,
  usePublishDocument,
  useDeleteDocument,
} from '../hooks/useDocumentMutations';
import { DocumentFormField } from './DocumentFormField';
import { RelationField } from './RelationField';
import {
  documentToFormValues,
  coerceValue,
  getTypeName,
  sortAttributesByDefaultOrder,
  getPrimaryFieldValue,
  snakeToCamel,
} from '../helpers';
import { useDocumentStore } from '../store/useDocumentStore';

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
  const deleteMutation = useDeleteDocument(apiId, documentId);

  const handleDelete = useCallback(() => {
    if (!schema || !documentId) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        message.success(`${schema.info.singularName} deleted successfully!`);
        navigate(`/documents/${apiId}`);
      },
      onError: (err) => {
        message.error(`Delete failed: ${err.detail || err.title || 'Unknown error'}`);
      },
    });
  }, [schema, documentId, deleteMutation, navigate, apiId]);

  const localizations = useMemo(() => schema?.options?.localizations ?? [], [schema]);
  const sortedAttributes = useMemo(
    () => (schema ? sortAttributesByDefaultOrder(schema.attributes) : []),
    [schema],
  );

  // Zustand Store variables & actions
  const initStore = useDocumentStore((state) => state.initStore);
  const setFieldValue = useDocumentStore((state) => state.setFieldValue);
  const setFieldValuePath = useDocumentStore((state) => state.setFieldValuePath);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const resetStore = useDocumentStore((state) => state.reset);
  const initialValues = useDocumentStore((state) => state.initialValues);

  // Load document values into form and reset/initialize Zustand store
  useEffect(() => {
    if (document && schema && !isNew) {
      const formValues = documentToFormValues(document, schema.attributes);
      form.setFieldsValue(formValues);
      initStore(schema, document, false);
    } else if (isNew && schema) {
      form.resetFields();
      initStore(schema, null, true);
    }
  }, [document, schema, isNew, form, initStore]);

  // Clean up store on unmount
  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const onFinish = useCallback(
    (values: Record<string, unknown>) => {
      try {
        if (!schema) return;

        const data: Record<string, unknown> = {};

        for (const attr of schema.attributes) {
          if (isRelationAttribute(attr)) {
            const isOwning = attr.relation === 'hasOne' || attr.relation === 'hasMany';
            if (!isOwning) continue;

            const val = values[attr.id];
            const initialVal = initialValues[attr.id];

            // For existing documents, skip relation payloads if relation was unchanged.
            // Compare as sorted comma-separated strings so array order doesn't matter.
            if (!isNew) {
              const toSortedStr = (v: unknown) =>
                Array.isArray(v)
                  ? [...v]
                      .map(String)
                      .sort()
                      .join(',')
                  : String(v ?? '');
              if (toSortedStr(val) === toSortedStr(initialVal)) {
                continue;
              }
            }

            if (val !== undefined && val !== null && val !== '') {
              const ids = Array.isArray(val) ? val.filter(Boolean) : [val];
              if (ids.length > 0) {
                data[attr.id] = { connect: ids };
              } else {
                data[attr.id] = { disconnect: [] };
              }
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
      } catch (err) {
        message.error(`Unexpected error preparing save: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [schema, isNew, initialValues, createMutation, updateMutation, apiId, navigate],
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

  // Save Changes is disabled for existing records until the user makes a change
  const isSaveDisabled = !isNew && !isDirty;

  const primaryValue = getPrimaryFieldValue(document, schema.attributes);
  const headerTitle = isNew
    ? `Create New ${schema.info.singularName}`
    : primaryValue || `Edit ${schema.info.singularName}`;

  return (
    <div style={{ width: '100%' }}>
      {/* Header and Breadcrumbs */}
      <div style={{ marginBottom: 24 }}>
        {/* Back icon + Breadcrumb row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Link to={`/documents/${apiId}`}>
            <Button
              type="text"
              size="large"
              icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
              style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}
            />
          </Link>
          <Breadcrumb
            items={[
              { title: <Link to="/">Home</Link> },
              { title: <Link to={`/documents/${apiId}`}>{schema.title}</Link> },
              { title: isNew ? 'Create New' : primaryValue || documentId },
            ]}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Space align="center" size={12}>
              <Title level={2} style={{ margin: 0 }}>
                {headerTitle}
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
              {isNew ? 'Fill in the fields to create a new record.' : 'Edit existing document record.'}
            </Paragraph>
          </div>
          <Space>
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
              disabled={isSaveDisabled}
              onClick={() => form.submit()}
            >
              {isNew ? 'Create' : 'Save Changes'}
            </Button>
            <DocumentHeaderActions
              apiId={apiId!}
              documentId={documentId}
              document={document}
              isNew={isNew}
              onDelete={handleDelete}
              deletePending={deleteMutation.isPending}
            />
          </Space>
        </div>
      </div>


      {errorMessage && (
        <Alert type="error" message={errorMessage} showIcon closable style={{ marginBottom: 20 }} />
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
          onValuesChange={(changedValues) => {
            // Update Zustand store with the changed values
            Object.entries(changedValues).forEach(([key, val]) => {
              if (
                typeof val === 'object' &&
                val !== null &&
                !Array.isArray(val) &&
                !dayjs.isDayjs(val)
              ) {
                // If it is a nested change, e.g. { name: { en: "hello" } }
                Object.entries(val).forEach(([subKey, subVal]) => {
                  setFieldValuePath([key, subKey], subVal);
                });
              } else {
                setFieldValue(key, val);
              }
            });
          }}
          scrollToFirstError
        >
          {/* Field attributes — 2-column grid */}
          <Row gutter={[24, 0]}>
            {sortedAttributes
              .filter((a) => !isRelationAttribute(a))
              .map((attr) => (
                <Col key={attr.id} xs={24} md={12}>
                  <DocumentFormField
                    attr={attr as FieldAttribute}
                    localizations={localizations}
                  />
                </Col>
              ))}
          </Row>

          {/* Relation attributes — 2-column grid */}
          {sortedAttributes.some((a) => isRelationAttribute(a)) && (
            <>
              <Divider
                titlePlacement="left"
                plain
                style={{ fontSize: 12, color: token.colorTextSecondary, margin: '24px 0 16px' }}
              >
                Relations
              </Divider>
              <Row gutter={[24, 0]}>
                {sortedAttributes
                  .filter((a) => isRelationAttribute(a))
                  .map((attr) => (
                    <Col key={attr.id} xs={24} md={12}>
                      <RelationField attr={attr as RelationAttribute} />
                    </Col>
                  ))}
              </Row>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default DocumentForm;
