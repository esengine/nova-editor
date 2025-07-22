/**
 * Professional dock layout system using rc-dock
 * 使用rc-dock的专业停靠布局系统
 */

import React from 'react';
import { DockLayout as RCDockLayout, type LayoutData } from 'rc-dock';
import { useEditorStore } from '../../stores/editorStore';
import { PanelType } from '../../types';
import { HierarchyPanel } from '../panels/HierarchyPanel';
import { SceneViewPanel } from '../panels/SceneViewPanel';
import { InspectorPanel } from '../panels/InspectorPanel';
import { AssetBrowserPanel } from '../panels/AssetBrowserPanel';
import { ConsolePanel } from '../panels/ConsolePanel';
import 'rc-dock/dist/rc-dock.css';

/**
 * Render panel content based on panel type
 * 根据面板类型渲染面板内容
 */
const renderPanelContent = (panelType: PanelType): React.ReactNode => {
  switch (panelType) {
    case PanelType.Hierarchy:
      return <HierarchyPanel />;
    case PanelType.SceneView:
      return <SceneViewPanel />;
    case PanelType.Inspector:
      return <InspectorPanel />;
    case PanelType.AssetBrowser:
      return <AssetBrowserPanel />;
    case PanelType.Console:
      return <ConsolePanel />;
    default:
      return <div style={{ padding: '16px', color: '#666' }}>Unknown panel type</div>;
  }
};

/**
 * Panel tab component for rc-dock
 */
const PanelTab: React.FC<{ panelType: PanelType }> = ({ panelType }) => {
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      {renderPanelContent(panelType)}
    </div>
  );
};

/**
 * Main dock layout component
 */
export interface DockLayoutProps {
  style?: React.CSSProperties;
  className?: string;
}

export const DockLayout: React.FC<DockLayoutProps> = ({
  style,
  className
}) => {
  const theme = useEditorStore(state => state.theme);

  // Create dock layout data structure
  const dockLayoutData: LayoutData = React.useMemo(() => ({
    dockbox: {
      mode: 'horizontal',
      children: [
        // Left panel group
        {
          mode: 'vertical',
          size: 300,
          children: [
            {
              tabs: [
                {
                  id: 'hierarchy',
                  title: 'Hierarchy',
                  content: <PanelTab panelType={PanelType.Hierarchy} />,
                  closable: false
                }
              ]
            }
          ]
        },
        // Center panel group
        {
          mode: 'vertical',
          children: [
            {
              tabs: [
                {
                  id: 'scene-view',
                  title: 'Scene',
                  content: <PanelTab panelType={PanelType.SceneView} />,
                  closable: false
                }
              ]
            },
            // Bottom panels (Assets & Console)
            {
              size: 250,
              tabs: [
                {
                  id: 'asset-browser',
                  title: 'Assets',
                  content: <PanelTab panelType={PanelType.AssetBrowser} />,
                  closable: false
                },
                {
                  id: 'console',
                  title: 'Console',
                  content: <PanelTab panelType={PanelType.Console} />,
                  closable: false
                }
              ]
            }
          ]
        },
        // Right panel group
        {
          mode: 'vertical',
          size: 300,
          children: [
            {
              tabs: [
                {
                  id: 'inspector',
                  title: 'Inspector',
                  content: <PanelTab panelType={PanelType.Inspector} />,
                  closable: false
                }
              ]
            }
          ]
        }
      ]
    }
  }), []);


  return (
    <div 
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: theme.colors.background,
        ...style
      }}
      className={className}
    >
      <style>{`
        /* Custom rc-dock theming */
        .dock {
          background: ${theme.colors.background} !important;
          color: ${theme.colors.text} !important;
        }
        
        .dock-layout {
          background: ${theme.colors.background} !important;
        }
        
        .dock-panel {
          background: ${theme.colors.surface} !important;
          border: 1px solid ${theme.colors.border} !important;
          border-radius: 6px !important;
        }
        
        .dock-panel * {
          background: transparent !important;
        }
        
        .dock-bar {
          background: ${theme.colors.surface} !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .dock-tabs {
          background: ${theme.colors.surface} !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .dock-tab-pane {
          background: ${theme.colors.background} !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .dock-content {
          background: ${theme.colors.background} !important;
        }
        
        .dock-tab {
          background: ${theme.colors.surface} !important;
          color: ${theme.colors.text} !important;
          border: none !important;
          border-radius: 0 !important;
          position: relative !important;
          padding: 0 20px 0 8px !important;
          margin: 0 8px 0 0 !important;
          min-width: 80px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        
        .dock-tab::before {
          content: '' !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          width: 3px !important;
          background: transparent !important;
          transition: all 0.2s ease !important;
        }
        
        .dock-tab:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .dock-tab:hover::before {
          background: ${theme.colors.primary} !important;
          opacity: 0.6 !important;
        }
        
        .dock-tab.dock-tab-active {
          background: ${theme.colors.background} !important;
          color: ${theme.colors.text} !important;
          border-bottom: none !important;
        }
        
        .dock-tab.dock-tab-active::before {
          background: ${theme.colors.primary} !important;
          opacity: 1 !important;
        }
        
        .dock-tab-content {
          background: ${theme.colors.background} !important;
          padding: 0 !important;
        }
        
        .dock-divider {
          background: ${theme.colors.border} !important;
          opacity: 1;
          border: 1px solid ${theme.colors.textSecondary} !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
        }
        
        .dock-divider:hover {
          background: ${theme.colors.primary} !important;
          opacity: 1;
          box-shadow: 0 0 4px rgba(24, 144, 255, 0.3) !important;
        }
        
        .dock-divider-horizontal {
          height: 6px !important;
          cursor: ns-resize !important;
          border-radius: 3px !important;
        }
        
        .dock-divider-vertical {
          width: 6px !important;
          cursor: ew-resize !important;
          border-radius: 3px !important;
        }
        
        .dock-nav {
          background: ${theme.colors.surface} !important;
          border-bottom: none !important;
          padding: 0 !important;
        }
        
        .dock-nav-list {
          background: ${theme.colors.surface} !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .dock-nav-wrap {
          background: ${theme.colors.surface} !important;
        }
        
        .dock-nav-operations {
          background: ${theme.colors.surface} !important;
        }
        
        .dock-nav-tabs-content {
          background: ${theme.colors.surface} !important;
        }
        
        .dock-nav-add {
          background: ${theme.colors.surface} !important;
        }
        
        .dock-ink-bar {
          display: none !important;
        }
        
        .dock-tab-close-btn {
          display: none !important;
        }
        
        .dock-panel-content {
          background: ${theme.colors.background} !important;
          height: 100% !important;
          overflow: hidden !important;
        }
      `}</style>
      <RCDockLayout 
        defaultLayout={dockLayoutData}
        style={{ height: '100%' }}
      />
    </div>
  );
};