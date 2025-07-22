/**
 * Scene View Panel - 3D viewport for scene editing
 * 场景视图面板 - 用于场景编辑的3D视口
 */

import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Bounds, TransformControls } from '@react-three/drei';
import { Button, Space, Tooltip } from 'antd';
import * as THREE from 'three';
import {
  BorderOutlined,
  CompressOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { TransformComponent, MeshRendererComponent, EditorMetadataComponent } from '../../../ecs';

/**
 * Entity with transform controls
 * 带变换控制的实体
 */
interface EntityObjectProps {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  geometryType: string;
  isSelected: boolean;
  hasRenderer: boolean;
  onSelect: (id: number) => void;
  onTransformChange: (id: number, transform: any) => void;
  onDraggingChange?: (isDragging: boolean) => void;
}

const EntityObject: React.FC<EntityObjectProps> = ({
  id,
  position,
  rotation,
  scale,
  color,
  geometryType,
  isSelected,
  hasRenderer,
  onSelect,
  onTransformChange,
  onDraggingChange
}) => {
  const [mesh, setMesh] = React.useState<THREE.Mesh | null>(null);
  const [isDraggingThis, setIsDraggingThis] = React.useState(false);
  const transformRef = useRef<any>(null);

  // Update transform when props change, but not while dragging
  useEffect(() => {
    if (mesh && !isDraggingThis) {
      mesh.position.set(...position);
      mesh.rotation.set(
        rotation[0] * Math.PI / 180,
        rotation[1] * Math.PI / 180,
        rotation[2] * Math.PI / 180
      );
      mesh.scale.set(...scale);
    }
  }, [mesh, position, rotation, scale, isDraggingThis]);

  // Callback ref to capture the mesh
  const meshRefCallback = React.useCallback((meshNode: THREE.Mesh | null) => {
    setMesh(meshNode);
  }, []);

  const renderGeometry = () => {
    switch (geometryType) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 16, 16]} />;
      case 'plane':
        return <planeGeometry args={[1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const handleDragStart = React.useCallback(() => {
    setIsDraggingThis(true);
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleDragEnd = React.useCallback(() => {
    setIsDraggingThis(false);
    onDraggingChange?.(false);
    
    // Only update the store when dragging ends
    if (mesh) {
      onTransformChange(id, {
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { 
          x: mesh.rotation.x * 180 / Math.PI, 
          y: mesh.rotation.y * 180 / Math.PI, 
          z: mesh.rotation.z * 180 / Math.PI 
        },
        scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
      });
    }
  }, [mesh, id, onTransformChange, onDraggingChange]);

  return (
    <>
      {/* Always create a mesh for transform controls, visible only if has renderer */}
      <mesh
        ref={meshRefCallback}
        position={position}
        rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
        scale={scale}
        visible={hasRenderer}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        {renderGeometry()}
        <meshStandardMaterial 
          color={color} 
          transparent={isSelected}
          opacity={isSelected ? 0.8 : 1}
        />
      </mesh>
      
      {/* Always show transform controls for selected entities */}
      {isSelected && mesh && (
        <TransformControls
          ref={transformRef}
          object={mesh}
          mode="translate"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        />
      )}
    </>
  );
};

/**
 * Scene content component - manages dragging state
 * 场景内容组件 - 管理拖拽状态
 */
interface SceneContentProps {
  onDraggingChange: (isDragging: boolean) => void;
}

/**
 * Scene objects component - renders the actual 3D content
 * 场景对象组件 - 渲染实际的3D内容
 */
const SceneObjects: React.FC<SceneContentProps> = ({ onDraggingChange }) => {
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const selectEntity = useEditorStore(state => state.selectEntity);
  const updateComponentProperty = useEditorStore(state => state.updateComponentProperty);
  const forceUpdateTrigger = useEditorStore(state => state.forceUpdateTrigger);
  
  // Force re-render when components change
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    forceUpdate({});
  }, [forceUpdateTrigger]);
  
  // Get entities from NovaECS world
  // 从 NovaECS 世界获取实体
  const world = useEditorStore(state => state.world.instance);
  const objects = world ? world.entities
    .filter((entity: any) => entity.getComponent(TransformComponent))
    .map((entity: any) => {
      const transform = entity.getComponent(TransformComponent)!;
      const renderer = entity.getComponent(MeshRendererComponent);
      const metadata = entity.getComponent(EditorMetadataComponent);
      
      return {
        id: entity.id,
        name: metadata?.name || `Entity_${entity.id}`,
        position: [transform.position.x, transform.position.y, transform.position.z] as [number, number, number],
        scale: [transform.scale.x, transform.scale.y, transform.scale.z] as [number, number, number],
        rotation: [transform.rotation.x, transform.rotation.y, transform.rotation.z] as [number, number, number],
        // Determine color based on material or component type
        color: renderer?.material === 'EnemyMaterial' ? '#F44336' : 
               renderer?.material === 'GroundMaterial' ? '#795548' :
               renderer ? '#4CAF50' : '#CCCCCC', // Gray for entities without renderer
        // Determine geometry type
        geometryType: renderer?.meshType || 'box',
        hasRenderer: !!renderer
      };
    }) : [];

  // Handle transform changes
  const handleTransformChange = (entityId: number, transform: any) => {
    // Update position
    updateComponentProperty(entityId, 'Transform', 'position', transform.position);
    
    // Update rotation
    updateComponentProperty(entityId, 'Transform', 'rotation', transform.rotation);
    
    // Update scale
    updateComponentProperty(entityId, 'Transform', 'scale', transform.scale);
  };

  return (
    <>
      {/* Render all entities with transform component */}
      {objects.map((obj: any) => {
        const isSelected = selectedEntities.includes(obj.id as number);
        
        return (
          <EntityObject
            key={`entity-${obj.id}`}
            id={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            color={obj.color}
            geometryType={obj.geometryType}
            isSelected={isSelected}
            hasRenderer={obj.hasRenderer}
            onSelect={selectEntity}
            onTransformChange={handleTransformChange}
            onDraggingChange={onDraggingChange}
          />
        );
      })}
    </>
  );
};

/**
 * Camera controller component
 * 相机控制器组件
 */
const CameraController: React.FC = () => {
  const { camera } = useThree();
  const setCameraPosition = useEditorStore(state => state.setCameraPosition);
  const setCameraRotation = useEditorStore(state => state.setCameraRotation);

  useFrame(() => {
    // Update camera position in store
    setCameraPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
    
    setCameraRotation({
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    });
  });

  return null;
};

/**
 * Scene view controls toolbar
 * 场景视图控制工具栏
 */
const SceneViewControls: React.FC = () => {
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const toggleGrid = useEditorStore(state => state.toggleGrid);
  const toggleGizmos = useEditorStore(state => state.toggleGizmos);

  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '6px',
      padding: '4px'
    }}>
      <Space>
        <Tooltip title="Toggle Grid">
          <Button
            type={showGrid ? 'primary' : 'default'}
            size="small"
            icon={<BorderOutlined />}
            onClick={toggleGrid}
          />
        </Tooltip>
        <Tooltip title="Toggle Gizmos">
          <Button
            type={showGizmos ? 'primary' : 'default'}
            size="small"
            icon={<CompressOutlined />}
            onClick={toggleGizmos}
          />
        </Tooltip>
        <Tooltip title="View Settings">
          <Button
            size="small"
            icon={<SettingOutlined />}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

/**
 * Loading component for Suspense
 * Suspense的加载组件
 */
const SceneLoading: React.FC = () => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a'
  }}>
    <div style={{ textAlign: 'center', color: '#666' }}>
      <div>Loading 3D Scene...</div>
    </div>
  </div>
);

