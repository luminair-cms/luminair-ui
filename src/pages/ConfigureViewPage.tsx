import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import {
  useDetailedDocumentType,
  useUiConfig,
  useUpdateUiConfig,
  ContentTypeViewConfig,
  FieldViewConfig,
  RelationViewConfig,
  isRelationAttribute,
  RelationAttribute,
} from '@/features/schemas';
import { ScalarFieldConfigModal } from '@/features/schemas/components/ScalarFieldConfigModal';
import { RelationConfigModal } from '@/features/schemas/components/RelationConfigModal';

const { Title, Text, Paragraph } = Typography;

export const ConfigureViewPage: FC = () => {
  const { apiId } = useParams<{ apiId: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const { data: schema, isLoading: schemaLoading } = useDetailedDocumentType(apiId);
  const { data: uiConfig, isLoading: configLoading } = useUiConfig(apiId);
  const updateMutation = useUpdateUiConfig(apiId);

  const [localConfig, setLocalConfig] = useState<ContentTypeViewConfig | null>(null);

  // Edit modals state
  const [editingScalar, setEditingScalar] = useState<FieldViewConfig | null>(null);
  const [editingRelation, setEditingRelation] = useState<RelationViewConfig | null>(null);

  useEffect(() => {
    if (uiConfig) {
      setLocalConfig(uiConfig);
    }
  }, [uiConfig]);

  if (schemaLoading || configLoading || !localConfig) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" description="Loading View Configuration…" />
      </div>
    );
  }

  const scalarOptions = (schema?.attributes ?? [])
    .filter((a) => !isRelationAttribute(a))
    .map((a) => ({ label: a.id, value: a.id }));

  const handleSave = () => {
    if (!localConfig) return;
    updateMutation.mutate(localConfig, {
      onSuccess: () => {
        message.success('View configuration saved successfully!');
      },
      onError: (err) => {
        message.error(`Failed to save configuration: ${err.message}`);
      },
    });
  };

  const handleUpdateScalar = (updated: FieldViewConfig) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      const edit = prev.layouts.edit.map((f) =>
        f.attributeId === updated.attributeId ? updated : f,
      );
      return { ...prev, layouts: { ...prev.layouts, edit } };
    });
    setEditingScalar(null);
  };

  const handleUpdateRelation = (updated: RelationViewConfig) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      const relations = prev.layouts.relations.map((r) =>
        r.attributeId === updated.attributeId ? updated : r,
      );
      return { ...prev, layouts: { ...prev.layouts, relations } };
    });
    setEditingRelation(null);
  };

  // Find target schema for relation modal
  const editingRelAttr = (schema?.attributes ?? []).find(
    (a) => isRelationAttribute(a) && a.id === editingRelation?.attributeId,
  ) as RelationAttribute | undefined;

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Navigation & Header */}
      <div style={{ marginBottom: 24 }}>
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
              { title: <Link to={`/documents/${apiId}`}>{schema?.title ?? apiId}</Link> },
              { title: 'Configure the View' },
            ]}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Configure the view — {schema?.title ?? apiId}
            </Title>
            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
              Customize how fields and relations will be presented in the document editor.
            </Paragraph>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={updateMutation.isPending}
              onClick={handleSave}
            >
              Save View Config
            </Button>
          </Space>
        </div>
      </div>

      {/* Settings Section */}
      <Card title="Settings" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Entry title
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Select the main field used for primary title rendering in pickers and lists.
              </Text>
              <Select
                style={{ width: '100%' }}
                value={localConfig.settings.mainField}
                options={scalarOptions}
                onChange={(val) =>
                  setLocalConfig((prev) =>
                    prev ? { ...prev, settings: { ...prev, mainField: val } } : prev,
                  )
                }
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* View Layout Section */}
      <Card title="View Layout">
        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          Displayed Fields
        </Title>
        <Row gutter={[16, 16]}>
          {localConfig.layouts.edit.map((field) => (
            <Col key={field.attributeId} xs={24} md={field.size === 100 ? 24 : 12}>
              <Card
                size="small"
                style={{
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                }}
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingScalar(field)}
                  />
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>{field.label || field.attributeId}</Text>
                    {field.description && (
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                        {field.description}
                      </Text>
                    )}
                  </div>
                  <Tag color="default">{field.size}%</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {localConfig.layouts.relations.length > 0 && (
          <>
            <Divider titlePlacement="left" plain style={{ margin: '32px 0 16px' }}>
              Relations Layout
            </Divider>
            <Row gutter={[16, 16]}>
              {localConfig.layouts.relations.map((rel) => (
                <Col key={rel.attributeId} xs={24} md={12}>
                  <Card
                    size="small"
                    style={{
                      background: token.colorBgContainer,
                      borderColor: token.colorBorderSecondary,
                    }}
                    extra={
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEditingRelation(rel)}
                      />
                    }
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong>{rel.attributeId}</Text>
                        <Tag color={rel.displayMode === 'block' ? 'blue' : 'cyan'}>
                          {rel.displayMode}
                        </Tag>
                      </div>
                      <Space size={4} wrap>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Display fields:
                        </Text>
                        {rel.displayFields.map((f, idx) => (
                          <Tag key={f} color={idx === 0 ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>
                            {idx === 0 ? `Primary: ${f}` : f}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* Edit Modals */}
      <ScalarFieldConfigModal
        open={Boolean(editingScalar)}
        config={editingScalar}
        onCancel={() => setEditingScalar(null)}
        onSave={handleUpdateScalar}
      />

      <RelationConfigModal
        open={Boolean(editingRelation)}
        config={editingRelation}
        targetSchema={useDetailedDocumentType(editingRelAttr?.target).data}
        onCancel={() => setEditingRelation(null)}
        onSave={handleUpdateRelation}
      />
    </div>
  );
};
