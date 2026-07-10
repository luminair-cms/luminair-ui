import { FC, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getThemeConfig } from '@/themeConfig';
import { DashboardLayout } from '@/DashboardLayout';
import { useUIStore } from '@/store';
import { ContentManagerHome, DocumentListView, SchemaInspector, Settings } from '@/pages';

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: '',
        element: <ContentManagerHome />,
      },
      {
        path: 'documents/:apiId',
        element: <DocumentListView />,
      },
      {
        path: 'schemas',
        element: <SchemaInspector />,
      },
      {
        path: 'schemas/:apiId',
        element: <SchemaInspector />,
      },
      {
        path: 'settings',
        element: <Settings />,
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
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  );
};
