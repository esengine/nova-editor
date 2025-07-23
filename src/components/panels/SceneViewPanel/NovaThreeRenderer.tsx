/**
 * Nova ECS Three.js Renderer
 * 使用nova-ecs-render-three的原生Three.js渲染器
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../stores/editorStore';
import { 
  ThreeEditorBridge, 
  TransformComponent as NovaTransformComponent,
  ThreeMeshComponent, 
  ThreeMaterialComponent, 
  ThreeGeometryComponent 
} from '@esengine/nova-ecs-render-three';
import { TransformComponent, MeshRendererComponent } from '../../../ecs';

export interface NovaThreeRendererProps {
  style?: React.CSSProperties;
  className?: string;
}

export const NovaThreeRenderer: React.FC<NovaThreeRendererProps> = ({
  style,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bridgeRef = useRef<ThreeEditorBridge | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const gizmoCanvasRef = useRef<HTMLCanvasElement>(null);
  const gizmoRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gizmoSceneRef = useRef<THREE.Scene | null>(null);
  const gizmoCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Store references
  const world = useEditorStore(state => state.world.instance);
  const forceUpdateTrigger = useEditorStore(state => state.forceUpdateTrigger);
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const clearSelection = useEditorStore(state => state.clearSelection);

  // Initialize Three.js renderer
  useEffect(() => {
    if (!canvasRef.current || !world || bridgeRef.current) return;

    // Delay initialization to ensure canvas is ready
    const initializeRenderer = () => {
      try {
        // Create Three.js bridge
        bridgeRef.current = new ThreeEditorBridge(world, canvasRef.current!);
        
        // Add default lighting
        bridgeRef.current.addDefaultLighting();
      
      // Create large grid for infinite effect
      const gridSize = 10000; // Large but reasonable size
      const gridHelper = new THREE.GridHelper(gridSize, gridSize / 10, '#888888', '#444444');
      gridHelper.material.opacity = 0.3;
      gridHelper.material.transparent = true;
      gridHelperRef.current = gridHelper;
      bridgeRef.current.getScene().add(gridHelper);
      
      // Setup camera controls
      setupCameraControls();
      
      // Setup gizmo viewport
      setupGizmoViewport();
      
      // Convert existing entities to Three.js components
      convertExistingEntities();
      
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Nova Three.js renderer:', error);
        console.error('Error details:', {
          hasCanvas: !!canvasRef.current,
          hasWorld: !!world,
          error: error
        });
      }
    };

    // Use setTimeout to ensure canvas is fully rendered
    const timeoutId = setTimeout(initializeRenderer, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (bridgeRef.current) {
        bridgeRef.current.dispose();
        bridgeRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [world]);

  // Convert existing ECS entities to Three.js components
  const convertExistingEntities = () => {
    if (!world || !bridgeRef.current) return;

    world.entities.forEach((entity: any) => {
      const transform = entity.getComponent(TransformComponent);
      const meshRenderer = entity.getComponent(MeshRendererComponent);
      // const metadata = entity.getComponent(EditorMetadataComponent);

      if (transform && meshRenderer) {
        // Add Nova Transform component
        if (!entity.hasComponent(NovaTransformComponent)) {
          entity.addComponent(new NovaTransformComponent(
            { x: transform.position.x, y: transform.position.y, z: transform.position.z },
            { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z },
            { x: transform.scale.x, y: transform.scale.y, z: transform.scale.z }
          ));
        }

        // Add Three.js mesh component
        if (!entity.hasComponent(ThreeMeshComponent)) {
          entity.addComponent(new ThreeMeshComponent());
        }

        // Add material component
        if (!entity.hasComponent(ThreeMaterialComponent)) {
          const materialColor = getMaterialColor(meshRenderer.material);
          entity.addComponent(new ThreeMaterialComponent({
            materialType: 'standard',
            color: materialColor,
            metalness: 0.2,
            roughness: 0.8
          }));
        }

        // Add geometry component
        if (!entity.hasComponent(ThreeGeometryComponent)) {
          const geometryParams = getGeometryParams(meshRenderer.meshType);
          entity.addComponent(new ThreeGeometryComponent(
            meshRenderer.meshType as any,
            geometryParams
          ));
        }
      }
    });
  };

  // Helper function to get material color
  const getMaterialColor = (materialName: string): string => {
    switch (materialName) {
      case 'EnemyMaterial': return '#F44336';
      case 'GroundMaterial': return '#795548';
      case 'DefaultMaterial': return '#4CAF50';
      default: return '#4CAF50';
    }
  };

  // Helper function to get geometry parameters
  const getGeometryParams = (meshType: string): any => {
    switch (meshType) {
      case 'sphere':
        return { radius: 0.5, widthSegments: 16, heightSegments: 12 };
      case 'plane':
        return { width: 1, height: 1 };
      case 'cylinder':
        return { radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 8 };
      case 'box':
      default:
        return { width: 1, height: 1, depth: 1 };
    }
  };


  // Setup camera controls
  const setupCameraControls = () => {
    if (!bridgeRef.current || !canvasRef.current) return;

    const camera = bridgeRef.current.getCamera();
    const canvas = canvasRef.current;
    
    let isMouseDown = false;
    let mouseButton = 0;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Set initial camera position
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseButton = event.button;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      mouseButton = -1;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      if (mouseButton === 0) { // Left mouse - rotate (R3F style)
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        
        spherical.theta -= deltaX * 0.01;
        spherical.phi -= deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      } else if (mouseButton === 2) { // Right mouse - pan/move camera (R3F style)
        const panSpeed = 0.01;
        const panOffset = new THREE.Vector3();
        
        panOffset.setFromMatrixColumn(camera.matrix, 0); // get X column of camera matrix
        panOffset.multiplyScalar(-deltaX * panSpeed);
        
        const panOffsetY = new THREE.Vector3();
        panOffsetY.setFromMatrixColumn(camera.matrix, 1); // get Y column
        panOffsetY.multiplyScalar(deltaY * panSpeed);
        
        camera.position.add(panOffset);
        camera.position.add(panOffsetY);
      } else if (mouseButton === 1) { // Middle mouse - forward/backward (R3F style)
        const zoomSpeed = 0.1;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.multiplyScalar(-deltaY * zoomSpeed);
        camera.position.add(direction);
      }

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const zoomDelta = -event.deltaY * zoomSpeed; // 反转方向
      
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.multiplyScalar(zoomDelta);
      camera.position.add(direction);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Store cleanup function
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  };

  // Setup gizmo viewport
  const setupGizmoViewport = () => {
    if (!gizmoCanvasRef.current) return;

    const gizmoCanvas = gizmoCanvasRef.current;
    const gizmoRenderer = new THREE.WebGLRenderer({ 
      canvas: gizmoCanvas, 
      alpha: true,
      antialias: true 
    });
    gizmoRenderer.setSize(100, 100);
    gizmoRenderer.setClearColor(0x000000, 0);
    gizmoRendererRef.current = gizmoRenderer;

    // Create gizmo scene
    const gizmoScene = new THREE.Scene();
    gizmoSceneRef.current = gizmoScene;

    // Create gizmo camera
    const gizmoCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    gizmoCamera.position.set(2, 2, 2);
    gizmoCameraRef.current = gizmoCamera;

    // Create axes
    const axesGroup = new THREE.Group();
    
    // X axis (red)
    const xGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const xMaterial = new THREE.MeshBasicMaterial({ color: '#ff4757' });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = 0.5;
    axesGroup.add(xAxis);

    // Y axis (green)
    const yGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: '#2ed573' });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = 0.5;
    axesGroup.add(yAxis);

    // Z axis (blue)
    const zGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const zMaterial = new THREE.MeshBasicMaterial({ color: '#3742fa' });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = 0.5;
    axesGroup.add(zAxis);

    // Add labels
    // Note: In a real implementation, you'd load a font and add text
    // For now, we'll use simple sphere markers
    const labelGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    const xLabel = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ color: '#ff4757' }));
    xLabel.position.set(1.2, 0, 0);
    axesGroup.add(xLabel);
    
    const yLabel = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ color: '#2ed573' }));
    yLabel.position.set(0, 1.2, 0);
    axesGroup.add(yLabel);
    
    const zLabel = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ color: '#3742fa' }));
    zLabel.position.set(0, 0, 1.2);
    axesGroup.add(zLabel);

    gizmoScene.add(axesGroup);
  };

  // Control grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Update gizmo camera to match main camera
  const updateGizmoCamera = () => {
    if (!bridgeRef.current || !gizmoCameraRef.current) return;
    
    const mainCamera = bridgeRef.current.getCamera();
    const gizmoCamera = gizmoCameraRef.current;
    
    // Copy rotation from main camera but keep fixed distance
    gizmoCamera.position.copy(mainCamera.position).normalize().multiplyScalar(3);
    gizmoCamera.lookAt(0, 0, 0);
  };

  // Render loop
  useEffect(() => {
    if (!isInitialized || !bridgeRef.current) return;

    const renderLoop = () => {
      // Render the main scene
      if (bridgeRef.current) {
        bridgeRef.current.getRenderer().render();
      }

      // Render the gizmo if enabled
      if (showGizmos && gizmoRendererRef.current && gizmoSceneRef.current && gizmoCameraRef.current) {
        updateGizmoCamera();
        gizmoRendererRef.current.render(gizmoSceneRef.current, gizmoCameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized, showGizmos]);

  // Handle viewport resize
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !bridgeRef.current) return;

    const container = containerRef.current;
    const bridge = bridgeRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Update renderer size
        bridge.resize(width, height);
        
        // Update gizmo renderer size if it exists
        if (gizmoRendererRef.current) {
          const gizmoSize = Math.min(width, height) * 0.15; // 15% of smaller dimension
          const maxGizmoSize = 120;
          const minGizmoSize = 80;
          const finalGizmoSize = Math.min(maxGizmoSize, Math.max(minGizmoSize, gizmoSize));
          
          gizmoRendererRef.current.setSize(finalGizmoSize, finalGizmoSize);
          if (gizmoCanvasRef.current) {
            gizmoCanvasRef.current.style.width = `${finalGizmoSize}px`;
            gizmoCanvasRef.current.style.height = `${finalGizmoSize}px`;
          }
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isInitialized]);

  // Sync entity changes with Three.js components
  useEffect(() => {
    if (!world || !bridgeRef.current) return;

    // Re-convert entities when world changes
    convertExistingEntities();
  }, [forceUpdateTrigger]);


  // Handle mouse interactions
  const handleCanvasClick = () => {
    // TODO: Implement raycasting for entity selection
    // For now, clear selection when clicking empty space
    clearSelection();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (bridgeRef.current) {
        bridgeRef.current.getRenderer().dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
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
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Gizmo Viewport */}
      {showGizmos && (
        <canvas
          ref={gizmoCanvasRef}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '100px',
            height: '100px',
            pointerEvents: 'none',
            zIndex: 1000,
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.2)',
            opacity: '0.6',
            transition: 'opacity 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1.0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
          }}
        />
      )}

      {/* Loading indicator */}
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          textAlign: 'center'
        }}>
          <div>Initializing Nova Three.js Renderer...</div>
        </div>
      )}
    </div>
  );
};