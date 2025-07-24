/**
 * Plugin Manager - Manage loaded plugins, enable/disable functionality
 * 插件管理器 - 管理已加载的插件，启用/禁用功能
 */

import React, { useState } from 'react';
import {
  Modal,
  List,
  Switch,
  Tag,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Input,
  Select,
  Tooltip,
  Badge,
  Empty
} from 'antd';
import {
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { usePluginStore, PluginLoadingState, type PluginInfo } from '../../stores/pluginStore';

const { Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

export interface PluginManagerProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Plugin status color mapping
 * 插件状态颜色映射
 */
const getStatusColor = (state: PluginLoadingState) => {
  switch (state) {
    case PluginLoadingState.Loaded:
      return 'success';
    case PluginLoadingState.Loading:
      return 'processing';
    case PluginLoadingState.Failed:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Plugin status icon mapping
 * 插件状态图标映射
 */
const getStatusIcon = (state: PluginLoadingState) => {
  switch (state) {
    case PluginLoadingState.Loaded:
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case PluginLoadingState.Loading:
      return <ReloadOutlined spin style={{ color: '#1890ff' }} />;
    case PluginLoadingState.Failed:
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
  }
};

export const PluginManager: React.FC<PluginManagerProps> = ({
  visible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');

  // Plugin store
  const allPlugins = usePluginStore(state => state.getAllPlugins());
  const enabledPlugins = usePluginStore(state => state.getEnabledPlugins());
  const disabledPlugins = usePluginStore(state => state.getDisabledPlugins());
  const enablePlugin = usePluginStore(state => state.enablePlugin);
  const disablePlugin = usePluginStore(state => state.disablePlugin);
  const isLoading = usePluginStore(state => state.isLoading);
  const loadingProgress = usePluginStore(state => state.getLoadingProgress());

  // Filter plugins based on search and filters
  const filteredPlugins = allPlugins.filter(plugin => {
    // Search filter
    const matchesSearch = !searchQuery || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.author?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || plugin.state === statusFilter;

    // Enabled filter
    const matchesEnabled = enabledFilter === 'all' || 
      (enabledFilter === 'enabled' && plugin.enabled) ||
      (enabledFilter === 'disabled' && !plugin.enabled);

    return matchesSearch && matchesStatus && matchesEnabled;
  });

  // Statistics
  const stats = {
    total: allPlugins.length,
    enabled: enabledPlugins.length,
    disabled: disabledPlugins.length,
    loaded: allPlugins.filter(p => p.state === PluginLoadingState.Loaded).length,
    failed: allPlugins.filter(p => p.state === PluginLoadingState.Failed).length
  };

  const handlePluginToggle = (pluginName: string, enabled: boolean) => {
    if (enabled) {
      enablePlugin(pluginName);
    } else {
      disablePlugin(pluginName);
    }
  };

  const renderPluginItem = (plugin: PluginInfo) => (
    <List.Item
      key={plugin.name}
      actions={[
        <Tooltip title={plugin.enabled ? 'Disable Plugin' : 'Enable Plugin'}>
          <Switch
            checked={plugin.enabled}
            onChange={(checked) => handlePluginToggle(plugin.name, checked)}
            disabled={plugin.state === PluginLoadingState.Loading}
            size="small"
          />
        </Tooltip>
      ]}
    >
      <List.Item.Meta
        avatar={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: plugin.enabled ? '#f6ffed' : '#fafafa',
            border: `1px solid ${plugin.enabled ? '#d9f7be' : '#d9d9d9'}`
          }}>
            {getStatusIcon(plugin.state)}
          </div>
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '16px' }}>
              {plugin.name}
            </Text>
            <Tag color={getStatusColor(plugin.state)}>
              {plugin.state}
            </Tag>
            {!plugin.enabled && (
              <Badge status="default" text="Disabled" />
            )}
          </Space>
        }
        description={
          <div>
            <Paragraph 
              style={{ margin: '4px 0', color: '#666' }}
              ellipsis={{ rows: 2, expandable: true }}
            >
              {plugin.description || 'No description available'}
            </Paragraph>
            <Space size="small" style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Version: {plugin.version}
              </Text>
              {plugin.author && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  • Author: {plugin.author}
                </Text>
              )}
              {plugin.loadTime && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  • Load time: {plugin.loadTime}ms
                </Text>
              )}
            </Space>
            {plugin.error && (
              <div style={{ marginTop: '8px' }}>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  Error: {plugin.error}
                </Text>
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          Plugin Manager
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      styles={{
        body: { padding: '24px' }
      }}
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Plugins"
              value={stats.total}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Enabled"
              value={stats.enabled}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Disabled"
              value={stats.disabled}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Failed"
              value={stats.failed}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="1">
            <Search
              placeholder="Search plugins by name, description, or author..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Col>
          <Col>
            <Space>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">All Status</Option>
                <Option value={PluginLoadingState.Loaded}>Loaded</Option>
                <Option value={PluginLoadingState.Loading}>Loading</Option>
                <Option value={PluginLoadingState.Failed}>Failed</Option>
                <Option value={PluginLoadingState.Idle}>Idle</Option>
              </Select>
              
              <Select
                value={enabledFilter}
                onChange={setEnabledFilter}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">All Plugins</Option>
                <Option value="enabled">Enabled</Option>
                <Option value="disabled">Disabled</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Loading Progress */}
      {isLoading && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f9ff' }}>
          <Space>
            <ReloadOutlined spin />
            <Text>Loading plugins... {loadingProgress.loaded}/{loadingProgress.total} ({Math.round(loadingProgress.percentage)}%)</Text>
          </Space>
        </Card>
      )}

      {/* Plugin List */}
      <Card 
        title={`Plugins (${filteredPlugins.length}/${allPlugins.length})`}
        extra={
          <Space>
            <Tooltip title="Refresh Plugin List">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                size="small"
                onClick={() => window.location.reload()}
              />
            </Tooltip>
          </Space>
        }
        size="small"
      >
        {filteredPlugins.length > 0 ? (
          <List
            dataSource={filteredPlugins}
            renderItem={renderPluginItem}
            size="small"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          />
        ) : (
          <Empty
            description={
              allPlugins.length === 0 
                ? "No plugins loaded" 
                : "No plugins match the current filters"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </Modal>
  );
};