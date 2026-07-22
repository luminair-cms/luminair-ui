import { vi } from 'vitest';
import {
  fallbackDocumentTypes,
  fallbackDetailedDocumentTypes,
  fallbackDocuments,
} from './fixtures';

/**
 * Reference implementation of the canonical `@/api/client` mock routing logic.
 *
 * > **⚠️ VITEST HOISTING CONSTRAINT**
 * > `vi.mock(...)` calls are **hoisted to the top of the file** by vitest's
 * > transform step. This means `vi.mock` **cannot be called inside a function
 * > body at runtime** — the factory runs before any imports are evaluated.
 * > Wrapping `vi.mock` in `mockApiClient()` and calling it in a test file
 * > will NOT work; the mock will be silently ignored and real network calls
 * > (or errors) will occur instead.
 * >
 * > **How to use**: Copy the `vi.mock('@/api/client', () => ({ ... }))` block
 * > from this file to the **top level** of each test file that needs it.
 * > This file serves as the single source of truth for the routing logic so
 * > that updates only need to happen here.
 * >
 * > **Future migration**: When MSW (Mock Service Worker) is adopted (Option B),
 * > this file will be replaced by MSW request handlers, which work correctly
 * > in both module scope and `beforeEach` blocks.
 *
 * Path routing for `apiQuery`:
 * - `/api/meta/documents`               → `fallbackDocumentTypes`
 * - `/api/meta/documents/:id`           → `fallbackDetailedDocumentTypes[id]`
 * - `/api/documents/:apiId`             → `fallbackDocuments[apiId]`
 * - `/api/documents/:apiId/:documentId` → matching record from `fallbackDocuments[apiId]`
 *
 * `apiMutate` is stubbed as a no-op `vi.fn()` — individual tests can override
 * it with `vi.mocked(apiMutate).mockResolvedValueOnce(...)` as needed.
 */

/**
 * Sets up a vitest module mock for `@/api/client` that routes `apiQuery` calls
 * to fixture data based on path pattern, without making any real network requests.
 *
 * Call this at the top level of a test file (outside `describe`/`it`), as `vi.mock`
 * is hoisted to the top of the file by vitest's transform step.
 *
 * Path routing:
 * - `/api/meta/documents`              → fallbackDocumentTypes
 * - `/api/meta/documents/:id`          → fallbackDetailedDocumentTypes[id]
 * - `/api/documents/:apiId`            → fallbackDocuments[apiId]
 * - `/api/documents/:apiId/:documentId`→ matching record from fallbackDocuments[apiId]
 *
 * `apiMutate` is stubbed as a no-op `vi.fn()` — individual tests can override it
 * with `vi.mocked(apiMutate).mockResolvedValueOnce(...)` as needed.
 */
export function mockApiClient() {
  vi.mock('@/api/client', () => ({
    apiQuery: vi.fn((path: string) => {
      if (path === '/api/meta/documents') {
        return Promise.resolve(fallbackDocumentTypes);
      }
      const detailedMatch = path.match(/^\/api\/meta\/documents\/([^/]+)$/);
      if (detailedMatch) {
        return Promise.resolve(fallbackDetailedDocumentTypes[detailedMatch[1]] ?? null);
      }
      // Match single-document path before list path (more specific first)
      const docMatch = path.match(/^\/api\/documents\/([^/]+)\/([^/?]+)/);
      if (docMatch) {
        const [, apiId, documentId] = docMatch;
        const docs = fallbackDocuments[apiId] ?? [];
        return Promise.resolve(docs.find((d) => d.documentId === documentId) ?? null);
      }
      const listMatch = path.match(/^\/api\/documents\/([^/?]+)(?:\?.*)?$/);
      if (listMatch) {
        return Promise.resolve(fallbackDocuments[listMatch[1]] ?? []);
      }
      return Promise.resolve(null);
    }),
    apiMutate: vi.fn((path: string, method: string, payload?: any) => {
      const docMatch = path.match(/^\/api\/documents\/([^/]+)\/([^/?]+)$/);
      if (docMatch && method === 'PUT' && payload?.data) {
        const [, apiId, documentId] = docMatch;
        const docs = fallbackDocuments[apiId] ?? [];
        const doc = docs.find((d) => d.documentId === documentId);
        if (doc) {
          for (const [k, v] of Object.entries(payload.data)) {
            doc[k] = v;
            const camelKey = k.replace(/[-_]([a-z])/g, (_, l) => l.toUpperCase());
            doc[camelKey] = v;
          }
        }
        return Promise.resolve({ data: doc ?? payload.data, headers: new Headers() });
      }
      return Promise.resolve({ data: null, headers: new Headers() });
    }),
  }));
}
