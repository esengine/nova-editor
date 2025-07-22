/**
 * Nova Editor main application component
 * Nova编辑器主应用组件
 */

import React from 'react';
import { ConfigProvider, Layout, theme, App as AntdApp } from 'antd';
import { useEditorStore } from './stores/editorStore';
import { useEditorWorld } from './hooks/useEditorWorld';
import { HierarchyPanel } from './components/panels/HierarchyPanel';
import { SceneViewPanel } from './components/panels/SceneViewPanel';
import { InspectorPanel } from './components/panels/InspectorPanel';
import { AssetBrowserPanel } from './components/panels/AssetBrowserPanel';
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
          padding: '0 16px',
          background: editorTheme.colors.surface,
          borderBottom: `1px solid ${editorTheme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
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
        </Header>

        <Content style={{
          padding: '16px',
          background: editorTheme.colors.background,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden'
        }}>
          {/* Top Row - Main panels */}
          <div style={{
            flex: 1,
            display: 'flex',
            gap: '16px',
            minHeight: 0
          }}>
            {/* Left Panel - Hierarchy */}
            <div style={{
              width: '300px',
              minWidth: '250px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                marginBottom: '8px',
                padding: '8px 12px',
                background: editorTheme.colors.surface,
                border: `1px solid ${editorTheme.colors.border}`,
                borderRadius: '6px 6px 0 0',
                borderBottom: 'none',
                color: editorTheme.colors.text,
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Hierarchy
              </div>
              <HierarchyPanel style={{ flex: 1, borderRadius: '0 0 6px 6px' }} />
            </div>

            {/* Center Panel - Scene View */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                marginBottom: '8px',
                padding: '8px 12px',
                background: editorTheme.colors.surface,
                border: `1px solid ${editorTheme.colors.border}`,
                borderRadius: '6px 6px 0 0',
                borderBottom: 'none',
                color: editorTheme.colors.text,
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Scene View
              </div>
              <SceneViewPanel 
                style={{ 
                  flex: 1,
                  borderRadius: '0 0 6px 6px',
                  border: `1px solid ${editorTheme.colors.border}`
                }} 
              />
            </div>

            {/* Right Panel - Inspector */}
            <div style={{
              width: '300px',
              minWidth: '250px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                marginBottom: '8px',
                padding: '8px 12px',
                background: editorTheme.colors.surface,
                border: `1px solid ${editorTheme.colors.border}`,
                borderRadius: '6px 6px 0 0',
                borderBottom: 'none',
                color: editorTheme.colors.text,
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Inspector
              </div>
              <InspectorPanel 
                style={{ 
                  flex: 1,
                  borderRadius: '0 0 6px 6px',
                  border: `1px solid ${editorTheme.colors.border}`
                }} 
              />
            </div>
          </div>

          {/* Bottom Row - Asset Browser */}
          <div style={{
            height: '250px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              marginBottom: '8px',
              padding: '8px 12px',
              background: editorTheme.colors.surface,
              border: `1px solid ${editorTheme.colors.border}`,
              borderRadius: '6px 6px 0 0',
              borderBottom: 'none',
              color: editorTheme.colors.text,
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              Assets
            </div>
            <AssetBrowserPanel 
              style={{ 
                flex: 1,
                borderRadius: '0 0 6px 6px',
                border: `1px solid ${editorTheme.colors.border}`
              }} 
            />
          </div>
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
