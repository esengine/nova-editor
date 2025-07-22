/**
 * Scene View Panel - 3D viewport for scene editing
 * 场景视图面板 - 用于场景编辑的3D视口
 */

import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Bounds } from '@react-three/drei';
import { Button, Space, Tooltip } from 'antd';
import {
  BorderOutlined,
  CompressOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { TransformComponent, MeshRendererComponent, EditorMetadataComponent } from '../../../ecs';

/**
 * Scene objects component - renders the actual 3D content
 * 场景对象组件 - 渲染实际的3D内容
 */
const SceneObjects: React.FC = () => {
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const selectEntity = useEditorStore(state => state.selectEntity);
  
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

  return (
    <>
      {objects.map((obj: any) => {
        const isSelected = selectedEntities.includes(obj.id as number);
        
        // Choose geometry based on component type
        const renderGeometry = () => {
          switch (obj.geometryType) {
            case 'sphere':
              return <sphereGeometry args={[0.5, 16, 16]} />;
            case 'plane':
              return <planeGeometry args={[1, 1]} />;
            default:
              return <boxGeometry args={[1, 1, 1]} />;
          }
        };
        
        const renderSelectionOutline = () => {
          switch (obj.geometryType) {
            case 'sphere':
              return <sphereGeometry args={[0.55, 16, 16]} />;
            case 'plane':
              return <planeGeometry args={[1.1, 1.1]} />;
            default:
              return <boxGeometry args={[1.1, 1.1, 1.1]} />;
          }
        };
        
        return (
          <mesh
            key={obj.id}
            position={obj.position}
            scale={obj.scale || [1, 1, 1]}
            rotation={obj.rotation ? [obj.rotation[0] * Math.PI / 180, obj.rotation[1] * Math.PI / 180, obj.rotation[2] * Math.PI / 180] : [0, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              selectEntity(obj.id as number);
            }}
          >
            {renderGeometry()}
            <meshStandardMaterial 
              color={obj.color} 
              wireframe={isSelected || !obj.hasRenderer}
              transparent={isSelected}
              opacity={isSelected ? 0.8 : (obj.hasRenderer ? 1 : 0.5)}
            />
            
            {/* Selection outline */}
            {isSelected && (
              <mesh>
                {renderSelectionOutline()}
                <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.3} />
              </mesh>
            )}
            
            {/* Entity name label (optional) */}
            {isSelected && (
              <mesh position={[0, obj.scale[1] + 0.5, 0]}>
                {/* Text rendering would require additional setup */}
              </mesh>
            )}
          </mesh>
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
            <SceneObjects />
          </Bounds>
          
          {/* Controls */}
          <OrbitControls
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
        color: '#ccc'
      }}>
        Camera: Press mouse to navigate | Objects: Click to select
      </div>
    </div>
  );
};