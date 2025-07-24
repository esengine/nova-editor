/**
 * Nova ECS Three.js Renderer - 3D viewport for scene editing
 * Nova ECS Three.js渲染器 - 用于场景编辑的3D视口
 * 
 * Features:
 * - Orbit camera controls with damping
 * - Entity selection with visual highlighting
 * - Transform gizmos for 3D object manipulation
 * - Advanced lighting and shadow system
 * - Material and texture management
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../stores/editorStore';
import { 
  ThreeRenderSystem,
  ThreeRenderPlugin,
  ThreeMeshComponent, 
  ThreeMaterialComponent, 
  ThreeGeometryComponent 
} from '@esengine/nova-ecs-render-three';
import { TransformComponent as NovaTransformComponent, MeshRendererComponent } from '../../../ecs';
import type { EntityId } from '@esengine/nova-ecs';

/**
 * Orbit Controls - Integrated orbit camera controls with damping
 * 轨道控制器 - 集成阻尼的轨道相机控制
 */
class OrbitControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target = new THREE.Vector3();
  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();
  private scale = 1;
  private panOffset = new THREE.Vector3();
  private isMouseDown = false;
  private mouseButton = -1;
  private previousMousePosition = { x: 0, y: 0 };
  
  // Configuration
  public enableDamping = true;
  public dampingFactor = 0.05;
  public enableZoom = true;
  public enableRotate = true;
  public enablePan = true;
  public minDistance = 0.1;
  public maxDistance = 1000;
  public autoRotate = false;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));
    this.addEventListeners();
  }
  
  update(): boolean {
    const position = this.camera.position;
    const offset = new THREE.Vector3();
    
    // Apply damping
    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
      this.spherical.radius *= (this.scale - 1) * this.dampingFactor + 1;
      this.target.addScaledVector(this.panOffset, this.dampingFactor);
      
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
      this.scale = 1;
      this.panOffset.multiplyScalar(1 - this.dampingFactor);
    }
    
    // Apply constraints
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    this.spherical.makeSafe();
    
    // Update camera position
    offset.setFromSpherical(this.spherical);
    position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    
    return true;
  }
  
  private addEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('wheel', this.onWheel);
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private onMouseDown = (event: MouseEvent): void => {
    event.preventDefault();
    this.isMouseDown = true;
    this.mouseButton = event.button;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
  };
  
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isMouseDown) return;
    
    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;
    
    if (this.mouseButton === 0 && this.enableRotate) {
      // Left mouse - rotate
      this.sphericalDelta.theta -= deltaX * 0.01;
      this.sphericalDelta.phi -= deltaY * 0.01;
    } else if (this.mouseButton === 2 && this.enablePan) {
      // Right mouse - pan
      const panSpeed = 0.01;
      const panOffsetX = new THREE.Vector3();
      panOffsetX.setFromMatrixColumn(this.camera.matrix, 0);
      panOffsetX.multiplyScalar(-deltaX * panSpeed);
      
      const panOffsetY = new THREE.Vector3();
      panOffsetY.setFromMatrixColumn(this.camera.matrix, 1);
      panOffsetY.multiplyScalar(deltaY * panSpeed);
      
      this.panOffset.add(panOffsetX).add(panOffsetY);
    }
    
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  };
  
  private onMouseUp = (): void => {
    this.isMouseDown = false;
    this.mouseButton = -1;
    
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
  };
  
  private onWheel = (event: WheelEvent): void => {
    if (!this.enableZoom) return;
    event.preventDefault();
    
    const zoomScale = event.deltaY > 0 ? 1.1 : 0.9;
    this.scale *= zoomScale;
  };
  
  dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}

/**
 * Selection System - Handles entity selection and highlighting
 * 选择系统 - 处理实体选择和高亮显示
 */
class SelectionSystem {
  private camera: THREE.Camera;
  private raycaster = new THREE.Raycaster();
  private selectedObjects = new Set<THREE.Object3D>();
  private onSelectionChange?: (selected: Set<THREE.Object3D>) => void;
  
  constructor(_scene: THREE.Scene, camera: THREE.Camera) {
    this.camera = camera;
  }
  
  onSelectionChanged(callback: (selected: Set<THREE.Object3D>) => void): void {
    this.onSelectionChange = callback;
  }
  
  raycast(pointer: THREE.Vector2, selectableObjects: THREE.Object3D[]): THREE.Object3D | null {
    this.raycaster.setFromCamera(pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(selectableObjects, true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && !selectableObjects.includes(object)) {
        object = object.parent;
      }
      return selectableObjects.includes(object) ? object : null;
    }
    
    return null;
  }
  
