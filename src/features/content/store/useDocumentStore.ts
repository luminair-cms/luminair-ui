import { create } from 'zustand';
import { DetailedDocumentResponse } from '@/features/schemas';
import { DocumentRecord } from '../types';
import { documentToFormValues } from '../helpers';

// Helper function to perform deep comparison between form values (scalar, objects, arrays)
const isEquivalent = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    const valA = a[key];
    const valB = b[key];
    if (typeof valA === 'object' && typeof valB === 'object') {
      if (!isEquivalent(valA, valB)) return false;
    } else if (String(valA) !== String(valB)) {
      // Coerce comparison for dates/numbers/uuids to strings
      return false;
    }
  }
  return true;
};

// Helper function to set nested values (e.g. ['name', 'en']) without mutating state directly
const setNestedValue = (obj: any, path: string[], value: any): any => {
  if (path.length === 0) return value;
  const [current, ...rest] = path;
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  newObj[current] = setNestedValue(newObj[current], rest, value);
  return newObj;
};

interface DocumentState {
  schema: DetailedDocumentResponse | null;
  values: Record<string, any>;
  initialValues: Record<string, any>;
  isDirty: boolean;

  // Actions
  initStore: (
    schema: DetailedDocumentResponse,
    record: DocumentRecord | null,
    isNew: boolean,
  ) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldValuePath: (path: string[], value: any) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  schema: null,
  values: {},
  initialValues: {},
  isDirty: false,

  initStore: (schema, record, isNew) => {
    if (isNew) {
      set({
        schema,
        values: {},
        initialValues: {},
        isDirty: false,
      });
      return;
    }

    if (!record) return;

    const initialValues = documentToFormValues(record, schema.attributes);
    // Deep clone values so they are completely decoupled from initialValues
    const values = JSON.parse(JSON.stringify(initialValues));

    set({
      schema,
      values,
      initialValues,
      isDirty: false,
    });
  },

  setFieldValue: (fieldId, value) => {
    set((state) => {
      const nextValues = {
        ...state.values,
        [fieldId]: value,
      };
      const isDirty = !isEquivalent(nextValues, state.initialValues);
      return { values: nextValues, isDirty };
    });
  },

  setFieldValuePath: (path, value) => {
    set((state) => {
      const nextValues = setNestedValue(state.values, path, value);
      const isDirty = !isEquivalent(nextValues, state.initialValues);
      return { values: nextValues, isDirty };
    });
  },

  reset: () => {
    set({
      schema: null,
      values: {},
      initialValues: {},
      isDirty: false,
    });
  },
}));
