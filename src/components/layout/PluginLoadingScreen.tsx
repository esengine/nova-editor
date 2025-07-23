/**
 * Plugin Loading Screen
 * 插件加载界面
 */

import React from 'react';
import { Spin, Progress, Card, List, Typography, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { usePluginStore, PluginLoadingState } from '../../stores/pluginStore';

const { Title, Text } = Typography;

export interface PluginLoadingScreenProps {
  /** Whether to show the loading screen */
  visible: boolean;
}

/**
 * Plugin Loading Screen Component
 * 插件加载界面组件
 */
export const PluginLoadingScreen: React.FC<PluginLoadingScreenProps> = ({ 
  visible 
}) => {
  const {
    isLoading,
    isInitialized,
    initializationError,
    getAllPlugins,
    getLoadingProgress
  } = usePluginStore();

  const plugins = getAllPlugins();
  const progress = getLoadingProgress();

  if (!visible) {
    return null;
  }

  const getPluginIcon = (state: PluginLoadingState) => {
    switch (state) {
      case PluginLoadingState.Loading:
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case PluginLoadingState.Loaded:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case PluginLoadingState.Failed:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getPluginStateText = (state: PluginLoadingState) => {
    switch (state) {
      case PluginLoadingState.Loading:
        return 'Loading...';
      case PluginLoadingState.Loaded:
        return 'Loaded';
      case PluginLoadingState.Failed:
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <Card
        style={{
          width: 500,
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Loading Nova Editor</Title>
          <Text type="secondary">Initializing plugins and systems...</Text>
        </div>

        {initializationError && (
          <Alert
            message="Initialization Failed"
            description={initializationError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {!isInitialized && !initializationError && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Progress
                percent={progress.percentage}
                status={isLoading ? 'active' : 'success'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={() => `${progress.loaded} / ${progress.total}`}
              />
            </div>

            <List
              dataSource={plugins}
              renderItem={(plugin) => (
                <List.Item
                  actions={[
                    <span key="state" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getPluginIcon(plugin.state)}
                      <Text {...(plugin.state === PluginLoadingState.Failed ? { type: 'danger' } : {})}>
                        {getPluginStateText(plugin.state)}
                      </Text>
                      {plugin.loadTime && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({plugin.loadTime.toFixed(0)}ms)
                        </Text>
                      )}
                    </span>
                  ]}
                >
                  <List.Item.Meta
                    title={plugin.name}
                    description={
                      <div>
                        <div>{plugin.description}</div>
                        {plugin.error && (
                          <Text type="danger" style={{ fontSize: 12 }}>
                            Error: {plugin.error}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {isInitialized && !initializationError && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>Ready!</Title>
            <Text type="secondary">All plugins loaded successfully</Text>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin size="large" />
          </div>
        )}
      </Card>
    </div>
  );
};