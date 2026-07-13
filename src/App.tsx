import { FC, lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getThemeConfig } from '@/themeConfig';
import { DashboardLayout } from '@/DashboardLayout';
import { useUIStore } from '@/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Route-level lazy loading — each page is a separate async chunk
const ContentManagerHome = lazy(() => import('@/pages/ContentManagerHome'));
const DocumentListView = lazy(() => import('@/pages/DocumentListView'));
const SchemaInspector = lazy(() => import('@/pages/SchemaInspector'));
const Settings = lazy(() => import('@/pages/Settings'));
const DocumentEditView = lazy(() => import('@/pages/DocumentEditView'));

const routeFallback = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <Spin size="large" />
  </div>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: '',
        element: <Suspense fallback={routeFallback}><ContentManagerHome /></Suspense>,
      },
      {
        path: 'documents/:apiId',
        element: <Suspense fallback={routeFallback}><DocumentListView /></Suspense>,
      },
      {
        path: 'documents/:apiId/:documentId',
        element: <Suspense fallback={routeFallback}><DocumentEditView /></Suspense>,
      },
      {
        path: 'schemas',
        element: <Suspense fallback={routeFallback}><SchemaInspector /></Suspense>,
      },
      {
        path: 'schemas/:apiId',
        element: <Suspense fallback={routeFallback}><SchemaInspector /></Suspense>,
      },
      {
        path: 'settings',
        element: <Suspense fallback={routeFallback}><Settings /></Suspense>,
      },
    ],
  },
]);

// TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: FC = () => {
  const { themeMode } = useUIStore();

  useEffect(() => {
    document.body.className = themeMode;
  }, [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={getThemeConfig(themeMode)}>
        <ErrorBoundary type="global">
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ConfigProvider>
    </QueryClientProvider>
  );
};
