import { FC, useEffect } from 'react';
import { Modal, Form, Radio, Select, Tag } from 'antd';
import { RelationViewConfig, DetailedDocumentResponse } from '../types';

export interface RelationConfigModalProps {
  open: boolean;
  config: RelationViewConfig | null;
  targetSchema?: DetailedDocumentResponse | null;
  onCancel: () => void;
  onSave: (updated: RelationViewConfig) => void;
}

export const RelationConfigModal: FC<RelationConfigModalProps> = ({
  open,
  config,
  targetSchema,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        displayMode: config.displayMode ?? 'inline',
        displayFields: config.displayFields ?? ['name'],
      });
    }
  }, [config, form]);

  const handleFinish = (values: Record<string, unknown>) => {
    if (!config) return;
    const fields = (values.displayFields as string[]) || ['name'];
    onSave({
      ...config,
      displayMode: values.displayMode as 'inline' | 'block',
      displayFields: fields.length > 0 ? fields.slice(0, 4) : ['name'],
    });
  };

  const fieldOptions = (targetSchema?.attributes ?? []).map((attr) => ({
    label: attr.id,
    value: attr.id,
  }));

  return (
    <Modal
      open={open}
      title={`Configure Relation — ${config?.attributeId ?? ''}`}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Finish"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="displayMode"
          label="Display Mode"
          help="Choose between compact Tag/Select input or full Strapi-style Vertical List"
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="inline">Inline (Tag / Select)</Radio.Button>
            <Radio.Button value="block">Block (Vertical List)</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="displayFields"
          label="Display Fields"
          help="First field is used as primary card title; up to 3 additional fields render as preview sub-badges."
        >
          <Select
            mode="multiple"
            placeholder="Select display fields..."
            options={fieldOptions}
            maxCount={4}
            tagRender={({ label, onClose }) => (
              <Tag closable onClose={onClose} color="blue" style={{ marginRight: 3 }}>
                {label}
              </Tag>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
