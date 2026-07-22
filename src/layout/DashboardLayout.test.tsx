import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { renderWithProviders } from '@/__test_utils__/renderWithProviders';
import { fallbackDocumentTypes } from '@/__test_utils__/fixtures';

vi.mock('@/api/client', () => ({
  apiQuery: vi.fn((path: string) => {
    if (path === '/api/meta/documents') {
      return Promise.resolve(fallbackDocumentTypes);
    }
    return Promise.resolve(null);
  }),
  apiMutate: vi.fn(),
}));

const renderView = (url: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>,
    { initialEntries: [url] },
  );

describe('DashboardLayout Navigation', () => {
  it('renders primary icon rail and secondary sub-panel with document types', async () => {
    renderView('/documents/brands');

    // Wait for document types to load and render in sub-panel
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
      expect(screen.getByText('COLLECTION TYPES')).toBeInTheDocument();
      expect(screen.getByText('Brands')).toBeInTheDocument();
      expect(screen.getByText('Partners')).toBeInTheDocument();
    });
  });

  it('renders schema inspector sub-panel when navigating to schemas', async () => {
    renderView('/schemas');

    await waitFor(() => {
      expect(screen.getByText('Schema Inspector')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Search schemas')).toBeInTheDocument();
  });
});
