/**
 * Custom gizmo components for object manipulation
 * 用于对象操作的自定义Gizmo组件
 */

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Line, Cone, Box, Sphere } from '@react-three/drei';
import type { TransformMode } from '../../../types';

/**
 * Custom transform gizmo with extended visuals
 * 增强视觉效果的自定义变换Gizmo
 */
export const CustomTransformGizmo: React.FC<{
  object: THREE.Object3D;
  mode: TransformMode;
  onTransform: (matrix: THREE.Matrix4) => void;
  size?: number;
}> = ({ object, mode, onTransform, size = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeAxis, setActiveAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const startPoint = useRef(new THREE.Vector3());
  const { camera, raycaster, gl } = useThree();

  const handlePointerDown = (axis: 'x' | 'y' | 'z') => (event: any) => {
    event.stopPropagation();
    setIsDragging(true);
    setActiveAxis(axis);
    
    // Store initial position
    raycaster.setFromCamera(event.pointer, camera);
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      object.position
    );
    raycaster.ray.intersectPlane(plane, startPoint.current);
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging || !activeAxis) return;

    raycaster.setFromCamera(event.pointer, camera);
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      object.position
    );
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    const delta = intersection.sub(startPoint.current);
    
    // Apply transformation based on mode and axis
    if (mode === 'translate') {
      const movement = new THREE.Vector3();
      movement[activeAxis] = delta[activeAxis];
      object.position.add(movement);
    } else if (mode === 'scale') {
      const scale = 1 + delta[activeAxis] * 0.1;
      object.scale[activeAxis] *= scale;
    } else if (mode === 'rotate') {
      const rotation = delta[activeAxis] * 0.1;
      object.rotation[activeAxis] += rotation;
    }
    
    startPoint.current.copy(intersection);
    onTransform(object.matrix);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setActiveAxis(null);
  };

  React.useEffect(() => {
    if (isDragging) {
      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        gl.domElement.removeEventListener('pointermove', handlePointerMove);
        gl.domElement.removeEventListener('pointerup', handlePointerUp);
      };
    }
    return undefined;
  }, [isDragging, activeAxis]);

  return (
    <group position={object.position}>
      {/* X Axis */}
      <group onPointerDown={handlePointerDown('x')}>
        <Line
          points={[[0, 0, 0], [size, 0, 0]]}
          color={activeAxis === 'x' ? '#ffff00' : '#ff0000'}
          lineWidth={activeAxis === 'x' ? 3 : 2}
        />
        {mode === 'translate' && (
          <Cone
            position={[size, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            args={[0.1, 0.3, 8]}
            material-color={activeAxis === 'x' ? '#ffff00' : '#ff0000'}
          />
        )}
        {mode === 'scale' && (
          <Box
            position={[size, 0, 0]}
            args={[0.2, 0.2, 0.2]}
            material-color={activeAxis === 'x' ? '#ffff00' : '#ff0000'}
          />
        )}
      </group>

      {/* Y Axis */}
      <group onPointerDown={handlePointerDown('y')}>
        <Line
          points={[[0, 0, 0], [0, size, 0]]}
          color={activeAxis === 'y' ? '#ffff00' : '#00ff00'}
          lineWidth={activeAxis === 'y' ? 3 : 2}
        />
        {mode === 'translate' && (
          <Cone
            position={[0, size, 0]}
            args={[0.1, 0.3, 8]}
            material-color={activeAxis === 'y' ? '#ffff00' : '#00ff00'}
          />
        )}
        {mode === 'scale' && (
          <Box
            position={[0, size, 0]}
            args={[0.2, 0.2, 0.2]}
            material-color={activeAxis === 'y' ? '#ffff00' : '#00ff00'}
          />
        )}
      </group>

      {/* Z Axis */}
      <group onPointerDown={handlePointerDown('z')}>
        <Line
          points={[[0, 0, 0], [0, 0, size]]}
          color={activeAxis === 'z' ? '#ffff00' : '#0000ff'}
          lineWidth={activeAxis === 'z' ? 3 : 2}
        />
        {mode === 'translate' && (
          <Cone
            position={[0, 0, size]}
            rotation={[Math.PI / 2, 0, 0]}
            args={[0.1, 0.3, 8]}
            material-color={activeAxis === 'z' ? '#ffff00' : '#0000ff'}
          />
        )}
        {mode === 'scale' && (
          <Box
            position={[0, 0, size]}
            args={[0.2, 0.2, 0.2]}
            material-color={activeAxis === 'z' ? '#ffff00' : '#0000ff'}
          />
        )}
      </group>

      {/* Center sphere for uniform scaling */}
      {mode === 'scale' && (
        <Sphere
          args={[0.15]}
          material-color="#ffffff"
          material-opacity={0.8}
          material-transparent
        />
      )}
    </group>
  );
};

/**
 * Rotation gizmo rings
 * 旋转Gizmo环
 */
export const RotationGizmo: React.FC<{
  object: THREE.Object3D;
  onRotate: (rotation: THREE.Euler) => void;
  size?: number;
}> = ({ object, size = 1 }) => {
  // TODO: Implement rotation functionality
  const [activeAxis] = useState<'x' | 'y' | 'z' | null>(null);
  // const [isDragging, setIsDragging] = useState(false);
  // const startAngle = useRef(0);
  // const { camera, raycaster, pointer } = useThree();

  const createRing = (axis: 'x' | 'y' | 'z', color: string) => {
    const geometry = new THREE.TorusGeometry(size, 0.05, 8, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: activeAxis === axis ? '#ffff00' : color,
      opacity: activeAxis === axis ? 1 : 0.7,
      transparent: true
    });
    
    const ring = new THREE.Mesh(geometry, material);
    
    // Rotate ring to align with axis
    if (axis === 'x') ring.rotation.y = Math.PI / 2;
    else if (axis === 'y') ring.rotation.x = Math.PI / 2;
    
    return ring;
  };

  return (
    <group position={object.position}>
      <primitive object={createRing('x', '#ff0000')} />
      <primitive object={createRing('y', '#00ff00')} />
      <primitive object={createRing('z', '#0000ff')} />
    </group>
  );
};

