import { FC, useState } from 'react';
import { Typography, Button } from 'antd';

const { Title, Paragraph } = Typography;

const CrashingComponent: FC = () => {
  throw new Error("Triggered a manual test crash in Settings component!");
};

export const Settings: FC = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    return <CrashingComponent />;
  }

  return (
    <Typography>
      <Title level={2}>Settings</Title>
      <Paragraph>
        Global system configuration, localized languages registry, and SSO authentication endpoints management.
      </Paragraph>
      <div style={{ marginTop: 24 }}>
        <Button danger type="primary" onClick={() => setShouldCrash(true)}>
          Trigger Test Error (Content-Level)
        </Button>
      </div>
    </Typography>
  );
};
export default Settings;
