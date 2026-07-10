import { ThemeConfig, theme } from 'antd';

export const getThemeConfig = (mode: 'light' | 'dark'): ThemeConfig => ({
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#6366f1', // Sleek Indigo
    colorSuccess: '#10b981', // Emerald
    colorWarning: '#f59e0b', // Amber
    colorError: '#ef4444', // Red
    colorInfo: '#3b82f6', // Blue
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  },
  components: {
    Layout: {
      colorBgHeader: mode === 'dark' ? '#0f172a' : '#ffffff',
      colorBgBody: mode === 'dark' ? '#0f172a' : '#f8fafc',
      colorBgTrigger: mode === 'dark' ? '#1e293b' : '#e2e8f0',
    },
    Menu: {
      colorItemBgSelected: mode === 'dark' ? '#2e3b5e' : '#e0e7ff',
      colorItemTextSelected: mode === 'dark' ? '#a5b4fc' : '#4f46e5',
      colorActiveBarBorderSize: 0,
    },
  },
});