/**
 * Bounding box gizmo
 * 边界框Gizmo
 */
export const BoundingBoxGizmo: React.FC<{
  object: THREE.Object3D;
  color?: string;
  showDimensions?: boolean;
}> = ({ object, color = '#ffffff', showDimensions = true }) => {
  const [box] = useState(() => new THREE.Box3());
  const [size] = useState(() => new THREE.Vector3());
  const [center] = useState(() => new THREE.Vector3());

  useFrame(() => {
    box.setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
  });

  return (
    <group>
      <lineSegments position={center}>
        <edgesGeometry args={[new THREE.BoxGeometry(size.x, size.y, size.z)]} />
        <lineBasicMaterial color={color} opacity={0.5} transparent />
      </lineSegments>
      
      {showDimensions && (
        <>
          <Text
            position={[center.x + size.x / 2 + 0.5, center.y, center.z]}
            fontSize={0.15}
            color={color}
          >
            {size.x.toFixed(2)}
          </Text>
          <Text
            position={[center.x, center.y + size.y / 2 + 0.5, center.z]}
            fontSize={0.15}
            color={color}
          >
            {size.y.toFixed(2)}
          </Text>
          <Text
            position={[center.x, center.y, center.z + size.z / 2 + 0.5]}
            fontSize={0.15}
            color={color}
          >
            {size.z.toFixed(2)}
          </Text>
        </>
      )}
    </group>
  );
};

/**
 * Pivot point gizmo
 * 轴心点Gizmo
 */
export const PivotGizmo: React.FC<{
  position: THREE.Vector3;
  onMove: (position: THREE.Vector3) => void;
  visible?: boolean;
}> = ({ position, visible = true }) => {
  // TODO: Implement position manipulation
  const [isDragging, setIsDragging] = useState(false);
  const sphereRef = useRef<THREE.Mesh>(null);

  if (!visible) return null;

  return (
    <group position={position}>
      <Sphere
        ref={sphereRef}
        args={[0.1]}
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDragging(true);
        }}
        onPointerUp={() => setIsDragging(false)}
      >
        <meshBasicMaterial 
          color={isDragging ? '#ffff00' : '#ff00ff'} 
          opacity={0.8}
          transparent
        />
      </Sphere>
      
      {/* Axis indicators */}
      <Line points={[[-0.3, 0, 0], [0.3, 0, 0]]} color="#ff0000" lineWidth={1} />
      <Line points={[[0, -0.3, 0], [0, 0.3, 0]]} color="#00ff00" lineWidth={1} />
      <Line points={[[0, 0, -0.3], [0, 0, 0.3]]} color="#0000ff" lineWidth={1} />
    </group>
  );
};

// Missing import for Text component
const Text: React.FC<any> = () => null; // Placeholder - should import from @react-three/drei