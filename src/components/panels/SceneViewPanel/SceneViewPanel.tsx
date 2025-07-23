/**
 * Scene View Panel - 3D viewport for scene editing
 * 场景视图面板 - 用于场景编辑的3D视口
 */

import React, { useEffect } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  BorderOutlined,
  CompressOutlined,
  SettingOutlined,
  DragOutlined,
  ReloadOutlined,
  ExpandOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { NovaThreeRenderer } from './NovaThreeRenderer';

/**
 * Scene View Controls Component
 * 场景视图控制组件
 */
const SceneViewControls: React.FC = () => {
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const transformMode = useEditorStore(state => state.viewport.transformMode);
  const snapEnabled = useEditorStore(state => state.viewport.snapEnabled);
  const toggleGrid = useEditorStore(state => state.toggleGrid);
  const toggleGizmos = useEditorStore(state => state.toggleGizmos);
  const setTransformMode = useEditorStore(state => state.setTransformMode);
  const toggleSnap = useEditorStore(state => state.toggleSnap);

  return (
    <div style={{ 
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Transform Mode Controls */}
      <Space.Compact>
        <Tooltip title="Move (W)">
          <Button
            type={transformMode === 'translate' ? 'primary' : 'default'}
            icon={<DragOutlined />}
            size="small"
            onClick={() => setTransformMode('translate')}
          />
        </Tooltip>
        <Tooltip title="Rotate (E)">
          <Button
            type={transformMode === 'rotate' ? 'primary' : 'default'}
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => setTransformMode('rotate')}
          />
        </Tooltip>
        <Tooltip title="Scale (R)">
          <Button
            type={transformMode === 'scale' ? 'primary' : 'default'}
            icon={<ExpandOutlined />}
            size="small"
            onClick={() => setTransformMode('scale')}
          />
        </Tooltip>
      </Space.Compact>

      {/* View Controls */}
      <Space.Compact>
        <Tooltip title="Toggle Grid">
          <Button
            type={showGrid ? 'primary' : 'default'}
            icon={<BorderOutlined />}
            size="small"
            onClick={toggleGrid}
          />
        </Tooltip>
        <Tooltip title="Toggle Gizmos">
          <Button
            type={showGizmos ? 'primary' : 'default'}
            icon={<CompressOutlined />}
            size="small"
            onClick={toggleGizmos}
          />
        </Tooltip>
        <Tooltip title="Toggle Snap">
          <Button
            type={snapEnabled ? 'primary' : 'default'}
            icon={<SettingOutlined />}
            size="small"
            onClick={toggleSnap}
          />
        </Tooltip>
      </Space.Compact>
    </div>
  );
};

/**
 * Scene View Panel Props
 */
export interface SceneViewPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Scene View Panel Component
 * 场景视图面板组件
 */
export const SceneViewPanel: React.FC<SceneViewPanelProps> = ({ 
  style, 
  className 
}) => {
  const snapEnabled = useEditorStore(state => state.viewport.snapEnabled);
  const setTransformMode = useEditorStore(state => state.setTransformMode);
  const toggleSnap = useEditorStore(state => state.toggleSnap);

  // Handle keyboard shortcuts for transform modes and snap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if target is an input
      if ((event.target as HTMLElement)?.tagName === 'INPUT' || 
          (event.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      // Handle Ctrl key for temporary snap toggle
      if (event.ctrlKey && event.key === 'Control') {
        event.preventDefault();
        if (!snapEnabled) {
          toggleSnap();
        }
        return;
      }

      // Only handle transform mode shortcuts if no modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

      switch (event.key.toLowerCase()) {
        case 'w':
          event.preventDefault();
          setTransformMode('translate');
          break;
        case 'e':
          event.preventDefault();
          setTransformMode('rotate');
          break;
        case 'r':
          event.preventDefault();
          setTransformMode('scale');
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle Ctrl key release for temporary snap toggle
      if (event.key === 'Control' && snapEnabled) {
        // Only disable snap if it was temporarily enabled
        toggleSnap();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [snapEnabled, setTransformMode, toggleSnap]);

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #303030',
        borderRadius: '6px',
        overflow: 'hidden',
        ...style
      }}
      className={className}
    >
      <SceneViewControls />
      <NovaThreeRenderer />
    </div>
  );
};