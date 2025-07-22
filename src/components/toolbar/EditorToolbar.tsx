/**
 * Editor toolbar with panel management and workspace controls
 * 编辑器工具栏，包含面板管理和工作区控制
 */

import React, { useState } from 'react';
import { 
  Button, 
  Dropdown, 
  Space, 
  Tooltip, 
  Menu, 
  Modal, 
  message,
  Switch,
  Divider
} from 'antd';
import {
  LayoutOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { workspaceService } from '../../services/WorkspaceService';

/**
 * Panel visibility toggle component
 * 面板可见性切换组件
 */
const PanelVisibilityMenu: React.FC = () => {
  const layout = useEditorStore(state => state.layout);
  const togglePanelVisibility = useEditorStore(state => state.togglePanelVisibility);

  const menuItems = layout.panels.map(panel => ({
    key: panel.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '150px' }}>
        <span>{panel.title}</span>
        <Switch
          size="small"
          checked={panel.visible}
          onChange={() => togglePanelVisibility(panel.id)}
        />
      </div>
    )
  }));

  return (
    <Menu 
      items={menuItems}
      onClick={(e) => {
        e.domEvent.stopPropagation();
      }}
    />
  );
};

/**
 * Workspace management modal
 * 工作区管理模态框
 */
interface WorkspaceModalProps {
  visible: boolean;
  onClose: () => void;
}

const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ visible, onClose }) => {
  const { saveWorkspace, loadWorkspace, resetWorkspace } = useEditorStore();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [configText, setConfigText] = useState('');

  const handleExport = () => {
    const config = workspaceService.exportWorkspace();
    if (config) {
      // Create and download file
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nova-editor-workspace.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success('Workspace exported successfully');
    } else {
      message.error('No workspace configuration to export');
    }
  };

  const handleImport = () => {
    setImportModalVisible(true);
  };

  const handleImportConfirm = () => {
    if (workspaceService.importWorkspace(configText)) {
      loadWorkspace();
      setConfigText('');
      setImportModalVisible(false);
      onClose();
      message.success('Workspace imported successfully');
    } else {
      message.error('Failed to import workspace configuration');
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: 'Reset Workspace',
      content: 'Are you sure you want to reset the workspace to default? This action cannot be undone.',
      okText: 'Reset',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        resetWorkspace();
        onClose();
        message.success('Workspace reset to default');
      }
    });
  };

  return (
    <>
      <Modal
        title="Workspace Management"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={500}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h4>Current Workspace</h4>
            <Space>
              <Button 
                icon={<SaveOutlined />} 
                onClick={() => { saveWorkspace(); message.success('Workspace saved'); }}
              >
                Save Current
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => { loadWorkspace(); message.success('Workspace reloaded'); }}
              >
                Reload Saved
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <h4>Import/Export</h4>
            <Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                Export Config
              </Button>
              <Button icon={<ImportOutlined />} onClick={handleImport}>
                Import Config
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <h4>Reset</h4>
            <Button danger icon={<ReloadOutlined />} onClick={handleReset}>
              Reset to Default
            </Button>
          </div>
        </Space>
      </Modal>

      <Modal
        title="Import Workspace Configuration"
        open={importModalVisible}
        onOk={handleImportConfirm}
        onCancel={() => {
          setImportModalVisible(false);
          setConfigText('');
        }}
        okText="Import"
        cancelText="Cancel"
        width={700}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>Paste your workspace configuration JSON below:</p>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder="Paste JSON configuration here..."
            style={{
              width: '100%',
              height: '300px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />
        </div>
      </Modal>
    </>
  );
};

/**
 * Main editor toolbar component
 * 主编辑器工具栏组件
 */
export interface EditorToolbarProps {
  style?: React.CSSProperties;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  style,
  className
}) => {
  const theme = useEditorStore(state => state.theme);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);

  return (
    <>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: theme.colors.surface,
          borderBottom: `1px solid ${theme.colors.border}`,
          ...style
        }}
        className={className}
      >
        {/* Left section - Panel controls */}
        <Space>
          <Dropdown 
            overlay={<PanelVisibilityMenu />} 
            trigger={['click']}
            placement="bottomLeft"
          >
            <Tooltip title="Toggle Panels">
              <Button icon={<EyeOutlined />} size="small">
                Panels
              </Button>
            </Tooltip>
          </Dropdown>

          <Tooltip title="Workspace Settings">
            <Button 
              icon={<LayoutOutlined />} 
              size="small"
              onClick={() => setWorkspaceModalVisible(true)}
            >
              Workspace
            </Button>
          </Tooltip>
        </Space>

        {/* Right section - Additional controls */}
        <Space>
          <Tooltip title="Settings">
            <Button icon={<SettingOutlined />} size="small" />
          </Tooltip>
        </Space>
      </div>

      <WorkspaceModal 
        visible={workspaceModalVisible}
        onClose={() => setWorkspaceModalVisible(false)}
      />
    </>
  );
};