/**
 * Main SceneViewPanel component
 * 主场景视图面板组件
 */
export interface SceneViewPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export const SceneViewPanel: React.FC<SceneViewPanelProps> = ({ 
  style, 
  className 
}) => {
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const worldStats = useEditorStore(state => state.world.stats);
  const [isDragging, setIsDragging] = React.useState(false);
  const [renderStats, setRenderStats] = React.useState({ fps: 0, frameTime: 0 });
  const orbitControlsRef = useRef<any>(null);

  // Track render performance
  const frameTimeRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());

  React.useEffect(() => {
    const updateRenderStats = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameTimeRef.current.push(frameTime);
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift();
      }

      const averageFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
      const fps = Math.round(1000 / averageFrameTime);

      setRenderStats({ fps, frameTime: Math.round(averageFrameTime * 100) / 100 });
      requestAnimationFrame(updateRenderStats);
    };

    const frame = requestAnimationFrame(updateRenderStats);
    return () => cancelAnimationFrame(frame);
  }, []);

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
      
      <Suspense fallback={<SceneLoading />}>
        <Canvas
          camera={{
            position: [5, 5, 5],
            fov: 75
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            background: 'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)'
          }}
          onClick={(e) => {
            // Clear selection when clicking empty space
            if (e.target === e.currentTarget) {
              clearSelection();
            }
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-10, -10, -5]} intensity={0.2} />
          
          {/* Grid */}
          {showGrid && (
            <Grid
              position={[0, -0.5, 0]}
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#333333"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#555555"
              fadeDistance={25}
              fadeStrength={1}
            />
          )}
          
          {/* Scene Objects */}
          <Bounds fit clip observe margin={1.2}>
            <SceneObjects onDraggingChange={setIsDragging} />
          </Bounds>
          
          {/* Controls - disabled when dragging transform controls */}
          <OrbitControls
            ref={orbitControlsRef}
            enabled={!isDragging}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.5}
            panSpeed={0.5}
            maxPolarAngle={Math.PI * 0.8}
            minDistance={1}
            maxDistance={50}
          />
          
          {/* Camera Controller */}
          <CameraController />
          
          {/* Gizmo Helper */}
          {showGizmos && (
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport 
                axisColors={['#ff4757', '#2ed573', '#3742fa']} 
                labelColor="#ffffff"
              />
            </GizmoHelper>
          )}
        </Canvas>
      </Suspense>
      
      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#ccc',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div>Camera: Press mouse to navigate | Objects: Click to select</div>
        <div>
          Render: {renderStats.fps} FPS ({renderStats.frameTime}ms) | 
          ECS: {worldStats.entityCount} entities, {worldStats.systemCount} systems
        </div>
      </div>
    </div>
  );
};