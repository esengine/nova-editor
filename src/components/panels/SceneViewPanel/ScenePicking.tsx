/**
 * Scene picking system with visual feedback
 * 场景拾取系统，带视觉反馈
 */

import React, { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';

/**
 * Hover highlight component
 * 悬停高亮组件
 */
export const HoverHighlight: React.FC<{
  object: THREE.Object3D | null;
  color?: string;
}> = ({ object, color = '#ffff00' }) => {
  const [box] = React.useState(() => new THREE.Box3());
  const [size] = React.useState(() => new THREE.Vector3());
  const [center] = React.useState(() => new THREE.Vector3());

  React.useEffect(() => {
    if (object) {
      box.setFromObject(object);
      box.getSize(size);
      box.getCenter(center);
    }
  }, [object, box, size, center]);

  if (!object) return null;

  return (
    <lineSegments position={center}>
      <edgesGeometry args={[new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05)]} />
      <lineBasicMaterial color={color} opacity={0.5} transparent />
    </lineSegments>
  );
};

/**
 * Multi-select box component
 * 多选框组件
 */
export const MultiSelectBox: React.FC<{
  startPoint: THREE.Vector2 | null;
  endPoint: THREE.Vector2 | null;
  onSelectionComplete: (selected: THREE.Object3D[]) => void;
}> = ({ startPoint, endPoint, onSelectionComplete }) => {
  const { camera, scene } = useThree();

  React.useEffect(() => {
    if (!startPoint || !endPoint) return;

    // TODO: Implement selection box functionality
    // Calculate selection frustum
    // const min = new THREE.Vector2(
    //   Math.min(startPoint.x, endPoint.x),
    //   Math.min(startPoint.y, endPoint.y)
    // );
    // const max = new THREE.Vector2(
    //   Math.max(startPoint.x, endPoint.x),
    //   Math.max(startPoint.y, endPoint.y)
    // );

    // Create frustum from selection box
    // const frustum = new THREE.Frustum();

    // Find objects within selection
    const selected: THREE.Object3D[] = [];
    // TODO: Implement frustum-based selection
    // scene.traverse((object) => {
    //   if (object.userData.entityId !== undefined) {
    //     const box = new THREE.Box3().setFromObject(object);
    //     if (frustum.intersectsBox(box)) {
    //       selected.push(object);
    //     }
    //   }
    // });

    onSelectionComplete(selected);
  }, [startPoint, endPoint, camera, scene, onSelectionComplete]);

  if (!startPoint || !endPoint) return null;

  // Calculate 2D selection box overlay
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1px solid #00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
};

/**
 * Click to select handler with visual feedback
 * 带视觉反馈的点击选择处理器
 */
export const useScenePicking = () => {
  const [hoveredObject, setHoveredObject] = React.useState<THREE.Object3D | null>(null);
  const [selectionStart, setSelectionStart] = React.useState<THREE.Vector2 | null>(null);
  const [selectionEnd, setSelectionEnd] = React.useState<THREE.Vector2 | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (event.object.userData.entityId !== undefined) {
      setHoveredObject(event.object);
    } else {
      setHoveredObject(null);
    }

    if (isBoxSelecting && selectionStart) {
      setSelectionEnd(new THREE.Vector2(event.clientX, event.clientY));
    }
  }, [isBoxSelecting, selectionStart]);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (event.button === 0) { // Left click
      setSelectionStart(new THREE.Vector2(event.clientX, event.clientY));
      setIsBoxSelecting(true);
    }
  }, []);

  const handlePointerUp = useCallback((_event: ThreeEvent<PointerEvent>) => {
    if (isBoxSelecting) {
      setIsBoxSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isBoxSelecting]);

  const handlePointerLeave = useCallback(() => {
    setHoveredObject(null);
  }, []);

  return {
    hoveredObject,
    selectionStart,
    selectionEnd,
    isBoxSelecting,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave
    }
  };
};

/**
 * Ray visualization for debugging
 * 用于调试的射线可视化
 */
export const RayVisualizer: React.FC<{
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length?: number;
  color?: string;
  visible?: boolean;
}> = ({ origin, direction, length = 10, color = '#ff00ff', visible = true }) => {
  if (!visible) return null;

  const end = origin.clone().add(direction.multiplyScalar(length));

  return (
    <Line
      points={[origin.toArray(), end.toArray()]}
      color={color}
      lineWidth={2}
    />
  );
};

/**
 * Snap to grid helper
 * 网格对齐辅助
 */
export const useSnapToGrid = (gridSize: number = 1) => {
  const snapValue = useCallback((value: number) => {
    return Math.round(value / gridSize) * gridSize;
  }, [gridSize]);

  const snapVector3 = useCallback((vector: THREE.Vector3) => {
    return new THREE.Vector3(
      snapValue(vector.x),
      snapValue(vector.y),
      snapValue(vector.z)
    );
  }, [snapValue]);

  return { snapValue, snapVector3 };
};

/**
 * Object placement preview
 * 对象放置预览
 */
export const PlacementPreview: React.FC<{
  geometry?: THREE.BufferGeometry;
  position: THREE.Vector3;
  visible?: boolean;
}> = ({ geometry, position, visible = true }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!visible || !geometry) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <primitive object={geometry} />
      <meshStandardMaterial
        color="#4CAF50"
        transparent
        opacity={0.5}
        wireframe
      />
    </mesh>
  );
};