/**
 * Nova Editor main application component
 * Nova编辑器主应用组件
 */

import React from 'react';
import { ConfigProvider, Layout, theme, App as AntdApp } from 'antd';
import { useEditorStore } from './stores/editorStore';
import { useEditorWorld } from './hooks/useEditorWorld';
import { DockLayout } from './components/layout';
import { MainMenu } from './components/menu';
import './App.css';

const { Header, Content, Footer } = Layout;

/**
 * Main application component
 * 主应用组件
 */
function App(): React.ReactElement {
  const editorTheme = useEditorStore(state => state.theme);
  const isLoading = useEditorStore(state => state.isLoading);
  
  // Initialize EditorWorld
  useEditorWorld();

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
        <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          padding: '0',
          background: editorTheme.colors.surface,
          borderBottom: `1px solid ${editorTheme.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1000
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
        </Header>

        <Content style={{
          padding: '0',
          background: editorTheme.colors.background,
          overflow: 'hidden',
          height: `calc(100vh - 40px - 52px)` // viewport height - menu header - footer
        }}>
          <DockLayout />
        </Content>

        <Footer style={{
          textAlign: 'center',
          background: editorTheme.colors.surface,
          borderTop: `1px solid ${editorTheme.colors.border}`,
          color: editorTheme.colors.textSecondary
        }}>
          Nova Editor ©2025 Created by esengine
        </Footer>
      </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
