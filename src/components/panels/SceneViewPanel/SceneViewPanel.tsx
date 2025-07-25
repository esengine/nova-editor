/**
 * Scene View Panel - 3D viewport for scene editing
 * 场景视图面板 - 用于场景编辑的3D视口
 */

import React, { useEffect, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  BorderOutlined,
  CompressOutlined,
  SettingOutlined,
  DragOutlined,
  ReloadOutlined,
  ExpandOutlined,
  EyeOutlined,
  GlobalOutlined,
  HomeOutlined,
  InfoOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { NovaThreeRenderer } from './NovaThreeRenderer';

/**
 * Scene View Toolbar Component
 * 场景视图工具栏组件
 */
const SceneViewToolbar: React.FC = () => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const showCameraInfo = useEditorStore(state => state.viewport.showCameraInfo);
  const transformMode = useEditorStore(state => state.viewport.transformMode);
  const snapEnabled = useEditorStore(state => state.viewport.snapEnabled);
  const viewMode = useEditorStore(state => state.viewport.viewMode);
  const toggleGrid = useEditorStore(state => state.toggleGrid);
  const toggleGizmos = useEditorStore(state => state.toggleGizmos);
  const toggleCameraInfo = useEditorStore(state => state.toggleCameraInfo);
  const setTransformMode = useEditorStore(state => state.setTransformMode);
  const toggleSnap = useEditorStore(state => state.toggleSnap);
  const setViewMode = useEditorStore(state => state.setViewMode);

  const isVisible = isHovered || isFocused;

  return (
    <div 
      style={{ 
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        padding: '8px',
        opacity: isVisible ? 1 : 0.3,
        transition: 'opacity 0.2s ease-in-out',
        background: isVisible ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        borderRadius: '0 0 8px 8px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <Space size="large">
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

        {/* View Mode Controls */}
        <Space.Compact>
          <Tooltip title="2D View">
            <Button
              type={viewMode === '2d' ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              size="small"
              onClick={() => setViewMode('2d')}
            >
              2D
            </Button>
          </Tooltip>
          <Tooltip title="3D View">
            <Button
              type={viewMode === '3d' ? 'primary' : 'default'}
              icon={<GlobalOutlined />}
              size="small"
              onClick={() => setViewMode('3d')}
            >
              3D
            </Button>
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
          <Tooltip title="Toggle Camera Info">
            <Button
              type={showCameraInfo ? 'primary' : 'default'}
              icon={<InfoOutlined />}
              size="small"
              onClick={toggleCameraInfo}
            />
          </Tooltip>
        </Space.Compact>
      </Space>
    </div>
  );
};

/**
 * Camera Position Indicator Component
 * 相机位置指示器组件
 */
const CameraPositionIndicator: React.FC = () => {
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });
  const viewMode = useEditorStore(state => state.viewport.viewMode);
  const showCameraInfo = useEditorStore(state => state.viewport.showCameraInfo);

  // Reset camera to default position
  const resetCamera = () => {
    const canvas = document.querySelector('[data-three-canvas]') as HTMLCanvasElement;
    if (canvas && (canvas as any).__threeRenderer) {
      const renderer = (canvas as any).__threeRenderer;
      if (renderer.camera) {
        // Reset camera position
        renderer.camera.position.set(5, 5, 5);
        renderer.camera.lookAt(0, 0, 0);
        
        // If orbit controls exist, reset them too
        const orbitControls = (canvas as any).__orbitControls;
        if (orbitControls) {
          orbitControls.target.set(0, 0, 0);
          orbitControls.update();
        }
      }
    }
  };

  // Subscribe to camera updates from the renderer
  useEffect(() => {
    if (!showCameraInfo) return; // Skip updates if not visible

    const updateCameraInfo = () => {
      // This will be called by the renderer when camera moves
      const canvas = document.querySelector('[data-three-canvas]') as HTMLCanvasElement;
      if (canvas && (canvas as any).__threeRenderer) {
        const renderer = (canvas as any).__threeRenderer;
        if (renderer.camera) {
          const pos = renderer.camera.position;
          const rot = renderer.camera.rotation;
          setCameraPosition({
            x: Math.round(pos.x * 100) / 100,
            y: Math.round(pos.y * 100) / 100,
            z: Math.round(pos.z * 100) / 100
          });
          setCameraRotation({
            x: Math.round(rot.x * 100) / 100,
            y: Math.round(rot.y * 100) / 100,
            z: Math.round(rot.z * 100) / 100
          });
        }
      }
    };

    // Update every frame
    const intervalId = setInterval(updateCameraInfo, 100);
    return () => clearInterval(intervalId);
  }, [showCameraInfo]);

  // Don't render if camera info is disabled
  if (!showCameraInfo) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '8px',
      left: '8px',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '4px' 
      }}>
        <span style={{ fontWeight: 'bold' }}>
          📷 Camera ({viewMode?.toUpperCase()})
        </span>
        <Button
          type="text"
          size="small"
          icon={<HomeOutlined />}
          onClick={resetCamera}
          style={{ 
            color: 'white', 
            border: 'none',
            padding: '0 4px',
            minWidth: 'auto',
            height: '16px'
          }}
          title="Reset Camera Position"
        />
      </div>
      <div>
        <strong>Position:</strong> ({cameraPosition.x}, {cameraPosition.y}, {cameraPosition.z})
      </div>
      <div>
        <strong>Rotation:</strong> ({cameraRotation.x}, {cameraRotation.y}, {cameraRotation.z})
      </div>
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
      <SceneViewToolbar />
      <NovaThreeRenderer />
      <CameraPositionIndicator />
    </div>
  );
};