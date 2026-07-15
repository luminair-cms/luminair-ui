import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Collapse, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  type?: 'global' | 'content';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isGlobal = this.props.type === 'global';
      const errorMsg = this.state.error?.message || 'An unexpected client-side error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      const containerStyle: React.CSSProperties = isGlobal
        ? {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100vw',
            padding: '24px',
            backgroundColor: 'inherit',
            boxSizing: 'border-box',
          }
        : {
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
          };

      const collapseItems = [
        {
          key: 'details',
          label: 'Error Diagnostics',
          children: (
            <div style={{ textAlign: 'left' }}>
              <Paragraph>
                <Text strong type="danger">
                  Message:
                </Text>{' '}
                <Text code>{errorMsg}</Text>
              </Paragraph>
              {componentStack && (
                <div>
                  <Paragraph style={{ marginBottom: 4 }}>
                    <Text strong>Component Stack Trace:</Text>
                  </Paragraph>
                  <pre
                    style={{
                      maxHeight: '200px',
                      overflow: 'auto',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {componentStack}
                  </pre>
                </div>
              )}
            </div>
          ),
        },
      ];

      return (
        <div style={containerStyle} className={`error-boundary-${this.props.type || 'content'}`}>
          <Result
            status="error"
            title={isGlobal ? 'Something went wrong globally' : 'Component Render Failed'}
            subTitle={
              isGlobal
                ? 'Luminair encountered a critical error and could not render the application layout.'
                : 'An error occurred while loading this section of the page.'
            }
            extra={
              <Space size="middle">
                <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReset}>
                  Try Again
                </Button>
                {isGlobal ? (
                  <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
                    Reload Entire Page
                  </Button>
                ) : (
                  <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                    Go to Home
                  </Button>
                )}
              </Space>
            }
          >
            <Collapse ghost items={collapseItems} />
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}
