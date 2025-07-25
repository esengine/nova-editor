/**
 * Component Registry with modern categorization system
 * 现代分类系统的组件注册表
 */

import { Component } from '@esengine/nova-ecs';
import { Fixed } from '@esengine/nova-ecs-math';
import { 
  EditorMetadataComponent, 
  TransformComponent 
} from '@esengine/nova-ecs-core';
import {
  ThreeLightComponent,
  ThreeCameraComponent,
  ThreeMeshComponent,
  ThreeMaterialComponent,
  ThreeGeometryComponent
} from '@esengine/nova-ecs-render-three';
import { 
  ColliderComponent as PhysicsColliderComponent, 
  JointComponent as PhysicsJointComponent, 
  PhysicsTransformComponent
} from '@esengine/nova-ecs-physics-core';
import { EditorRigidBodyComponent } from '../plugins/components/EditorRigidBodyComponent';
import { ColliderType } from '@esengine/nova-ecs-physics-core';

/**
 * Component category definitions for organized component management
 * 用于组织化组件管理的分类定义
 */
export enum ComponentCategory {
  // Core categories
  CORE = 'Core',
  TRANSFORM = 'Transform',
  
  // Rendering categories  
  RENDERING = 'Rendering',
  MESH = 'Mesh',
  MATERIALS = 'Materials',
  LIGHTING = 'Lighting',
  CAMERA = 'Camera',
  
  // Physics categories
  PHYSICS = 'Physics',
  COLLISION = 'Collision',
  
  // Audio categories
  AUDIO = 'Audio',
  
  // Animation categories
  ANIMATION = 'Animation',
  
  // UI categories
  UI = 'UI',
  
  // Scripting categories
  SCRIPTING = 'Scripting',
  
  // Utilities
  UTILITIES = 'Utilities',
  
  // Debug/Editor only
  DEBUG = 'Debug'
}

/**
 * Component metadata for registry
 * 注册表的组件元数据
 */
export interface ComponentMetadata {
  name: string;
  displayName: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  color: string;
  isCore: boolean;
  canRemove: boolean;
  dependencies?: string[];
  conflicts?: string[];
  createInstance: () => Component;
}

