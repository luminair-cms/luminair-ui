import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentEditView } from './DocumentEditView';

// Helper wrapper to render components with routing and query context
const renderWithProviders = (initialEntries: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/documents/:apiId/:documentId" element={<DocumentEditView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DocumentEditView Page', () => {
  it('renders loading spin initially', () => {
    renderWithProviders(['/documents/brands/b1-uuid-1']);
    expect(screen.getByText(/loading document details.../i)).toBeInTheDocument();
  });

  it('renders editing form populated with fallback mock data when loading completes', async () => {
    renderWithProviders(['/documents/brands/b1-uuid-1']);

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
    renderWithProviders(['/documents/brands/new']);

    await waitFor(() => {
      expect(screen.queryByText(/loading document details.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /create new brand/i })).toBeInTheDocument();
    expect(screen.getByText(/fill in the fields to create a new record./i)).toBeInTheDocument();

    // Fields should be blank
    expect(screen.getByLabelText(/uid/i)).toHaveValue('');
  });
});
