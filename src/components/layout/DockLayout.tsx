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
import { CodeEditorPanel } from '../panels/CodeEditorPanel';
import 'rc-dock/dist/rc-dock.css';
import styles from './DockLayout.module.css';

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
    case PanelType.CodeEditor:
      return <CodeEditorPanel />;
    default:
      return <div style={{ padding: '16px', color: '#666' }}>Unknown panel type</div>;
  }
};

/**
 * Panel tab component for rc-dock
 */
const PanelTab: React.FC<{ panelType: PanelType }> = ({ panelType }) => {
  return (
    <div style={{ 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
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
  // const theme = useEditorStore(state => state.theme);
  const layout = useEditorStore(state => state.layout);
  const visiblePanels = layout.panels.filter(panel => panel.visible);

  // Create dock layout data structure
  const dockLayoutData: LayoutData = React.useMemo(() => {
    const centerPanelTabs = [];
    const bottomPanelTabs = [];
    
    // Always add Scene View to center
    centerPanelTabs.push({
      id: 'scene-view',
      title: 'Scene',
      content: <PanelTab panelType={PanelType.SceneView} />,
      closable: false
    });
    
    // Add Code Editor to center tabs if visible
    if (visiblePanels.find(p => p.id === 'code-editor')) {
      centerPanelTabs.push({
        id: 'code-editor',
        title: 'Code Editor',
        content: <PanelTab panelType={PanelType.CodeEditor} />,
        closable: false
      });
    }
    
    // Add visible bottom panels
    if (visiblePanels.find(p => p.id === 'asset-browser')) {
      bottomPanelTabs.push({
        id: 'asset-browser',
        title: 'Assets',
        content: <PanelTab panelType={PanelType.AssetBrowser} />,
        closable: false
      });
    }
    
    if (visiblePanels.find(p => p.id === 'console')) {
      bottomPanelTabs.push({
        id: 'console',
        title: 'Console',
        content: <PanelTab panelType={PanelType.Console} />,
        closable: false
      });
    }

    return {
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
                tabs: centerPanelTabs
              },
              // Bottom panels (conditionally rendered)
              ...(bottomPanelTabs.length > 0 ? [{
                size: 250,
                tabs: bottomPanelTabs
              }] : [])
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
    };
  }, [visiblePanels]);


  return (
    <div 
      className={`${styles.dockLayoutContainer} ${className || ''}`}
      style={style}
    >
      <RCDockLayout 
        key={`dock-layout-${visiblePanels.map(p => p.id).join('-')}`}
        defaultLayout={dockLayoutData}
        style={{ height: '100%' }}
      />
    </div>
  );
};