  selectObject(object: THREE.Object3D, addToSelection = false): void {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    if (!this.selectedObjects.has(object)) {
      this.selectedObjects.add(object);
      this.addHighlight(object);
      
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedObjects);
      }
    }
  }
  
  clearSelection(): void {
    this.selectedObjects.forEach(object => {
      this.removeHighlight(object);
    });
    
    this.selectedObjects.clear();
    
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedObjects);
    }
  }
  
  private addHighlight(object: THREE.Object3D): void {
    // Simple highlight by changing material color
    object.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (!child.userData.originalColor) {
          child.userData.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff4500); // Orange highlight
      }
    });
  }
  
  private removeHighlight(object: THREE.Object3D): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.userData.originalColor) {
          child.material.color.copy(child.userData.originalColor);
          delete child.userData.originalColor;
        }
      }
    });
  }
  
  dispose(): void {
    this.clearSelection();
  }
}

/**
 * Transform gizmo modes for 3D object manipulation
 * 3D对象操作的变换操作模式
 */
export type GizmoMode = 'translate' | 'rotate' | 'scale';

/**
 * Selection options for entity highlighting
 * 实体高亮显示选项
 */
export interface SelectionOptions {
  outlineColor?: number;
  outlineThickness?: number;
  enableOutline?: boolean;
  enableGlow?: boolean;
}

/**
 * Orbit controls configuration
 * 轨道控制器配置
 */
export interface OrbitControlsConfig {
  enableDamping?: boolean;
  dampingFactor?: number;
  enableZoom?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  autoRotate?: boolean;
}

export interface NovaThreeRendererProps {
  style?: React.CSSProperties;
  className?: string;
}

