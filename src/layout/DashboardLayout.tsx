import { useState, FC } from 'react';
import { Layout, Menu, Button, theme, Space, Spin } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  SettingOutlined,
  AppstoreOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/store';
import { useDocumentTypes } from '@/features/schemas';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { themeMode, toggleThemeMode } = useUIStore();
  const { data: documentTypes, isLoading } = useDocumentTypes();
  const {
    token: {
      colorBgContainer,
      borderRadiusLG,
      colorBgLayout,
      colorText,
      colorWarning,
      colorTextSecondary,
    },
  } = theme.useToken();

  // Dynamic Sidebar Menu Items
  const menuItems = [
    {
      key: 'content-manager',
      icon: <DatabaseOutlined />,
      label: 'Content Manager',
      children: documentTypes
        ? documentTypes.map((type) => ({
            key: `/documents/${type.id}`,
            label: <Link to={`/documents/${type.id}`}>{type.title}</Link>,
          }))
        : [],
    },
    {
      key: 'schema-inspector',
      icon: <AppstoreOutlined />,
      label: 'Schema Inspector',
      children: documentTypes
        ? documentTypes.map((type) => ({
            key: `/schemas/${type.id}`,
            label: <Link to={`/schemas/${type.id}`}>{type.title}</Link>,
          }))
        : [],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={themeMode}
        style={{ background: colorBgContainer }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colorBgLayout,
            padding: '0 8px',
            transition: 'background 0.2s',
          }}
        >
          <Space>
            <img
              src="https://avatars.githubusercontent.com/u/215728507?s=64&v=4"
              alt="Luminair CMS Logo"
              style={{ width: 32, height: 32, borderRadius: 6, display: 'block' }}
            />
            {!collapsed && (
              <span style={{ fontWeight: 'bold', fontSize: 16, color: colorText }}>
                Luminair
              </span>
            )}
          </Space>
        </div>

        {isLoading && !documentTypes ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spin size="small" />
          </div>
        ) : (
          <Menu
            theme={themeMode}
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['content-manager', 'schema-inspector']}
            items={menuItems}
            style={{ background: colorBgContainer, borderRight: 0 }}
          />
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            transition: 'background 0.2s',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space size="large">
            <Button
              type="text"
              icon={themeMode === 'dark' ? <SunOutlined style={{ color: colorWarning }} /> : <MoonOutlined />}
              onClick={toggleThemeMode}
              style={{ fontSize: 16 }}
            />
            <span style={{ color: colorTextSecondary }}>v0.1.0</span>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
            transition: 'background 0.2s',
          }}
        >
          <ErrorBoundary type="content">
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
};
export default DashboardLayout;
