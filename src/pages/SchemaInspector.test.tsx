import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { SchemaInspector } from './SchemaInspector';
import { renderWithProviders } from '@/__test_utils__/renderWithProviders';
import { fallbackDocumentTypes, fallbackDetailedDocumentTypes } from '@/__test_utils__/fixtures';

// Mock the API client to return meta fixtures
vi.mock('@/api/client', () => ({
  apiQuery: vi.fn((path: string) => {
    if (path === '/api/meta/documents') {
      return Promise.resolve(fallbackDocumentTypes);
    }
    const detailedMatch = path.match(/^\/api\/meta\/documents\/([^/]+)$/);
    if (detailedMatch) {
      return Promise.resolve(fallbackDetailedDocumentTypes[detailedMatch[1]] ?? null);
    }
    return Promise.resolve(null);
  }),
  apiMutate: vi.fn(),
}));

describe('SchemaInspector Page', () => {
  it('renders loading spin initially', () => {
    renderWithProviders(
      <Routes>
        <Route path="/schemas" element={<SchemaInspector />} />
      </Routes>,
      { initialEntries: ['/schemas'] },
    );

    expect(screen.getByText(/loading schemas list/i)).toBeInTheDocument();
  });

  it('renders the list of schemas when loading finishes', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/schemas" element={<SchemaInspector />} />
      </Routes>,
      { initialEntries: ['/schemas'] },
    );

    // Wait for the schema list to load
    await waitFor(() => {
      expect(screen.queryByText(/loading schemas list/i)).not.toBeInTheDocument();
    });

    // Wait for nested schema cards loading states to resolve
    await waitFor(() => {
      expect(screen.queryByText(/loading schema details/i)).not.toBeInTheDocument();
    });

    // Check headings
    expect(screen.getByRole('heading', { name: /schema inspector/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Brands/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Partners/i).length).toBeGreaterThan(0);
  });

  it('renders detailed card only for specific apiId when provided in route params', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/schemas/:apiId" element={<SchemaInspector />} />
      </Routes>,
      { initialEntries: ['/schemas/brands'] },
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading schemas list/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText(/loading schema details/i)).not.toBeInTheDocument();
    });

    // Should show Brands Schema title
    expect(screen.getByRole('heading', { name: /brands schema/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /partners schema/i })).not.toBeInTheDocument();

    // Check attributes of Brands are visible in the cards table
    expect(screen.getAllByText('uid').length).toBeGreaterThan(0);
  });
});
export default SchemaInspector;
