import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { DocumentEditView } from './DocumentEditView';
import { renderWithProviders } from '@/__test_utils__/renderWithProviders';
import {
  fallbackDocumentTypes,
  fallbackDetailedDocumentTypes,
  fallbackDocuments,
} from '@/__test_utils__/fixtures';

// vi.mock is hoisted to the top of the file by vitest's transform step,
// so it MUST appear at module scope — calling it inside a helper function
// (like mockApiClient() from __test_utils__/mockApi.ts) does not work.
// The mockApi.ts utility documents the canonical routing logic and serves
// as the reference for future MSW-based mocking (Step 1.4 Option B).
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
    const listMatch = path.match(/^\/api\/documents\/([^/]+)$/);
    if (listMatch) {
      return Promise.resolve(fallbackDocuments[listMatch[1]] ?? []);
    }
    return Promise.resolve(null);
  }),
  apiMutate: vi.fn(),
}));

// DocumentEditView requires route params (:apiId, :documentId), so we render
// it inside a Routes tree with the matching path pattern.
const renderView = (url: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/documents/:apiId/:documentId" element={<DocumentEditView />} />
    </Routes>,
    { initialEntries: [url] },
  );


describe('DocumentEditView Page', () => {
  it('renders loading spin initially', () => {
    renderView('/documents/brands/b1-uuid-1');
    expect(screen.getByText(/loading document details.../i)).toBeInTheDocument();
  });

  it('renders editing form populated with fallback mock data when loading completes', async () => {
    renderView('/documents/brands/b1-uuid-1');

    // Wait for the schema and record to load (using our test environment fallbacks)
    await waitFor(() => {
      expect(screen.queryByText(/loading document details.../i)).not.toBeInTheDocument();
    });

    // Verify correct page titles/subtexts
    expect(screen.getByRole('heading', { name: /edit brand/i })).toBeInTheDocument();
    expect(screen.getByText(/document id: b1-uuid-1/i)).toBeInTheDocument();

    // Verify fields rendered and populated
    expect(screen.getByLabelText(/uid/i)).toHaveValue('apple');
  });

  it('renders creation form in new mode', async () => {
    renderView('/documents/brands/new');

    await waitFor(() => {
      expect(screen.queryByText(/loading document details.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /create new brand/i })).toBeInTheDocument();
    expect(screen.getByText(/fill in the fields to create a new record./i)).toBeInTheDocument();

    // Fields should be blank
    expect(screen.getByLabelText(/uid/i)).toHaveValue('');
  });
});
