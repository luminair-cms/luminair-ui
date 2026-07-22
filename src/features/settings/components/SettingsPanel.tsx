import { FC } from 'react';
import { Typography, Card, Space, Switch, Descriptions, Divider, Tag, theme } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useUIStore } from '@/store';

const { Title, Paragraph, Text } = Typography;

export const SettingsPanel: FC = () => {
  const { themeMode, toggleThemeMode } = useUIStore();
  const { token } = theme.useToken();

  return (
    <div style={{ maxWidth: 800 }}>
      <Typography style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginTop: 0 }}>
          Settings
        </Title>
        <Paragraph type="secondary">
          Global application configuration, theme appearance preferences, and system version info.
        </Paragraph>
      </Typography>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Application Information Card */}
        <Card title={<Space><InfoCircleOutlined /> Application Information</Space>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Application Name">
              <Text strong>Luminair CMS</Text>
            </Descriptions.Item>
            <Descriptions.Item label="System Version">
              <Tag color="geekblue">v0.1.0</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Environment">
              <Tag color="green">Development / Production</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Appearance & Theme Settings Card */}
        <Card title={<Space><SettingOutlined /> Appearance & Theme Mode</Space>}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Text strong style={{ display: 'block' }}>
                Theme Mode
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Switch between Light mode and Dark mode interface
              </Text>
            </div>
            <Space size="middle" align="center">
              <SunOutlined style={{ color: themeMode === 'light' ? token.colorPrimary : token.colorTextSecondary }} />
              <Switch
                checked={themeMode === 'dark'}
                onChange={toggleThemeMode}
                checkedChildren="Dark"
                unCheckedChildren="Light"
              />
              <MoonOutlined style={{ color: themeMode === 'dark' ? token.colorPrimary : token.colorTextSecondary }} />
            </Space>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Text type="secondary" style={{ fontSize: 12 }}>
            Current active mode: <Text strong style={{ textTransform: 'capitalize' }}>{themeMode}</Text>
          </Text>
        </Card>
      </Space>
    </div>
  );
};

export default SettingsPanel;
