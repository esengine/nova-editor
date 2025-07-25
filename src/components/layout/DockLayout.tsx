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
import { InspectorPanel } from '../panels';
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
  
  // State to trigger re-calculation on window resize
  const [windowDimensions, setWindowDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Calculate responsive panel sizes based on viewport dimensions
  const calculatePanelSize = React.useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Use percentage-based sizing that adapts to screen size and DPI
    const leftPanelSize = Math.max(120, Math.min(160, viewportWidth * 0.04)); // 4% of viewport, min 120px, max 160px
    const rightPanelSize = Math.max(120, Math.min(180, viewportWidth * 0.05)); // 5% of viewport, min 120px, max 180px
    
    // Calculate console panel height based on viewport height and DPI
    // Use smaller percentage for console to give more space to scene
    const consoleHeight = Math.max(150, Math.min(300, viewportHeight * 0.15)); // 15% of viewport height, min 150px, max 300px
    
    return { leftPanelSize, rightPanelSize, consoleHeight };
  }, []);

  const { leftPanelSize, rightPanelSize, consoleHeight } = calculatePanelSize();

  // Listen for window resize events
  React.useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            size: leftPanelSize,
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
                size: consoleHeight,
                tabs: bottomPanelTabs
              }] : [])
            ]
          },
          // Right panel group
          {
            mode: 'vertical',
            size: rightPanelSize,
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
  }, [visiblePanels, leftPanelSize, rightPanelSize, consoleHeight, windowDimensions]);


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