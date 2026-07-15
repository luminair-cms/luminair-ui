import { describe, it, expect } from 'vitest';
import {
  toLabel,
  getTypeName,
  getTypeParams,
  constraintToRule,
  coerceValue,
  documentToFormValues,
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
      expect(constraintToRule({ minimalLength: 5 })).toEqual({ min: 5, message: 'Minimum 5 characters required' });
      expect(constraintToRule({ maximalLength: 10 })).toEqual({ max: 10, message: 'Maximum 10 characters allowed' });
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
});
