import { describe, it, expect } from 'vitest';
import {
  toLabel,
  getTypeName,
  getTypeParams,
  constraintToRule,
  coerceValue,
  documentToFormValues,
  renderLocalizedCell,
  sortAttributesByDefaultOrder,
  getPrimaryAttribute,
  getPrimaryFieldValue,
  getDocumentLabel,
} from './helpers';
import { Attribute } from '@/features/schemas';
import { DocumentRecord } from './types';
// @ts-ignore
import dayjs from 'dayjs';

describe('content helpers', () => {
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

  describe('getTypeParams', () => {
    it('returns null for simple string types', () => {
      expect(getTypeParams('text')).toBeNull();
    });

    it('returns parameters object for parameterized types', () => {
      const type = { decimal: { precision: 10, scale: 2 } };
      expect(getTypeParams(type)).toEqual({ precision: 10, scale: 2 });
    });
  });

  describe('constraintToRule', () => {
    interface MockRule {
      min?: number;
      max?: number;
      message?: string;
      pattern?: RegExp;
      validator?: (rule: unknown, value: unknown) => Promise<void>;
    }

    it('maps minimalLength and maximalLength correctly', () => {
      expect(constraintToRule({ minimalLength: 5 })).toEqual({
        min: 5,
        message: 'Minimum 5 characters required',
      });
      expect(constraintToRule({ maximalLength: 10 })).toEqual({
        max: 10,
        message: 'Maximum 10 characters allowed',
      });
    });

    it('maps minimalIntegerValue validator constraint', async () => {
      const rule = constraintToRule({ minimalIntegerValue: 10 }) as MockRule;
      expect(rule.validator).toBeDefined();
      if (rule.validator) {
        await expect(rule.validator({}, undefined)).resolves.toBeUndefined();
        await expect(rule.validator({}, 12)).resolves.toBeUndefined();
        await expect(rule.validator({}, 8)).rejects.toThrow('Minimum value is 10');
      }
    });

    it('maps maximalIntegerValue validator constraint', async () => {
      const rule = constraintToRule({ maximalIntegerValue: 20 }) as MockRule;
      expect(rule.validator).toBeDefined();
      if (rule.validator) {
        await expect(rule.validator({}, '')).resolves.toBeUndefined();
        await expect(rule.validator({}, 15)).resolves.toBeUndefined();
        await expect(rule.validator({}, 25)).rejects.toThrow('Maximum value is 20');
      }
    });

    it('maps pattern regex constraint', () => {
      const rule = constraintToRule({ pattern: '^[A-Z]+$' }) as MockRule;
      expect(rule.pattern).toEqual(/^[A-Z]+$/);
      expect(rule.message).toBe('Must match pattern: ^[A-Z]+$');
    });
  });

  describe('coerceValue', () => {
    it('returns integers and decimals as-is (handled by inputs)', () => {
      expect(coerceValue('integer', '42')).toBe('42');
      expect(coerceValue('decimal', '42.42')).toBe('42.42');
    });

    it('returns booleans as-is', () => {
      expect(coerceValue('boolean', 'true')).toBe('true');
    });

    it('coerces date and dateTime types', () => {
      const dateObj = dayjs('2026-07-15T12:00:00Z');
      expect(coerceValue('date', dateObj)).toBe('2026-07-15');
      expect(coerceValue('dateTime', dateObj)).toBe('2026-07-15T12:00:00.000Z');
    });

    it('coerces json strings', () => {
      expect(coerceValue('json', '{"a":1}')).toEqual({ a: 1 });
      expect(coerceValue('json', 'invalid-json')).toBe('invalid-json');
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

  describe('renderLocalizedCell', () => {
    it('returns dash for empty values', () => {
      const res = renderLocalizedCell(null);
      expect(res).toBeDefined();
    });

    it('renders object with locales as localized tags', () => {
      const localized = { en: 'Hello', ru: 'Привет' };
      const res = renderLocalizedCell(localized);
      expect(res).toBeDefined();
    });
  });

  describe('sortAttributesByDefaultOrder', () => {
    it('places Uid type attribute first and name attribute second', () => {
      const attributes: Attribute[] = [
        { id: 'age', type: 'integer', unique: false, required: false },
        { id: 'name', type: 'text', unique: false, required: true },
        { id: 'slug', type: 'uid', unique: true, required: true },
      ];
      const sorted = sortAttributesByDefaultOrder(attributes);
      expect(sorted.map((a) => a.id)).toEqual(['slug', 'name', 'age']);
    });

    it('uses first unique attribute if neither Uid type nor name field exists', () => {
      const attributes: Attribute[] = [
        { id: 'age', type: 'integer', unique: false, required: false },
        { id: 'email', type: 'text', unique: true, required: true },
        { id: 'title', type: 'text', unique: false, required: false },
      ];
      const sorted = sortAttributesByDefaultOrder(attributes);
      expect(sorted.map((a) => a.id)).toEqual(['email', 'age', 'title']);
    });

    it('places Uid type first even if unique attribute exists when name is absent', () => {
      const attributes: Attribute[] = [
        { id: 'email', type: 'text', unique: true, required: true },
        { id: 'code', type: 'uid', unique: false, required: true },
      ];
      const sorted = sortAttributesByDefaultOrder(attributes);
      expect(sorted.map((a) => a.id)).toEqual(['code', 'email']);
    });
  });

  describe('primary field helpers and getDocumentLabel', () => {
    it('extracts primary field value based on schema attributes', () => {
      const attributes: Attribute[] = [
        { id: 'age', type: 'integer', unique: false, required: false },
        { id: 'full_name', type: 'text', unique: true, required: true },
      ];
      const doc: DocumentRecord = {
        id: 1,
        documentId: 'doc-999',
        status: 'published',
        createdAt: '',
        updatedAt: '',
        publishedAt: '',
        age: 25,
        full_name: 'John Smith',
      };
      expect(getPrimaryFieldValue(doc, attributes)).toBe('John Smith');
    });

    it('handles localized object primary fields', () => {
      const attributes: Attribute[] = [
        { id: 'title', type: 'localizedText', unique: false, required: true },
      ];
      const doc: DocumentRecord = {
        id: 1,
        documentId: 'doc-888',
        status: 'published',
        createdAt: '',
        updatedAt: '',
        publishedAt: '',
        title: { en: 'English Title', ru: 'Заголовок' },
      };
      expect(getPrimaryFieldValue(doc, attributes)).toBe('English Title');
    });

    it('formats document label with primary field and short document ID', () => {
      const attributes: Attribute[] = [
        { id: 'slug', type: 'uid', unique: true, required: true },
      ];
      const doc: DocumentRecord = {
        id: 1,
        documentId: 'abc-123456789',
        status: 'draft',
        createdAt: '',
        updatedAt: '',
        publishedAt: null,
        slug: 'my-first-post',
      };
      expect(getDocumentLabel(doc, attributes)).toBe('my-first-post (abc-1234…)');
    });
  });
});
