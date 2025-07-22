/**
 * Dockable panel layout system
 * 可停靠面板布局系统
 */

import React, { useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useEditorStore } from '../../stores/editorStore';
import { PanelType } from '../../types';
import { HierarchyPanel } from '../panels/HierarchyPanel';
import { SceneViewPanel } from '../panels/SceneViewPanel';
import { InspectorPanel } from '../panels/InspectorPanel';
import { AssetBrowserPanel } from '../panels/AssetBrowserPanel';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Panel wrapper component with title bar
 * 带标题栏的面板包装组件
 */
interface PanelWrapperProps {
  title: string;
  children: React.ReactNode;
  onClose?: (() => void) | null;
  theme: any;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({ 
  title, 
  children, 
  onClose,
  theme 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '6px',
      overflow: 'hidden'
    }}>
      {/* Panel Title Bar */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'move', // Indicates draggable
        userSelect: 'none'
      }} className="drag-handle">
        <span>{title}</span>
        {onClose && (
          <button
            onClick={() => onClose()}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Panel Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

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
      return <div style={{ padding: '16px', color: '#666' }}>Console panel coming soon...</div>;
    default:
      return <div style={{ padding: '16px', color: '#666' }}>Unknown panel type</div>;
  }
};

/**
 * Main dockable layout component
 * 主可停靠布局组件
 */
export interface DockLayoutProps {
  style?: React.CSSProperties;
  className?: string;
}

export const DockLayout: React.FC<DockLayoutProps> = ({ 
  style, 
  className 
}) => {
  const layout = useEditorStore(state => state.layout);
  const theme = useEditorStore(state => state.theme);
  const updateLayout = useEditorStore(state => state.updateLayout);
  const togglePanelVisibility = useEditorStore(state => state.togglePanelVisibility);

  // Convert panel config to grid layout format
  const gridLayouts = useMemo(() => {
    const layouts = {
      lg: layout.panels
        .filter(panel => panel.visible)
        .map((panel, index) => ({
          i: panel.id,
          x: panel.gridPosition?.x || (index % 4) * 3,
          y: panel.gridPosition?.y || Math.floor(index / 4) * 4,
          w: panel.gridPosition?.w || 3,
          h: panel.gridPosition?.h || 4,
          minW: Math.ceil((panel.minWidth || 200) / 100),
          minH: Math.ceil((panel.minHeight || 200) / 50)
        }))
    };
    
    // Copy lg layout to other breakpoints for now
    return {
      lg: layouts.lg,
      md: layouts.lg,
      sm: layouts.lg,
      xs: layouts.lg,
      xxs: layouts.lg
    };
  }, [layout.panels]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    // Update panel positions in store
    const updatedPanels = layout.panels.map(panel => {
      const layoutItem = newLayout.find(item => item.i === panel.id);
      if (layoutItem) {
        return {
          ...panel,
          gridPosition: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return panel;
    });

    updateLayout({ panels: updatedPanels });
  }, [layout.panels, updateLayout]);

  // Handle panel close
  const handlePanelClose = useCallback((panelId: string) => {
    togglePanelVisibility(panelId);
  }, [togglePanelVisibility]);

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
      <ResponsiveGridLayout
        className="layout"
        layouts={gridLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={50}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
        style={{ backgroundColor: theme.colors.background }}
      >
        {layout.panels
          .filter(panel => panel.visible)
          .map(panel => (
            <div key={panel.id}>
              <PanelWrapper
                title={panel.title}
                onClose={panel.closeable !== false ? () => handlePanelClose(panel.id) : null}
                theme={theme}
              >
                {renderPanelContent(panel.type)}
              </PanelWrapper>
            </div>
          ))
        }
      </ResponsiveGridLayout>
    </div>
  );
};