/**
 * Component Registry
 * 组件注册表
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components = new Map<string, ComponentMetadata>();

  private constructor() {
    this.registerDefaultComponents();
  }

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register all default components with organized categories
   * 注册所有默认组件，使用有组织的分类系统
   */
  private registerDefaultComponents(): void {
    // Core Components - 核心组件
    this.register({
      name: 'TransformComponent',
      displayName: 'Transform',
      description: 'Position, rotation, and scale of the entity in 3D space',
      category: ComponentCategory.TRANSFORM,
      icon: '🔧',
      color: '#4CAF50',
      isCore: true,
      canRemove: false,
      createInstance: () => new TransformComponent()
    });

    this.register({
      name: 'EditorMetadataComponent', 
      displayName: 'Metadata',
      description: 'Editor-specific metadata for the entity',
      category: ComponentCategory.CORE,
      icon: '📝',
      color: '#607D8B',
      isCore: true,
      canRemove: false,
      createInstance: () => new EditorMetadataComponent('New Entity')
    });

    // Rendering Components - 渲染组件
    this.register({
      name: 'ThreeMeshComponent',
      displayName: 'Mesh Renderer',
      description: 'Renders a mesh using Three.js',
      category: ComponentCategory.MESH,
      icon: '🎨',
      color: '#FF5722',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new ThreeMeshComponent()
    });

    this.register({
      name: 'ThreeMaterialComponent',
      displayName: 'Material',
      description: 'Material properties for rendering',
      category: ComponentCategory.MATERIALS,
      icon: '🎭',
      color: '#9C27B0',
      isCore: false,
      canRemove: true,
      createInstance: () => new ThreeMaterialComponent()
    });

    this.register({
      name: 'ThreeGeometryComponent',
      displayName: 'Geometry',
      description: 'Geometric shape data',
      category: ComponentCategory.MESH,
      icon: '📐',
      color: '#3F51B5',
      isCore: false,
      canRemove: true,
      createInstance: () => new ThreeGeometryComponent()
    });

    // Lighting Components - 光照组件
    this.register({
      name: 'ThreeLightComponent',
      displayName: 'Light',
      description: 'Light source for scene illumination',
      category: ComponentCategory.LIGHTING,
      icon: '💡',
      color: '#FFEB3B',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new ThreeLightComponent()
    });

    // Camera Components - 相机组件
    this.register({
      name: 'ThreeCameraComponent',
      displayName: 'Camera',
      description: 'Camera for viewing the scene',
      category: ComponentCategory.CAMERA,
      icon: '📷',
      color: '#00BCD4',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      conflicts: ['ThreeCamera'], // Only one camera per entity
      createInstance: () => new ThreeCameraComponent()
    });

    // Physics Components - 物理组件
    this.register({
      name: 'RigidBodyComponent',
      displayName: 'Rigid Body',
      description: 'Adds physics simulation to the entity',
      category: ComponentCategory.PHYSICS,
      icon: '🏃',
      color: '#FF9800',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new EditorRigidBodyComponent()
    });

    this.register({
      name: 'BoxColliderComponent',
      displayName: 'Box Collider',
      description: 'Box-shaped collision detection',
      category: ComponentCategory.COLLISION,
      icon: '📦',
      color: '#8BC34A',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new PhysicsColliderComponent({ 
        type: ColliderType.Box, 
        halfWidth: new Fixed(0.5), 
        halfHeight: new Fixed(0.5) 
      })
    });

    this.register({
      name: 'CircleColliderComponent',
      displayName: 'Circle Collider', 
      description: 'Circle-shaped collision detection',
      category: ComponentCategory.COLLISION,
      icon: '🔵',
      color: '#2196F3',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new PhysicsColliderComponent({
        type: ColliderType.Circle,
        radius: new Fixed(0.5)
      })
    });

    this.register({
      name: 'JointComponent',
      displayName: 'Physics Joint',
      description: 'Connects two physics bodies',
      category: ComponentCategory.PHYSICS,
      icon: '🔗',
      color: '#795548',
      isCore: false,
      canRemove: true,
      dependencies: ['RigidBody'],
      createInstance: () => new PhysicsJointComponent({ type: 'revolute' })
    });

    this.register({
      name: 'PhysicsTransformComponent',
      displayName: 'Physics Transform',
      description: 'Transform synchronized with physics simulation',
      category: ComponentCategory.PHYSICS,
      icon: '🌐',
      color: '#607D8B',
      isCore: false,
      canRemove: true,
      dependencies: ['TransformComponent'],
      createInstance: () => new PhysicsTransformComponent()
    });
  }

  /**
   * Register a new component type
   * 注册新的组件类型
   */
  register(metadata: ComponentMetadata): void {
    this.components.set(metadata.name, metadata);
  }

  /**
   * Get component metadata by name
   * 根据名称获取组件元数据
   */
  get(name: string): ComponentMetadata | undefined {
    return this.components.get(name);
  }

  /**
   * Get all registered components
   * 获取所有注册的组件
   */
  getAll(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   * 根据分类获取组件
   */
  getByCategory(category: ComponentCategory): ComponentMetadata[] {
    return this.getAll().filter(comp => comp.category === category);
  }

  /**
   * Get all available categories
   * 获取所有可用的分类
   */
  getCategories(): ComponentCategory[] {
    const categories = new Set<ComponentCategory>();
    this.getAll().forEach(comp => categories.add(comp.category));
    return Array.from(categories).sort();
  }

  /**
   * Check if component can be added to entity
   * 检查组件是否可以添加到实体
   */
  canAddComponent(componentName: string, existingComponents: string[]): {
    canAdd: boolean;
    reason?: string;
  } {
    const metadata = this.get(componentName);
    if (!metadata) {
      return { canAdd: false, reason: 'Component not found' };
    }

    // Check if already has this component
    if (existingComponents.includes(componentName)) {
      return { canAdd: false, reason: 'Component already exists' };
    }

    // Check dependencies
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        if (!existingComponents.includes(dep)) {
          return { canAdd: false, reason: `Missing dependency: ${dep}` };
        }
      }
    }

    // Check conflicts
    if (metadata.conflicts) {
      for (const conflict of metadata.conflicts) {
        if (existingComponents.includes(conflict)) {
          return { canAdd: false, reason: `Conflicts with: ${conflict}` };
        }
      }
    }

    return { canAdd: true };
  }

  /**
   * Create component instance by name
   * 根据名称创建组件实例
   */
  createComponent(name: string): Component | null {
    const metadata = this.get(name);
    if (!metadata) {
      console.warn(`Unknown component type: ${name}`);
      return null;
    }
    return metadata.createInstance();
  }

  /**
   * Check if component can be removed
   * 检查组件是否可以被移除
   */
  canRemoveComponent(name: string): boolean {
    const metadata = this.get(name);
    return metadata ? metadata.canRemove : false;
  }

}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance();