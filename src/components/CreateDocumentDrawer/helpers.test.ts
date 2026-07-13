import { describe, it, expect } from 'vitest';
import { toLabel, getTypeName, documentToFormValues } from './helpers';
import { Attribute, DocumentRecord } from '@/api/types';

describe('CreateDocumentDrawer helpers', () => {
  describe('toLabel', () => {
    it('converts snake_case/kebab-case to Title Case', () => {
      expect(toLabel('first_name')).toBe('First Name');
      expect(toLabel('last-name')).toBe('Last Name');
      expect(toLabel('document_id')).toBe('Document Id');
    });
  });

  describe('getTypeName', () => {
    it('handles string type names', () => {
      expect(getTypeName('text')).toBe('text');
      expect(getTypeName('integer')).toBe('integer');
    });

    it('handles tagged-union type names', () => {
      expect(getTypeName({ integer: 'int32' })).toBe('integer');
    });
  });

  describe('documentToFormValues', () => {
    it('correctly maps document fields based on attributes', () => {
      const mockAttributes: Attribute[] = [
        { id: 'name', type: 'text', unique: false, required: true, constraints: [] },
        { id: 'age', type: { integer: 'int32' }, unique: false, required: false, constraints: [] },
        { id: 'json_field', type: 'json', unique: false, required: false, constraints: [] },
      ];

      const mockRecord: DocumentRecord = {
        id: 1,
        documentId: 'doc-123',
        status: 'draft',
        createdAt: '2026-07-13T12:00:00Z',
        updatedAt: '2026-07-13T12:00:00Z',
        publishedAt: null,
        name: 'John Doe',
        age: 30,
        json_field: { key: 'value' },
      };

      const result = documentToFormValues(mockRecord, mockAttributes);

      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(30);
      expect(result.json_field).toContain('"key": "value"');
    });
  });
});
