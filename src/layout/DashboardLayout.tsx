import { useState, FC, useMemo } from 'react';
import { Layout, Input, Tooltip, Badge, Spin, theme, Typography } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  BuildOutlined,
  SettingOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/store';
import { useDocumentTypes } from '@/features/schemas';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { Content } = Layout;
const { Text } = Typography;

export const DashboardLayout: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeMode } = useUIStore();
  const { data: documentTypes, isLoading } = useDocumentTypes();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    token: {
      colorBgContainer,
      borderRadiusLG,
      colorBgLayout,
      colorText,
      colorTextSecondary,
      colorBorderSecondary,
      colorPrimary,
      colorPrimaryBg,
    },
  } = theme.useToken();

  // Determine active main module based on URL route
  const activeModule = useMemo(() => {
    if (location.pathname.startsWith('/schemas')) return 'schema-inspector';
    if (location.pathname.startsWith('/settings')) return 'settings';
    return 'content-manager';
  }, [location.pathname]);

  // Filter document types by search query
  const filteredTypes = useMemo(() => {
    if (!documentTypes) return [];
    if (!searchQuery.trim()) return documentTypes;
    const query = searchQuery.toLowerCase();
    return documentTypes.filter(
      (type) =>
        type.title.toLowerCase().includes(query) ||
        type.id.toLowerCase().includes(query),
    );
  }, [documentTypes, searchQuery]);

  const collectionTypes = useMemo(
    () => filteredTypes.filter((t) => t.type !== 'single'),
    [filteredTypes],
  );

  const singleTypes = useMemo(
    () => filteredTypes.filter((t) => t.type === 'single'),
    [filteredTypes],
  );

  const totalCollectionsCount = useMemo(
    () => (documentTypes ? documentTypes.filter((t) => t.type !== 'single').length : 0),
    [documentTypes],
  );

  const totalSinglesCount = useMemo(
    () => (documentTypes ? documentTypes.filter((t) => t.type === 'single').length : 0),
    [documentTypes],
  );

  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
      {/* 1. Primary Left Icon Rail (64px wide) */}
      <div
        style={{
          width: 64,
          minWidth: 64,
          background: colorBgContainer,
          borderRight: `1px solid ${colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 16,
          zIndex: 10,
        }}
      >
        {/* Top-left corner: Logo Icon ONLY */}
        <div
          style={{ marginBottom: 28, cursor: 'pointer' }}
          onClick={() => {
            const firstType = documentTypes?.[0]?.id;
            navigate(firstType ? `/documents/${firstType}` : '/');
          }}
        >
          <img
            src="https://avatars.githubusercontent.com/u/215728507?s=64&v=4"
            alt="Luminair CMS Logo"
            style={{ width: 36, height: 36, borderRadius: 8, display: 'block' }}
          />
        </div>

        {/* Main Navigation Modules - Icons only with Tooltip popups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center', flex: 1 }}>
          <Tooltip title="Content Management" placement="right">
            <button
              onClick={() => {
                const firstType = documentTypes?.[0]?.id;
                navigate(firstType ? `/documents/${firstType}` : '/');
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: activeModule === 'content-manager' ? colorPrimaryBg : 'transparent',
                color: activeModule === 'content-manager' ? colorPrimary : colorTextSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FileTextOutlined />
            </button>
          </Tooltip>

          <Tooltip title="Schema Inspection" placement="right">
            <button
              onClick={() => {
                const firstType = documentTypes?.[0]?.id;
                navigate(firstType ? `/schemas/${firstType}` : '/schemas');
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: activeModule === 'schema-inspector' ? colorPrimaryBg : 'transparent',
                color: activeModule === 'schema-inspector' ? colorPrimary : colorTextSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <BuildOutlined />
            </button>
          </Tooltip>
        </div>

        {/* Settings Module Icon Button */}
        <Tooltip title="Settings" placement="right">
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: activeModule === 'settings' ? colorPrimaryBg : 'transparent',
              color: activeModule === 'settings' ? colorPrimary : colorTextSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <SettingOutlined />
          </button>
        </Tooltip>
      </div>

      {/* 2. Secondary Sub-panel (Sub-sidebar next to Icon Rail) */}
      <div
        style={{
          width: 240,
          minWidth: 240,
          background: colorBgContainer,
          borderRight: `1px solid ${colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
          overflowY: 'auto',
        }}
      >
        {activeModule === 'content-manager' && (
          <>
            <Text strong style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>
              Content Manager
            </Text>

            <Input
              prefix={<SearchOutlined style={{ color: colorTextSecondary }} />}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ marginBottom: 20 }}
            />

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Spin size="small" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* COLLECTION TYPES Section */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                      padding: '0 4px',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: colorTextSecondary,
                        letterSpacing: '0.5px',
                      }}
                    >
                      COLLECTION TYPES
                    </Text>
                    <Badge
                      count={totalCollectionsCount}
                      style={{
                        backgroundColor: colorBgLayout,
                        color: colorTextSecondary,
                        fontSize: 11,
                        boxShadow: 'none',
                        border: `1px solid ${colorBorderSecondary}`,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {collectionTypes.map((type) => {
                      const isActive = location.pathname === `/documents/${type.id}`;
                      return (
                        <Link
                          key={type.id}
                          to={`/documents/${type.id}`}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            color: isActive ? colorPrimary : colorText,
                            background: isActive ? colorPrimaryBg : 'transparent',
                            fontWeight: isActive ? 600 : 400,
                            fontSize: 14,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {type.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* SINGLE TYPES Section */}
                {(singleTypes.length > 0 || totalSinglesCount > 0) && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                        padding: '0 4px',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: colorTextSecondary,
                          letterSpacing: '0.5px',
                        }}
                      >
                        SINGLE TYPES
                      </Text>
                      <Badge
                        count={totalSinglesCount}
                        style={{
                          backgroundColor: colorBgLayout,
                          color: colorTextSecondary,
                          fontSize: 11,
                          boxShadow: 'none',
                          border: `1px solid ${colorBorderSecondary}`,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {singleTypes.map((type) => {
                        const isActive = location.pathname === `/documents/${type.id}`;
                        return (
                          <Link
                            key={type.id}
                            to={`/documents/${type.id}`}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              color: isActive ? colorPrimary : colorText,
                              background: isActive ? colorPrimaryBg : 'transparent',
                              fontWeight: isActive ? 600 : 400,
                              fontSize: 14,
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            {type.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeModule === 'schema-inspector' && (
          <>
            <Text strong style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>
              Schema Inspector
            </Text>

            <Input
              prefix={<SearchOutlined style={{ color: colorTextSecondary }} />}
              placeholder="Search schemas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ marginBottom: 20 }}
            />

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Spin size="small" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredTypes.map((type) => {
                  const isActive = location.pathname === `/schemas/${type.id}`;
                  return (
                    <Link
                      key={type.id}
                      to={`/schemas/${type.id}`}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        color: isActive ? colorPrimary : colorText,
                        background: isActive ? colorPrimaryBg : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 14,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {type.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeModule === 'settings' && (
          <>
            <Text strong style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>
              Settings
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link
                to="/settings"
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  color: location.pathname === '/settings' ? colorPrimary : colorText,
                  background: location.pathname === '/settings' ? colorPrimaryBg : 'transparent',
                  fontWeight: location.pathname === '/settings' ? 600 : 400,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Global Configuration
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 3. Main Content Panel */}
      <Layout style={{ flex: 1, background: colorBgLayout, overflow: 'hidden' }}>
        <Content
          style={{
            margin: 24,
            padding: 0,
            background: 'transparent',
            minHeight: 280,
            overflow: 'auto',
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
