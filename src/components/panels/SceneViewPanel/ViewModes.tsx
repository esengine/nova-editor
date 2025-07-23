/**
 * View mode management for different camera perspectives
 * 不同相机视角的视图模式管理
 */

import React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Select, Space, Button, Tooltip } from 'antd';
import {
  EyeOutlined,
  BorderOutlined,
  AppstoreOutlined,
  CameraOutlined
} from '@ant-design/icons';

/**
 * View mode types
 * 视图模式类型
 */
export enum ViewMode {
  Perspective = 'perspective',
  Top = 'top',
  Front = 'front',
  Right = 'right',
  Left = 'left',
  Back = 'back',
  Bottom = 'bottom'
}

/**
 * Camera preset configurations
 * 相机预设配置
 */
export const CAMERA_PRESETS = {
  [ViewMode.Perspective]: {
    position: [5, 5, 5],
    rotation: [0, 0, 0],
    fov: 75,
    orthographic: false
  },
  [ViewMode.Top]: {
    position: [0, 10, 0],
    rotation: [-Math.PI / 2, 0, 0],
    orthographic: true,
    zoom: 5
  },
  [ViewMode.Front]: {
    position: [0, 0, 10],
    rotation: [0, 0, 0],
    orthographic: true,
    zoom: 5
  },
  [ViewMode.Right]: {
    position: [10, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    orthographic: true,
    zoom: 5
  },
  [ViewMode.Left]: {
    position: [-10, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    orthographic: true,
    zoom: 5
  },
  [ViewMode.Back]: {
    position: [0, 0, -10],
    rotation: [0, Math.PI, 0],
    orthographic: true,
    zoom: 5
  },
  [ViewMode.Bottom]: {
    position: [0, -10, 0],
    rotation: [Math.PI / 2, 0, 0],
    orthographic: true,
    zoom: 5
  }
};

/**
 * View mode selector component
 * 视图模式选择器组件
 */
export const ViewModeSelector: React.FC<{
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}> = ({ currentMode, onModeChange }) => {
  return (
    <Select
      value={currentMode}
      onChange={onModeChange}
      size="small"
      style={{ width: 120 }}
    >
      <Select.Option value={ViewMode.Perspective}>
        <EyeOutlined /> Perspective
      </Select.Option>
      <Select.Option value={ViewMode.Top}>
        <BorderOutlined /> Top
      </Select.Option>
      <Select.Option value={ViewMode.Front}>
        <BorderOutlined /> Front
      </Select.Option>
      <Select.Option value={ViewMode.Right}>
        <BorderOutlined /> Right
      </Select.Option>
      <Select.Option value={ViewMode.Left}>
        <BorderOutlined /> Left
      </Select.Option>
      <Select.Option value={ViewMode.Back}>
        <BorderOutlined /> Back
      </Select.Option>
      <Select.Option value={ViewMode.Bottom}>
        <BorderOutlined /> Bottom
      </Select.Option>
    </Select>
  );
};

/**
 * Multi-viewport layout component
 * 多视口布局组件
 */
export const MultiViewport: React.FC<{
  onViewportClick: (viewport: ViewMode) => void;
  activeViewport: ViewMode;
}> = ({ onViewportClick, activeViewport }) => {
  const viewports = [
    { mode: ViewMode.Perspective, position: { top: 0, left: 0 } },
    { mode: ViewMode.Top, position: { top: 0, right: 0 } },
    { mode: ViewMode.Front, position: { bottom: 0, left: 0 } },
    { mode: ViewMode.Right, position: { bottom: 0, right: 0 } }
  ];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: '2px',
      backgroundColor: '#1a1a1a'
    }}>
      {viewports.map(({ mode }) => (
        <div
          key={mode}
          style={{
            position: 'relative',
            border: activeViewport === mode ? '2px solid #1890ff' : '1px solid #303030',
            cursor: 'pointer'
          }}
          onClick={() => onViewportClick(mode)}
        >
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#fff'
          }}>
            {mode}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Camera controller hook for view modes
 * 视图模式的相机控制器钩子
 */
export const useViewModeCamera = (mode: ViewMode) => {
  const { camera } = useThree();
  const [isOrthographic, setIsOrthographic] = React.useState(false);

  React.useEffect(() => {
    const preset = CAMERA_PRESETS[mode];
    
    // Animate camera transition
    const startPosition = camera.position.clone();
    const startRotation = camera.rotation.clone();
    const targetPosition = new THREE.Vector3(...preset.position);
    
    let progress = 0;
    const animationDuration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      progress = Math.min((Date.now() - startTime) / animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      
      if (preset.rotation) {
        camera.rotation.x = THREE.MathUtils.lerp(startRotation.x, preset.rotation[0], easeProgress);
        camera.rotation.y = THREE.MathUtils.lerp(startRotation.y, preset.rotation[1], easeProgress);
        camera.rotation.z = THREE.MathUtils.lerp(startRotation.z, preset.rotation[2], easeProgress);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Switch camera type if needed
        setIsOrthographic(preset.orthographic || false);
      }
    };

    animate();
  }, [mode, camera]);

  return { isOrthographic };
};

/**
 * Focus on selected objects
 * 聚焦选中的对象
 */
export const useFocusSelection = () => {
  const { camera, controls } = useThree();
  
  const focusOnObjects = React.useCallback((objects: THREE.Object3D[]) => {
    if (objects.length === 0) return;

    // Calculate bounding box of all selected objects
    const box = new THREE.Box3();
    objects.forEach(obj => {
      box.expandByObject(obj);
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    // Animate camera to focus on selection
    const startPosition = camera.position.clone();
    const targetPosition = center.clone().add(
      new THREE.Vector3(distance, distance, distance).normalize().multiplyScalar(distance)
    );

    let progress = 0;
    const animationDuration = 300;
    const startTime = Date.now();

    const animate = () => {
      progress = Math.min((Date.now() - startTime) / animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      camera.lookAt(center);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (controls) {
        // Update controls target
        (controls as any).target.copy(center);
        (controls as any).update();
      }
    };

    animate();
  }, [camera, controls]);

  return focusOnObjects;
};

/**
 * View manipulation toolbar
 * 视图操作工具栏
 */
export const ViewToolbar: React.FC<{
  onHome: () => void;
  onFocusSelection: () => void;
  onToggleProjection: () => void;
  isOrthographic: boolean;
}> = ({ onHome, onFocusSelection, onToggleProjection, isOrthographic }) => {
  return (
    <Space>
      <Tooltip title="Reset View">
        <Button
          size="small"
          icon={<CameraOutlined />}
          onClick={onHome}
        />
      </Tooltip>
      <Tooltip title="Focus Selection (F)">
        <Button
          size="small"
          icon={<BorderOutlined />}
          onClick={onFocusSelection}
        />
      </Tooltip>
      <Tooltip title={isOrthographic ? "Switch to Perspective" : "Switch to Orthographic"}>
        <Button
          size="small"
          icon={<AppstoreOutlined />}
          onClick={onToggleProjection}
        />
      </Tooltip>
    </Space>
  );
};