import { FC, useEffect } from 'react';
import { Modal, Form, Input, Switch, Segmented } from 'antd';
import { FieldViewConfig } from '../types';

export interface ScalarFieldConfigModalProps {
  open: boolean;
  config: FieldViewConfig | null;
  onCancel: () => void;
  onSave: (updated: FieldViewConfig) => void;
}

export const ScalarFieldConfigModal: FC<ScalarFieldConfigModalProps> = ({
  open,
  config,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        label: config.label ?? '',
        description: config.description ?? '',
        placeholder: config.placeholder ?? '',
        editable: config.editable ?? true,
        size: config.size ?? 50,
      });
    }
  }, [config, form]);

  const handleFinish = (values: Record<string, unknown>) => {
    if (!config) return;
    onSave({
      ...config,
      label: (values.label as string)?.trim() || undefined,
      description: (values.description as string)?.trim() || undefined,
      placeholder: (values.placeholder as string)?.trim() || undefined,
      editable: values.editable as boolean,
      size: values.size as 50 | 100,
    });
  };

  return (
    <Modal
      open={open}
      title={`Configure Field — ${config?.attributeId ?? ''}`}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Finish"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item name="label" label="Label" help="Custom label displayed above the field">
          <Input placeholder={config?.attributeId} />
        </Form.Item>

        <Form.Item name="description" label="Description" help="Helper text displayed below the field">
          <Input placeholder="Add a description for content editors..." />
        </Form.Item>

        <Form.Item name="placeholder" label="Placeholder">
          <Input placeholder="Input placeholder text..." />
        </Form.Item>

        <Form.Item name="editable" label="Editable field" valuePropName="checked">
          <Switch checkedChildren="TRUE" unCheckedChildren="FALSE" />
        </Form.Item>

        <Form.Item name="size" label="Size">
          <Segmented
            options={[
              { label: '50%', value: 50 },
              { label: '100%', value: 100 },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
