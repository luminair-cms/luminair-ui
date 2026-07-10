import { ThemeConfig, theme } from 'antd';

export const themeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
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
      colorBgHeader: '#0f172a',
      colorBgBody: '#0f172a',
      colorBgTrigger: '#1e293b',
    },
    Menu: {
      colorItemBgSelected: '#2e3b5e',
      colorItemTextSelected: '#a5b4fc',
    },
  },
};
