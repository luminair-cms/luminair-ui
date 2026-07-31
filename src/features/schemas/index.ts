// Public API barrel of the schemas module

export { SchemaCard } from './components/SchemaCard';
export { AttributeTypeTag } from './components/AttributeTypeTag';
export { ConstraintTags } from './components/ConstraintTags';
export { SchemaOverview } from './components/SchemaOverview';
export { SchemaList } from './components/SchemaList';

export { useDocumentTypes, useDetailedDocumentType } from './hooks/useSchemas';
export { useUiConfig, useUpdateUiConfig } from './hooks/useUiConfig';
export { uiConfigApi } from './services/uiConfigApi';
export * from './types';
