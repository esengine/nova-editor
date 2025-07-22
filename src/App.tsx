/**
 * Nova Editor main application component
 * Nova编辑器主应用组件
 */

import React from 'react';
import { ConfigProvider, Layout, theme, App as AntdApp } from 'antd';
import { useEditorStore } from './stores/editorStore';
import { useEditorWorld } from './hooks/useEditorWorld';
import { DockLayout } from './components/layout';
import { EditorToolbar } from './components/toolbar';
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
      }}
    >
      <AntdApp>
        <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          padding: '0',
          background: editorTheme.colors.surface,
          borderBottom: `1px solid ${editorTheme.colors.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Main header */}
          <div style={{
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '48px'
          }}>
            <div style={{
              color: editorTheme.colors.text,
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              Nova Editor
            </div>
            <div style={{ color: editorTheme.colors.textSecondary }}>
              {isLoading ? 'Loading...' : 'Ready'}
            </div>
          </div>
          
          {/* Toolbar */}
          <EditorToolbar />
        </Header>

        <Content style={{
          padding: '0',
          background: editorTheme.colors.background,
          overflow: 'hidden'
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
