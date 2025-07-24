/**
 * Main application menu component
 * 主应用菜单组件
 */

import React, { useState } from 'react';
import { Dropdown, App } from 'antd';
import {
  FileOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  ExportOutlined,
  ImportOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { projectService } from '../../services/ProjectService';
import { PluginManager } from '../plugin';

export interface MainMenuProps {
  theme: any;
}

export const MainMenu: React.FC<MainMenuProps> = ({ theme }) => {
  const [pluginManagerVisible, setPluginManagerVisible] = useState(false);
  
  const { 
    saveWorkspace, 
    resetWorkspace,
    project,
    projectPath,
    setProject,
    setProjectPath
  } = useEditorStore();
  const { message } = App.useApp();

  // Handle project operations
  const handleNewProject = () => {
    // Close current project and return to start screen
    setProject(null);
    setProjectPath(null);
  };

  const handleOpenProject = async () => {
    try {
      const result = await projectService.openProject();
      if (result) {
        setProject(result.config);
        setProjectPath(result.path);
        message.success(`Project "${result.config.name}" opened successfully`);
      }
    } catch (error) {
      message.error('Failed to open project');
    }
  };

  const handleSaveProject = async () => {
    if (!project || !projectPath) {
      message.warning('No project loaded');
      return;
    }

    try {
      await projectService.saveProject(projectPath, project);
      saveWorkspace();
      message.success('Project saved successfully');
    } catch (error) {
      message.error('Failed to save project');
    }
  };

  // File menu items
  const fileMenuItems = [
    {
      key: 'new',
      label: 'New Project',
      icon: <FileOutlined />,
      onClick: handleNewProject
    },
    {
      key: 'open',
      label: 'Open Project',
      icon: <FolderOpenOutlined />,
      onClick: handleOpenProject
    },
    { type: 'divider' as const },
    {
      key: 'save',
      label: 'Save Project',
      icon: <SaveOutlined />,
      onClick: handleSaveProject,
      disabled: !project || !projectPath
    },
    { type: 'divider' as const },
    {
      key: 'export',
      label: 'Export Project',
      icon: <ExportOutlined />,
      onClick: () => message.info('Export functionality coming soon'),
      disabled: !project
    },
    {
      key: 'import',
      label: 'Import Project',
      icon: <ImportOutlined />,
      onClick: () => message.info('Import functionality coming soon')
    },
    { type: 'divider' as const },
    {
      key: 'close',
      label: 'Close Project',
      icon: <LogoutOutlined />,
      onClick: handleNewProject,
      disabled: !project
    }
  ];

  // Edit menu items
  const editMenuItems = [
    {
      key: 'undo',
      label: 'Undo',
      disabled: true,
      onClick: () => message.info('Undo functionality coming soon')
    },
    {
      key: 'redo',
      label: 'Redo',
      disabled: true,
      onClick: () => message.info('Redo functionality coming soon')
    },
    { type: 'divider' as const },
    {
      key: 'copy',
      label: 'Copy',
      disabled: true,
      onClick: () => message.info('Copy functionality coming soon')
    },
    {
      key: 'paste',
      label: 'Paste',
      disabled: true,
      onClick: () => message.info('Paste functionality coming soon')
    }
  ];

  // Get layout and toggle functions
  const layout = useEditorStore(state => state.layout);
  const togglePanelVisibility = useEditorStore(state => state.togglePanelVisibility);

  // View menu items
  const viewMenuItems = [
    {
      key: 'panels',
      label: 'Panels',
      children: layout.panels.map(panel => ({
        key: `panel-${panel.id}`,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '150px' }}>
            <span>{panel.title}</span>
            <span style={{ color: panel.visible ? '#52c41a' : '#ff4d4f', marginLeft: '8px' }}>
              {panel.visible ? '●' : '○'}
            </span>
          </div>
        ),
        onClick: () => {
          togglePanelVisibility(panel.id);
          message.success(`${panel.title} panel ${panel.visible ? 'hidden' : 'shown'}`);
        }
      }))
    },
    { type: 'divider' as const },
    {
      key: 'reset-layout',
      label: 'Reset Layout',
      onClick: () => {
        resetWorkspace();
        message.success('Layout reset to default');
      }
    },
    { type: 'divider' as const },
    {
      key: 'fullscreen',
      label: 'Toggle Fullscreen',
      onClick: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    }
  ];

  // Tools menu items
  const toolsMenuItems = [
    {
      key: 'plugin-manager',
      label: 'Plugin Manager',
      icon: <SettingOutlined />,
      onClick: () => setPluginManagerVisible(true)
    }
  ];

  // Help menu items
  const helpMenuItems = [
    {
      key: 'docs',
      label: 'Documentation',
      onClick: () => window.open('https://github.com/esengine/NovaECS', '_blank')
    },
    {
      key: 'about',
      label: 'About Nova Editor',
      onClick: () => message.info('Nova Editor v1.0.0 - Built with NovaECS')
    }
  ];


  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Dropdown 
        menu={{ items: fileMenuItems, style: { backgroundColor: theme.colors.surface } }}
        trigger={['click']}
      >
        <span 
          onClick={e => e.preventDefault()}
          style={{ 
            color: theme.colors.text, 
            padding: '6px 12px',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '14px',
            lineHeight: '1.4',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          File
        </span>
      </Dropdown>

      <Dropdown 
        menu={{ items: editMenuItems, style: { backgroundColor: theme.colors.surface } }}
        trigger={['click']}
      >
        <span 
          onClick={e => e.preventDefault()}
          style={{ 
            color: theme.colors.text, 
            padding: '6px 12px',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '14px',
            lineHeight: '1.4',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Edit
        </span>
      </Dropdown>

      <Dropdown 
        menu={{ items: viewMenuItems, style: { backgroundColor: theme.colors.surface } }}
        trigger={['click']}
      >
        <span 
          onClick={e => e.preventDefault()}
          style={{ 
            color: theme.colors.text, 
            padding: '6px 12px',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '14px',
            lineHeight: '1.4',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          View
        </span>
      </Dropdown>

      <Dropdown 
        menu={{ items: toolsMenuItems, style: { backgroundColor: theme.colors.surface } }}
        trigger={['click']}
      >
        <span 
          onClick={e => e.preventDefault()}
          style={{ 
            color: theme.colors.text, 
            padding: '6px 12px',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '14px',
            lineHeight: '1.4',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Tools
        </span>
      </Dropdown>

      <Dropdown 
        menu={{ items: helpMenuItems, style: { backgroundColor: theme.colors.surface } }}
        trigger={['click']}
      >
        <span 
          onClick={e => e.preventDefault()}
          style={{ 
            color: theme.colors.text, 
            padding: '6px 12px',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '14px',
            lineHeight: '1.4',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Help
        </span>
      </Dropdown>

      {/* Plugin Manager Modal */}
      <PluginManager
        visible={pluginManagerVisible}
        onClose={() => setPluginManagerVisible(false)}
      />
    </div>
  );
};