export const NovaThreeRenderer: React.FC<NovaThreeRendererProps> = ({
  style,
  className
}) => {
  // Core rendering references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderSystemRef = useRef<ThreeRenderSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Core systems
  const orbitControlsRef = useRef<any>(null); // Orbit controls
  const selectionSystemRef = useRef<any>(null); // Selection and highlighting
  const transformGizmoRef = useRef<any>(null); // Transform gizmos
  
  // Mouse interaction state
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  
  // Scene objects
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const selectableObjects = useRef<THREE.Object3D[]>([]);
  const entityMeshMap = useRef<Map<EntityId, THREE.Object3D[]>>(new Map());
  
  // Gizmo viewport (legacy support)
  const gizmoCanvasRef = useRef<HTMLCanvasElement>(null);
  const gizmoRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gizmoSceneRef = useRef<THREE.Scene | null>(null);
  const gizmoCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Store references
  const world = useEditorStore(state => state.world.instance);
  const forceUpdateTrigger = useEditorStore(state => state.forceUpdateTrigger);
  const showGrid = useEditorStore(state => state.viewport.showGrid);
  const showGizmos = useEditorStore(state => state.viewport.showGizmos);
  const transformMode = useEditorStore(state => state.viewport.transformMode);
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const selectEntity = useEditorStore(state => state.selectEntity);
  const clearSelection = useEditorStore(state => state.clearSelection);

  // Initialize Three.js renderer
  useEffect(() => {
    if (!canvasRef.current || !world || renderSystemRef.current) return;

    // Delay initialization to ensure canvas is ready and plugins are loaded
    const initializeRenderer = async () => {
      try {
        // Get Three.js bridge from plugin
        const threePlugin = world.plugins.get('three-render') as ThreeRenderPlugin | undefined;
        if (!threePlugin) {
          throw new Error('Three.js render plugin not found');
        }

        // Get the render system directly from plugin
        const renderSystem = threePlugin.getRenderSystem();
        if (!renderSystem) {
          throw new Error('ThreeRenderSystem not found in plugin. Plugin installation may have failed.');
        }
        
        // Store render system reference
        renderSystemRef.current = renderSystem;
        
        // Update plugin config with canvas
        const canvas = canvasRef.current!;
        threePlugin.updateConfig({ canvas });
      
        // Create large grid for infinite effect
        const gridSize = 10000; // Large but reasonable size
        const gridHelper = new THREE.GridHelper(gridSize, gridSize / 10, '#888888', '#444444');
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        gridHelperRef.current = gridHelper;
        if (renderSystemRef.current) {
          renderSystemRef.current.scene.add(gridHelper);
        }
      
      // Initialize core systems
      await initializeCoreSystems();
      
      // Setup gizmo viewport (legacy support)
      setupGizmoViewport();
      
      // Convert existing entities to Three.js components
      convertExistingEntities();
      
      setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Nova Three.js renderer:', error);
      }
    };

    // Wait for plugins to be fully loaded before initializing
    // 等待插件完全加载后再初始化
    let retryCount = 0;
    const maxRetries = 20; // Max 10 seconds (20 * 500ms)
    
    const checkPluginsLoaded = () => {
      console.log('Checking for three-render plugin...');
      
      // Use NovaECS native plugin system
      // 使用NovaECS原生插件系统
      const threePlugin = world.plugins.get('three-render');
      console.log('Found three-render plugin:', !!threePlugin);
      
      if (threePlugin && typeof threePlugin.getRenderSystem === 'function') {
        const renderSystem = threePlugin.getRenderSystem();
        if (renderSystem) {
          console.log('Render system is ready, initializing renderer...');
          initializeRenderer();
          return;
        } else {
          console.warn('getRenderSystem() returned null/undefined');
        }
      }
      
      // Retry after a short delay if plugins aren't loaded yet
      // 如果插件尚未加载，稍后重试
      retryCount++;
      if (retryCount < maxRetries) {
        console.warn('Three-render plugin not ready, retrying...');
        setTimeout(checkPluginsLoaded, 500);
      } else {
        console.error('Failed to find three-render plugin after maximum retries.');
        setIsInitialized(true); // Stop showing loading message
      }
    };
    
    // Use setTimeout to ensure canvas is fully rendered
    const timeoutId = setTimeout(checkPluginsLoaded, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (renderSystemRef.current) {
        renderSystemRef.current.dispose();
        renderSystemRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [world]);

  /**
   * Convert existing ECS entities to Three.js components with enhanced tracking
   * 将现有 ECS 实体转换为 Three.js 组件，并增强跟踪
   */
  const convertExistingEntities = useCallback(() => {
    if (!world || !renderSystemRef.current) return;
    
    // Clear previous mappings
    entityMeshMap.current.clear();
    selectableObjects.current = [];

    world.entities.forEach((entity: any) => {
      const transform = entity.getComponent(NovaTransformComponent);
      const meshRenderer = entity.getComponent(MeshRendererComponent);

      if (transform && meshRenderer) {
        // Add Three.js mesh component
        if (!entity.hasComponent(ThreeMeshComponent)) {
          entity.addComponent(new ThreeMeshComponent());
        }

        // Add material component with enhanced properties
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
        
        // Track meshes for selection system
        const scene = renderSystemRef.current!.scene;
        const meshes: THREE.Object3D[] = [];
        
        scene.traverse((child) => {
          if (child.userData.entityId === entity.id) {
            meshes.push(child);
            selectableObjects.current.push(child);
          }
        });
        
        if (meshes.length > 0) {
          entityMeshMap.current.set(entity.id, meshes);
        }
      }
    });
  }, [world]);

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


  /**
   * Initialize enhanced systems for advanced 3D editing
   * 初始化用于高级 3D 编辑的增强系统
   */
  const initializeCoreSystems = async () => {
    if (!renderSystemRef.current || !canvasRef.current) return;
    
    const scene = renderSystemRef.current.scene;
    const camera = renderSystemRef.current.camera as THREE.PerspectiveCamera;
    
    // Set initial camera position
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Initialize enhanced orbit controls
    orbitControlsRef.current = new OrbitControls(camera, canvasRef.current);
    
    // Initialize selection system
    selectionSystemRef.current = new SelectionSystem(scene, camera);
    
    // Setup selection change callback to sync with editor store
    selectionSystemRef.current.onSelectionChanged((selected: Set<THREE.Object3D>) => {
      const entityIds = Array.from(selected).map((obj: THREE.Object3D) => {
        // Find entity ID from mesh mapping
        for (const [entityId, meshes] of entityMeshMap.current.entries()) {
          if (meshes.includes(obj)) {
            return entityId;
          }
        }
        return null;
      }).filter(id => id !== null) as EntityId[];
      
      // Update store selection
      if (entityIds.length > 0) {
        selectEntity(entityIds[0], false);
      }
    });
    
    // Setup event listeners for enhanced interaction
    setupEventListeners();
    
    console.log('Rendering systems initialized successfully');
  };
  
  /**
   * Setup event listeners for mouse interactions
   * 设置用于鼠标交互的事件监听器
   */
  const setupEventListeners = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };
  
  /**
   * Handle mouse down events
   * 处理鼠标按下事件
   */
  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseDownPos.current = { x: event.clientX, y: event.clientY };
    isDragging.current = false;
  }, []);

  /**
   * Handle mouse move events
   * 处理鼠标移动事件
   */
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (mouseDownPos.current) {
      const deltaX = Math.abs(event.clientX - mouseDownPos.current.x);
      const deltaY = Math.abs(event.clientY - mouseDownPos.current.y);
      
      // Consider it dragging if mouse moved more than 5 pixels
      if (deltaX > 5 || deltaY > 5) {
        isDragging.current = true;
      }
    }
  }, []);

  /**
   * Handle mouse up events with selection logic
   * 处理鼠标抬起事件和选择逻辑
   */
  const handleMouseUp = useCallback((event: MouseEvent) => {
    // Only handle selection if it wasn't a drag operation
    if (!isDragging.current && selectionSystemRef.current) {
      const pointer = getPointer(event);
      const clickedObject = selectionSystemRef.current.raycast(pointer, selectableObjects.current);
      
      if (clickedObject) {
        const addToSelection = event.ctrlKey || event.metaKey;
        selectionSystemRef.current.selectObject(clickedObject, addToSelection);
      } else {
        // Clear selection when clicking empty space (but not when dragging)
        selectionSystemRef.current.clearSelection();
        clearSelection();
      }
    }
    
    // Reset mouse state
    mouseDownPos.current = null;
    isDragging.current = false;
  }, [clearSelection]);
  
  /**
   * Convert screen coordinates to normalized device coordinates
   * 将屏幕坐标转换为归一化设备坐标
   */
  const getPointer = (event: PointerEvent | MouseEvent): THREE.Vector2 => {
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 1, height: 1 };
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  };

  /**
   * Cleanup event listeners
   * 清理事件监听器
   */
  const cleanupEventListeners = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

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
    if (!renderSystemRef.current || !gizmoCameraRef.current) return;
    
    const mainCamera = renderSystemRef.current.camera;
    const gizmoCamera = gizmoCameraRef.current;
    
    // Copy rotation from main camera but keep fixed distance
    gizmoCamera.position.copy(mainCamera.position).normalize().multiplyScalar(3);
    gizmoCamera.lookAt(0, 0, 0);
  };

  /**
   * Render loop with system updates
   * 渲染循环，包含系统更新
   */
  useEffect(() => {
    if (!isInitialized || !renderSystemRef.current) return;

    const renderLoop = () => {
      // Update orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }

      // Render the main scene
      if (renderSystemRef.current) {
        renderSystemRef.current.render();
      }

      // Render the gizmo if enabled (legacy support)
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

  /**
   * Handle viewport resize
   * 处理视口大小调整
   */
  
  useEffect(() => {
    if (!containerRef.current || !renderSystemRef.current) return;

    const container = containerRef.current;
    const renderSystem = renderSystemRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Update renderer size
        renderSystem.setSize(width, height);
        
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

  /**
   * Sync entity changes with Three.js components
   * 同步实体变化到 Three.js 组件
   */
  useEffect(() => {
    if (!isInitialized) return;
    convertExistingEntities();
  }, [forceUpdateTrigger, isInitialized, convertExistingEntities]);
  
  /**
   * Update transform mode for gizmos
   * 更新操作手柄的变换模式
   */
  useEffect(() => {
    if (!isInitialized || !transformGizmoRef.current) return;
    
    // Future: Update transform gizmo mode based on transformMode
    console.log('Transform mode changed to:', transformMode);
  }, [transformMode, isInitialized]);
  
  /**
   * Sync selection state between store and selection system
   * 在存储和选择系统之间同步选择状态
   */
  useEffect(() => {
    if (!isInitialized || !selectionSystemRef.current) return;
    
    // Update selection system based on selected entities from store
    if (selectedEntities.length === 0) {
      selectionSystemRef.current.clearSelection();
    }
    // Future: Handle multi-selection sync
  }, [selectedEntities, isInitialized]);


  /**
   * Cleanup systems on unmount
   * 在组件卸载时清理系统
   */
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Clean up event listeners
    cleanupEventListeners();
    
    // Dispose systems
    if (orbitControlsRef.current) {
      orbitControlsRef.current.dispose();
      orbitControlsRef.current = null;
    }
    
    if (selectionSystemRef.current) {
      selectionSystemRef.current.dispose();
      selectionSystemRef.current = null;
    }
    
    if (renderSystemRef.current) {
      renderSystemRef.current.dispose();
      renderSystemRef.current = null;
    }
    
    setIsInitialized(false);
  }, [cleanupEventListeners]);
  
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Loading: Orbit Controls, Selection System, Lighting
          </div>
        </div>
      )}
      
    </div>
  );
};