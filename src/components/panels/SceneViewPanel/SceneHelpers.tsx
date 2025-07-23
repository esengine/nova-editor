/**
 * Scene helper components for visual aids
 * 场景辅助组件，用于视觉辅助
 */

import React from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';

/**
 * World axis helper component
 * 世界坐标轴辅助组件
 */
export const WorldAxis: React.FC<{ size?: number }> = ({ size = 2 }) => {
  return (
    <group>
      {/* X Axis - Red */}
      <Line
        points={[[0, 0, 0], [size, 0, 0]]}
        color="#ff0000"
        lineWidth={2}
      />
      <Text
        position={[size + 0.2, 0, 0]}
        fontSize={0.2}
        color="#ff0000"
        anchorX="left"
      >
        X
      </Text>
      
      {/* Y Axis - Green */}
      <Line
        points={[[0, 0, 0], [0, size, 0]]}
        color="#00ff00"
        lineWidth={2}
      />
      <Text
        position={[0, size + 0.2, 0]}
        fontSize={0.2}
        color="#00ff00"
        anchorY="bottom"
      >
        Y
      </Text>
      
      {/* Z Axis - Blue */}
      <Line
        points={[[0, 0, 0], [0, 0, size]]}
        color="#0000ff"
        lineWidth={2}
      />
      <Text
        position={[0, 0, size + 0.2]}
        fontSize={0.2}
        color="#0000ff"
        anchorX="center"
      >
        Z
      </Text>
    </group>
  );
};

/**
 * Selection box component
 * 选择框组件
 */
export const SelectionBox: React.FC<{
  object: THREE.Object3D;
  color?: string;
}> = ({ object, color = '#ffff00' }) => {
  const [box] = React.useState(() => new THREE.Box3());
  const [size] = React.useState(() => new THREE.Vector3());
  const [center] = React.useState(() => new THREE.Vector3());

  React.useEffect(() => {
    box.setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
  }, [object, box, size, center]);

  return (
    <lineSegments position={center}>
      <edgesGeometry args={[new THREE.BoxGeometry(size.x, size.y, size.z)]} />
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
};

/**
 * Ground plane component with improved visuals
 * 改进视觉效果的地面平面组件
 */
export const GroundPlane: React.FC<{
  size?: number;
  visible?: boolean;
}> = ({ size = 50, visible = true }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      visible={visible}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#1a1a1a"
        roughness={0.8}
        metalness={0.2}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
};

/**
 * Light helper visualization
 * 光源辅助可视化
 */
export const LightHelpers: React.FC<{
  visible?: boolean;
}> = ({ visible = true }) => {
  const directionalLightRef = React.useRef<THREE.DirectionalLight>(null);
  
  return (
    <group visible={visible}>
      <directionalLight
        ref={directionalLightRef}
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {directionalLightRef.current && (
        <directionalLightHelper args={[directionalLightRef.current, 1]} />
      )}
    </group>
  );
};

/**
 * Measurement tool for displaying distances
 * 测量工具，用于显示距离
 */
export const MeasurementTool: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  visible?: boolean;
}> = ({ start, end, visible = true }) => {
  const distance = start.distanceTo(end);
  const midPoint = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);

  if (!visible) return null;

  return (
    <group>
      <Line
        points={[start.toArray(), end.toArray()]}
        color="#00ffff"
        lineWidth={2}
        dashed
        dashScale={10}
      />
      <Text
        position={midPoint}
        fontSize={0.2}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        {distance.toFixed(2)}m
      </Text>
    </group>
  );
};

/**
 * Stats overlay component for performance monitoring
 * 性能监控的统计叠加组件
 */
export interface StatsOverlayProps {
  fps: number;
  frameTime: number;
  entityCount: number;
  systemCount: number;
  triangleCount?: number;
  drawCalls?: number;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  fps,
  frameTime,
  entityCount,
  systemCount,
  triangleCount = 0,
  drawCalls = 0
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      left: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#ccc',
      fontFamily: 'monospace',
      minWidth: '200px',
      pointerEvents: 'none'
    }}>
      <div style={{ color: '#4CAF50', marginBottom: '4px' }}>
        Performance
      </div>
      <div>FPS: <span style={{ color: fps < 30 ? '#f44336' : '#4CAF50' }}>{fps}</span></div>
      <div>Frame Time: {frameTime}ms</div>
      <div>Draw Calls: {drawCalls}</div>
      <div>Triangles: {triangleCount.toLocaleString()}</div>
      <div style={{ marginTop: '8px', color: '#2196F3' }}>
        ECS Stats
      </div>
      <div>Entities: {entityCount}</div>
      <div>Systems: {systemCount}</div>
    </div>
  );
};

/**
 * Camera info overlay
 * 相机信息叠加
 */
export interface CameraInfoProps {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  zoom: number;
}

export const CameraInfoOverlay: React.FC<CameraInfoProps> = ({
  position,
  rotation,
  zoom
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '48px',
      right: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '11px',
      color: '#888',
      fontFamily: 'monospace',
      pointerEvents: 'none'
    }}>
      <div>Camera Position:</div>
      <div>X: {position.x.toFixed(2)} Y: {position.y.toFixed(2)} Z: {position.z.toFixed(2)}</div>
      <div style={{ marginTop: '4px' }}>Rotation:</div>
      <div>X: {(rotation.x * 180 / Math.PI).toFixed(1)}° Y: {(rotation.y * 180 / Math.PI).toFixed(1)}° Z: {(rotation.z * 180 / Math.PI).toFixed(1)}°</div>
      <div style={{ marginTop: '4px' }}>Zoom: {zoom.toFixed(2)}</div>
    </div>
  );
};