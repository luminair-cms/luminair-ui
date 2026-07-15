import { FC, PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';

/**
 * Creates a fresh QueryClient suitable for use in tests.
 * Retries are disabled so errors surface immediately rather than after
 * the default 3-retry backoff that would slow tests down.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface TestProvidersProps extends PropsWithChildren {
  /** Initial router entries — defaults to `['/']`. */
  initialEntries?: MemoryRouterProps['initialEntries'];
}

/**
 * Wraps children with the full provider stack used across all tests:
 * - `QueryClientProvider` with a fresh, no-retry QueryClient
 * - Ant Design `ConfigProvider` (required for components that read the theme)
 * - `MemoryRouter` for router context
 */
export const TestProviders: FC<TestProvidersProps> = ({ children, initialEntries = ['/'] }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

/**
 * Thin wrapper around `@testing-library/react`'s `render` that injects
 * `TestProviders` as the wrapper, so each test renders into a full provider
 * context without boilerplate.
 *
 * @example
 * renderWithProviders(<MyComponent />, { initialEntries: ['/dashboard'] });
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialEntries,
    ...renderOptions
  }: { initialEntries?: MemoryRouterProps['initialEntries'] } & Omit<RenderOptions, 'wrapper'> = {},
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <TestProviders initialEntries={initialEntries}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
