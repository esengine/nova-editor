/**
 * Main application menu component
 * 主应用菜单组件
 */

import React from 'react';
import { Dropdown, App } from 'antd';
import {
  FileOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';

export interface MainMenuProps {
  theme: any;
}

export const MainMenu: React.FC<MainMenuProps> = ({ theme }) => {
  const { saveWorkspace, resetWorkspace } = useEditorStore();
  const { message } = App.useApp();

  // File menu items
  const fileMenuItems = [
    {
      key: 'new',
      label: 'New Project',
      icon: <FileOutlined />,
      onClick: () => message.info('New project functionality coming soon')
    },
    {
      key: 'open',
      label: 'Open Project',
      icon: <FolderOpenOutlined />,
      onClick: () => message.info('Open project functionality coming soon')
    },
    { type: 'divider' as const },
    {
      key: 'save',
      label: 'Save Project',
      icon: <SaveOutlined />,
      onClick: () => {
        saveWorkspace();
        message.success('Project saved');
      }
    },
    { type: 'divider' as const },
    {
      key: 'export',
      label: 'Export Project',
      icon: <ExportOutlined />,
      onClick: () => message.info('Export functionality coming soon')
    },
    {
      key: 'import',
      label: 'Import Project',
      icon: <ImportOutlined />,
      onClick: () => message.info('Import functionality coming soon')
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
    </div>
  );
};