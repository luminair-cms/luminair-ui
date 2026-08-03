import { FC, useEffect } from 'react';
import { Modal, Form, Radio, Select, Tag, Alert } from 'antd';
import { RelationAppearance, FieldAttribute, DetailedDocumentResponse } from '../types';

export interface RelationAppearanceModalProps {
  open: boolean;
  /** Current appearance config for this document type. */
  appearance: RelationAppearance | null;
  /** The schema of this (owning) document type — used to populate displayFields options. */
  ownSchema?: DetailedDocumentResponse | null;
  /** The mainField of this document type, shown in the Inline mode hint. */
  mainField?: string;
  onCancel: () => void;
  onSave: (updated: RelationAppearance) => void;
}

export const RelationAppearanceModal: FC<RelationAppearanceModalProps> = ({
  open,
  appearance,
  ownSchema,
  mainField,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (appearance) {
      form.setFieldsValue({
        displayMode: appearance.displayMode,
        displayFields:
          appearance.displayMode === 'block' ? appearance.displayFields : [],
      });
    }
  }, [appearance, form]);

  const handleFinish = (values: { displayMode: 'inline' | 'block'; displayFields?: string[] }) => {
    if (values.displayMode === 'inline') {
      onSave({ displayMode: 'inline' });
    } else {
      const fields = (values.displayFields ?? []).slice(0, 3);
      onSave({
        displayMode: 'block',
        displayFields: fields.length > 0 ? (fields as [string, ...string[]]) : [mainField ?? 'name'],
      });
    }
  };

  // Only scalar (non-relation) fields can be used as display fields
  const scalarFieldOptions = (ownSchema?.attributes ?? [])
    .filter((attr): attr is FieldAttribute => !('relation' in attr))
    .map((attr) => ({ label: attr.id, value: attr.id }));

  const displayMode: 'inline' | 'block' = Form.useWatch('displayMode', form) ?? appearance?.displayMode ?? 'inline';

  return (
    <Modal
      open={open}
      title="Configure Relation Appearance"
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Save"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="displayMode"
          label="Display Mode"
          help="How this document type appears when shown in a relation field on another type's edit form."
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="inline">Inline (Tag / Select)</Radio.Button>
            <Radio.Button value="block">Block (Vertical List)</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {displayMode === 'inline' ? (
          <Alert
            type="info"
            showIcon
            message={
              mainField
                ? `Inline mode will display the "${mainField}" field (your current Entry Title).`
                : 'Inline mode displays the Entry Title field. No further configuration needed.'
            }
            style={{ marginBottom: 0 }}
          />
        ) : (
          <Form.Item
            name="displayFields"
            label="Display Fields (up to 3)"
            help="First field is the primary card title; up to 2 additional fields render as preview sub-badges."
          >
            <Select
              mode="multiple"
              placeholder="Select display fields…"
              options={scalarFieldOptions}
              maxCount={3}
              tagRender={({ label, onClose }) => (
                <Tag closable onClose={onClose} color="blue" style={{ marginRight: 3 }}>
                  {label}
                </Tag>
              )}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

