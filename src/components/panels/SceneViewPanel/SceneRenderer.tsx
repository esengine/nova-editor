/**
 * Scene renderer with performance optimizations
 * 场景渲染器，带性能优化
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
// import { EffectComposer, Outline, FXAA, SSAO } from '@react-three/postprocessing';
import { useEditorStore } from '../../../stores/editorStore';

/**
 * Render settings interface
 * 渲染设置接口
 */
export interface RenderSettings {
  shadows: boolean;
  antialiasing: boolean;
  outline: boolean;
  ssao: boolean;
  fog: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

/**
 * Default render settings
 * 默认渲染设置
 */
export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  shadows: true,
  antialiasing: true,
  outline: true,
  ssao: false,
  fog: true,
  fogColor: '#1a1a1a',
  fogNear: 10,
  fogFar: 50
};

/**
 * Scene renderer component with post-processing
 * 带后处理的场景渲染器组件
 */
export const SceneRenderer: React.FC<{
  settings?: RenderSettings;
  children: React.ReactNode;
}> = ({ settings = DEFAULT_RENDER_SETTINGS, children }) => {
  const { gl, scene } = useThree();
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const selectedMeshes = useRef<THREE.Mesh[]>([]);

  // Configure renderer
  useEffect(() => {
    gl.shadowMap.enabled = settings.shadows;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, settings.shadows]);

  // Configure fog
  useEffect(() => {
    if (settings.fog) {
      scene.fog = new THREE.Fog(settings.fogColor, settings.fogNear, settings.fogFar);
    } else {
      scene.fog = null;
    }
  }, [scene, settings.fog, settings.fogColor, settings.fogNear, settings.fogFar]);

  // Update selected meshes for outline effect
  useEffect(() => {
    selectedMeshes.current = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          object.userData.entityId !== undefined &&
          selectedEntities.includes(object.userData.entityId)) {
        selectedMeshes.current.push(object);
      }
    });
  }, [scene, selectedEntities]);

  return (
    <>
      {children}
      {/* TODO: Add postprocessing when @react-three/postprocessing is installed
      {(settings.antialiasing || settings.outline || settings.ssao) && (
        <EffectComposer>
          {settings.antialiasing && <FXAA />}
          {settings.outline && selectedMeshes.current.length > 0 && (
            <Outline
              selection={selectedMeshes.current}
              selectionLayer={10}
              edgeStrength={2.5}
              pulseSpeed={0.0}
              visibleEdgeColor={0xffff00}
              hiddenEdgeColor={0xffff00}
              blur={false}
            />
          )}
          {settings.ssao && (
            <SSAO
              samples={16}
              radius={5}
              intensity={10}
              luminanceInfluence={0.5}
            />
          )}
        </EffectComposer>
      )}
      */}
    </>
  );
};

/**
 * Performance monitor component
 * 性能监控组件
 */
export const PerformanceMonitor: React.FC<{
  onPerformanceData: (data: PerformanceData) => void;
}> = ({ onPerformanceData }) => {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const frameTimes = useRef<number[]>([]);

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;
    
    frameTimes.current.push(deltaTime);
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift();
    }

    // Update stats every 60 frames
    if (frameCount.current % 60 === 0) {
      const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
      const fps = Math.round(1000 / avgFrameTime);
      
      // Get renderer info
      const info = gl.info;
      const memory = (info.memory as any);
      
      onPerformanceData({
        fps,
        frameTime: avgFrameTime,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines,
        geometries: memory.geometries,
        textures: memory.textures
      });
      
      // Reset frame counter
      info.reset();
    }
    
    lastTime.current = currentTime;
  });

  return null;
};

/**
 * Performance data interface
 * 性能数据接口
 */
export interface PerformanceData {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
}

/**
 * Level of detail (LOD) manager
 * 细节层次(LOD)管理器
 */
export const LODManager: React.FC<{
  children: React.ReactNode;
  camera: THREE.Camera;
}> = ({ children, camera }) => {
  const lodGroupsRef = useRef<THREE.LOD[]>([]);

  useFrame(() => {
    // Update LOD groups based on camera distance
    lodGroupsRef.current.forEach(lod => {
      lod.update(camera);
    });
  });

  // Register LOD groups
  const registerLOD = React.useCallback((lod: THREE.LOD) => {
    if (lod && !lodGroupsRef.current.includes(lod)) {
      lodGroupsRef.current.push(lod);
    }
  }, []);

  // Unregister LOD groups
  const unregisterLOD = React.useCallback((lod: THREE.LOD) => {
    const index = lodGroupsRef.current.indexOf(lod);
    if (index > -1) {
      lodGroupsRef.current.splice(index, 1);
    }
  }, []);

  return (
    <LODContext.Provider value={{ registerLOD, unregisterLOD }}>
      {children}
    </LODContext.Provider>
  );
};

// LOD context
const LODContext = React.createContext<{
  registerLOD: (lod: THREE.LOD) => void;
  unregisterLOD: (lod: THREE.LOD) => void;
}>({
  registerLOD: () => {},
  unregisterLOD: () => {}
});

export const useLOD = () => React.useContext(LODContext);

/**
 * Frustum culling manager
 * 视锥体剔除管理器
 */
export const FrustumCuller: React.FC = () => {
  const { camera, scene } = useThree();
  const frustum = useRef(new THREE.Frustum());
  const matrix = useRef(new THREE.Matrix4());

  useFrame(() => {
    // Update frustum from camera
    matrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.current.setFromProjectionMatrix(matrix.current);

    // Cull objects outside frustum
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.enableCulling !== false) {
        const box = new THREE.Box3().setFromObject(object);
        object.visible = frustum.current.intersectsBox(box);
      }
    });
  });

  return null;
};

/**
 * Render quality presets
 * 渲染质量预设
 */
export const QUALITY_PRESETS = {
  low: {
    shadows: false,
    antialiasing: false,
    outline: true,
    ssao: false,
    fog: false
  },
  medium: {
    shadows: true,
    antialiasing: true,
    outline: true,
    ssao: false,
    fog: true
  },
  high: {
    shadows: true,
    antialiasing: true,
    outline: true,
    ssao: true,
    fog: true
  }
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;