/**
 * Nova Editor main application component
 * Nova编辑器主应用组件
 */

import React from 'react';
import { ConfigProvider, Layout, theme, App as AntdApp } from 'antd';
import { useEditorStore } from './stores/editorStore';
import { usePluginStore } from './stores/pluginStore';
import { useEditorWorld } from './hooks/useEditorWorld';
import { DockLayout } from './components/layout';
import { PluginLoadingScreen } from './components/layout/PluginLoadingScreen';
import { ProjectStartScreen } from './components/project';
import { MainMenu } from './components/menu';
import { EditorToolbar } from './components/toolbar';
import type { ProjectConfig } from './types';
import './App.css';

const { Header, Content } = Layout;

/**
 * Main application component
 * 主应用组件
 */
function App(): React.ReactElement {
  const editorTheme = useEditorStore(state => state.theme);
  const isLoading = useEditorStore(state => state.isLoading);
  const project = useEditorStore(state => state.project);
  const projectPath = useEditorStore(state => state.projectPath);
  const setProject = useEditorStore(state => state.setProject);
  const setProjectPath = useEditorStore(state => state.setProjectPath);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const canUndo = useEditorStore(state => state.canUndo);
  const canRedo = useEditorStore(state => state.canRedo);
  
  // Plugin store
  const isPluginLoading = usePluginStore(state => state.isLoading);
  const isPluginInitialized = usePluginStore(state => state.isInitialized);
  
  // Show loading screen while plugins are loading
  const showLoadingScreen = isLoading || isPluginLoading || !isPluginInitialized;

  // Handle project selection from start screen
  const handleProjectSelected = (selectedProjectPath: string, projectConfig: ProjectConfig) => {
    setProject(projectConfig);
    setProjectPath(selectedProjectPath);
  };

  // Initialize EditorWorld only when project is loaded
  const hasProject = !!(project && projectPath);
  useEditorWorld(hasProject);

  // Global event handlers - Always run this hook
  React.useEffect(() => {
    // Disable context menu (right-click menu) globally
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if target is not an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true') {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (canUndo) {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            if (canRedo) {
              redo();
            }
            break;
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  // If no project is loaded, show project start screen
  if (!hasProject) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: editorTheme.colors.primary,
            colorBgContainer: editorTheme.colors.surface,
            colorBgBase: editorTheme.colors.background,
            colorText: editorTheme.colors.text,
            colorTextSecondary: editorTheme.colors.textSecondary,
            colorBorder: editorTheme.colors.border,
            fontFamily: editorTheme.typography.fontFamily,
            fontSize: editorTheme.typography.fontSize,
            lineHeight: editorTheme.typography.lineHeight,
          },
        }}
      >
        <AntdApp>
          <ProjectStartScreen
            onProjectSelected={handleProjectSelected}
            theme={editorTheme}
          />
        </AntdApp>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: editorTheme.colors.primary,
          colorBgContainer: editorTheme.colors.surface,
          colorBgBase: editorTheme.colors.background,
          colorText: editorTheme.colors.text,
          colorTextSecondary: editorTheme.colors.textSecondary,
          colorBorder: editorTheme.colors.border,
          fontFamily: editorTheme.typography.fontFamily,
          fontSize: editorTheme.typography.fontSize,
          lineHeight: editorTheme.typography.lineHeight,
        },
        components: {
          Slider: {
            railBg: '#777777',
            railHoverBg: '#888888',
            trackBg: editorTheme.colors.primary,
            trackHoverBg: editorTheme.colors.primary,
            handleColor: '#ffffff',
            handleActiveColor: '#ffffff',
            colorPrimaryBorderHover: editorTheme.colors.primary,
          }
        }
      }}
    >
      <AntdApp>
        <style>{`
          .ant-layout-header {
            height: 86px !important;
            min-height: 86px !important;
            max-height: 86px !important;
            line-height: unset !important;
          }
        `}</style>
        <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          padding: '0',
          background: editorTheme.colors.surface,
          borderBottom: `1px solid ${editorTheme.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1000,
          height: '86px',
          minHeight: '86px',
          maxHeight: '86px'
        }}>
          {/* Main header with menu */}
          <div style={{
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '40px', // Increased height for better menu visibility
            backgroundColor: editorTheme.colors.background,
            borderBottom: `1px solid ${editorTheme.colors.border}`
          }}>
            {/* Left: Logo and Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  className="nova-editor-title"
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '0.5px',
                    cursor: 'default',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    const style = e.currentTarget.style as any;
                    style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)';
                    style.backgroundSize = '200% 200%';
                    style.backgroundClip = 'text';
                    style.webkitBackgroundClip = 'text';
                    style.webkitTextFillColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    const style = e.currentTarget.style as any;
                    style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    style.backgroundSize = '200% 200%';
                    style.backgroundClip = 'text';
                    style.webkitBackgroundClip = 'text';
                    style.webkitTextFillColor = 'transparent';
                  }}
                >
                  Nova Editor
                </div>
                {project && (
                  <>
                    <span style={{ color: editorTheme.colors.textSecondary, fontSize: '16px' }}>-</span>
                    <span style={{ 
                      color: editorTheme.colors.text, 
                      fontSize: '16px', 
                      fontWeight: '500' 
                    }}>
                      {project.name}
                    </span>
                  </>
                )}
              </div>
              <MainMenu theme={editorTheme} />
            </div>

            {/* Right: Status */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: editorTheme.colors.textSecondary,
              height: '100%'
            }}>
              <span style={{ fontSize: '12px' }}>{isLoading ? 'Loading...' : 'Ready'}</span>
            </div>
          </div>
          
          {/* Editor Toolbar */}
          <EditorToolbar />
        </Header>

        <Content style={{
          padding: '0',
          background: editorTheme.colors.background,
          overflow: 'hidden',
          height: `calc(100vh - 90px)`
        }}>
          <DockLayout />
        </Content>
      </Layout>
      
      {/* Plugin Loading Screen */}
      <PluginLoadingScreen visible={showLoadingScreen} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
