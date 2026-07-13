import { FC } from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const Settings: FC = () => (
  <Typography>
    <Title level={2}>Settings</Title>
    <Paragraph>
      Global system configuration, localized languages registry, and SSO authentication endpoints management.
    </Paragraph>
  </Typography>
);
export default Settings;

