import { useState, FC } from 'react';
import { Layout, Menu, Button, theme, Space } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DatabaseOutlined />,
      label: <Link to="/">Content Manager</Link>,
    },
    {
      key: '/schemas',
      icon: <AppstoreOutlined />,
      label: <Link to="/schemas">Schema Inspector</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" style={{ background: '#1e293b' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '0 8px' }}>
          <Space>
            <img
              src="https://avatars.githubusercontent.com/u/215728507?s=64&v=4"
              alt="Luminair CMS Logo"
              style={{ width: 32, height: 32, borderRadius: 6, display: 'block' }}
            />
            {!collapsed && <span style={{ fontWeight: 'bold', fontSize: 16, color: '#f8fafc' }}>Luminair</span>}
          </Space>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: '#1e293b' }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space size="large">
            <span style={{ color: '#64748b' }}>v0.1.0</span>
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
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
