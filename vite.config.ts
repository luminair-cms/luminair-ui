/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // antd-vendor is ~706 kB minified — this is expected for Ant Design's component
    // library and is a stable, cache-isolated vendor chunk, not actionable bloat.
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React runtime — extremely stable, cache forever
            { name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler)/, priority: 40 },
            // Icons are large and change infrequently — keep them isolated
            { name: 'antd-icons', test: /node_modules[\\/]@ant-design[\\/]icons/, priority: 35 },
            // Ant Design core + RC component internals
            { name: 'antd-vendor', test: /node_modules[\\/](?:antd|rc-)/, priority: 30 },
            // TanStack Query + React Router shared primitives
            { name: 'query-router', test: /node_modules[\\/](?:@tanstack|react-router)/, priority: 20 },
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
