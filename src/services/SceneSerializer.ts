/**
 * Scene serialization system for saving and loading scenes
 * 场景序列化系统，用于保存和加载场景
 */

import { EditorWorld } from '../ecs';
import type { EntityId } from '@esengine/nova-ecs';
import { assetService } from './AssetService';
import { consoleService } from './ConsoleService';
import type { AssetMetadata } from '../types/AssetTypes';
import { AssetType } from '../types/AssetTypes';

/**
 * Serialized component data
 * 序列化的组件数据
 */
export interface SerializedComponent {
  type: string;
  data: any;
}

/**
 * Serialized entity data
 * 序列化的实体数据
 */
export interface SerializedEntity {
  id: EntityId;
  active: boolean;
  components: SerializedComponent[];
}

/**
 * Serialized scene data
 * 序列化的场景数据
 */
export interface SerializedScene {
  version: string;
  timestamp: number;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  entities: SerializedEntity[];
  settings: {
    physics: {
      gravity: { x: number; y: number };
      timeStep: number;
    };
    rendering: {
      backgroundColor: string;
      ambientLight: string;
      fog: {
        enabled: boolean;
        color: string;
        near: number;
        far: number;
      };
    };
  };
}

/**
 * Scene serializer class
 * 场景序列化器类
 */
export class SceneSerializer {
  private readonly VERSION = '1.0.0';
  
  /**
   * Serialize current scene
   * 序列化当前场景
   */
  async serializeScene(world: EditorWorld, metadata?: Partial<SerializedScene['metadata']>): Promise<SerializedScene> {
    const entities: SerializedEntity[] = [];
    
    // Serialize all entities
    for (const entity of world.entities) {
      const serializedEntity: SerializedEntity = {
        id: entity.id,
        active: entity.active,
        components: []
      };
      
      // Serialize all components
      const components = entity.getComponents();
      for (const component of components) {
        const serializedComponent = await this.serializeComponent(component);
        if (serializedComponent) {
          serializedEntity.components.push(serializedComponent);
        }
      }
      
      entities.push(serializedEntity);
    }
    
    const scene: SerializedScene = {
      version: this.VERSION,
      timestamp: Date.now(),
      metadata: {
        name: metadata?.name || 'Untitled Scene',
        ...(metadata?.description !== undefined && { description: metadata.description }),
        ...(metadata?.author !== undefined && { author: metadata.author }),
        ...(metadata?.tags !== undefined && { tags: metadata.tags })
      },
      entities,
      settings: {
        physics: {
          gravity: { x: 0, y: -9.81 },
          timeStep: 1/60
        },
        rendering: {
          backgroundColor: '#1a1a1a',
          ambientLight: '#404040',
          fog: {
            enabled: true,
            color: '#1a1a1a',
            near: 10,
            far: 50
          }
        }
      }
    };
    
    return scene;
  }
  
  /**
   * Deserialize scene data
   * 反序列化场景数据
   */
  async deserializeScene(sceneData: SerializedScene, world: EditorWorld): Promise<void> {
    // Clear existing entities
    const existingEntities = [...world.entities];
    for (const entity of existingEntities) {
      world.removeEntity(entity.id);
    }
    
    // Create entities from serialized data
    for (const entityData of sceneData.entities) {
      const entity = world.createEntity();
      entity.active = entityData.active;
      
      // Add components
      for (const componentData of entityData.components) {
        const component = await this.deserializeComponent(componentData);
        if (component) {
          entity.addComponent(component);
        } else {
          console.warn('Failed to deserialize component:', componentData);
        }
      }
    }
    consoleService.addLog('success', `Loaded scene: ${sceneData.metadata.name} (${sceneData.entities.length} entities)`);
  }
  
  /**
   * Serialize component using generic approach
   * 使用通用方法序列化组件
   */
  private async serializeComponent(component: any): Promise<SerializedComponent | null> {
    const type = component.constructor.name;
    
    try {
      // Check if component has custom serialization method
      if (typeof component.serialize === 'function') {
        return {
          type,
          data: component.serialize()
        };
      }
      
      // Generic serialization - serialize all enumerable properties
      const data: any = {};
      const keys = Object.getOwnPropertyNames(component);
      
      for (const key of keys) {
        // Skip internal properties and methods
        if (key.startsWith('_') || typeof component[key] === 'function') {
          continue;
        }
        
        const value = component[key];
        
        // Handle different value types
        if (value === null || value === undefined) {
          data[key] = value;
        } else if (typeof value === 'object') {
          // Deep clone objects to avoid circular references
          try {
            data[key] = JSON.parse(JSON.stringify(value));
          } catch (error) {
            // Skip properties that can't be serialized
            console.warn(`Skipping property ${key} of ${type}: serialization failed`);
          }
        } else {
          // Primitive values
          data[key] = value;
        }
      }
      
      return {
        type,
        data
      };
    } catch (error) {
      consoleService.addLog('warning', `Failed to serialize component: ${type}`, error instanceof Error ? error.message : undefined);
      return null;
    }
  }
  
  /**
   * Deserialize component using generic approach with component registry
   * 使用组件注册表的通用方法反序列化组件
   */
  private async deserializeComponent(componentData: SerializedComponent): Promise<any | null> {
    const { type, data } = componentData;
    
    try {
      // Try to get component class from registry
      const componentClass = await this.getComponentClass(type);
      if (!componentClass) {
        consoleService.addLog('warning', `Unknown component type: ${type}`);
        return null;
      }
      
      // Check if component has custom deserialization method
      if (typeof componentClass.deserialize === 'function') {
        return componentClass.deserialize(data);
      }
      
      // Generic deserialization - create instance and set properties
      const component = new componentClass();
      
      // Set all properties from data
      for (const [key, value] of Object.entries(data)) {
        if (key in component) {
          try {
            (component as any)[key] = value;
          } catch (error) {
            console.warn(`Failed to set property ${key} on ${type}:`, error);
          }
        }
      }
      
      return component;
    } catch (error) {
      consoleService.addLog('error', `Failed to deserialize component: ${type}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
  }
  
  /**
   * Get component class by type name
   * 根据类型名称获取组件类
   */
  private async getComponentClass(type: string): Promise<any> {
    // Component type to module mapping
    const componentModules: Record<string, () => Promise<any>> = {
      'EditorMetadataComponent': () => import('@esengine/nova-ecs-core').then(m => m.EditorMetadataComponent),
      'TransformComponent': () => import('@esengine/nova-ecs-core').then(m => m.TransformComponent),
      'MeshRendererComponent': () => import('@esengine/nova-ecs-render-three').then(m => m.MeshRendererComponent),
      'BoxColliderComponent': () => import('../ecs/EditorWorld').then(m => m.BoxColliderComponent),
      'ThreeLightComponent': () => import('@esengine/nova-ecs-render-three').then(m => m.ThreeLightComponent),
      'ThreeCameraComponent': () => import('@esengine/nova-ecs-render-three').then(m => m.ThreeCameraComponent),
      'PhysicsTransformComponent': () => import('@esengine/nova-ecs-physics-core').then(m => m.PhysicsTransformComponent),
      'RigidBodyComponent': () => import('@esengine/nova-ecs-physics-core').then(m => m.RigidBodyComponent),
      'ColliderComponent': () => import('@esengine/nova-ecs-physics-core').then(m => m.ColliderComponent),
    };
    
    const moduleLoader = componentModules[type];
    if (moduleLoader) {
      try {
        return await moduleLoader();
      } catch (error) {
        console.error(`Failed to load component module for ${type}:`, error);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Save scene to file
   * 保存场景到文件
   */
  async saveSceneToFile(world: EditorWorld, filename?: string, metadata?: Partial<SerializedScene['metadata']>): Promise<void> {
    const sceneData = await this.serializeScene(world, metadata);
    const jsonString = JSON.stringify(sceneData, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${sceneData.metadata.name.replace(/\s+/g, '_')}.scene.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    consoleService.addLog('success', `Scene saved: ${a.download}`);
  }
  
  /**
   * Load scene from file
   * 从文件加载场景
   */
  async loadSceneFromFile(file: File, world: EditorWorld): Promise<void> {
    try {
      const text = await file.text();
      const sceneData: SerializedScene = JSON.parse(text);
      
      // Validate scene data
      if (!this.validateSceneData(sceneData)) {
        throw new Error('Invalid scene file format');
      }
      
      await this.deserializeScene(sceneData, world);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      consoleService.addLog('error', `Failed to load scene: ${message}`);
      throw error;
    }
  }
  
  /**
   * Save scene to asset database
   * 保存场景到资源数据库
   */
  async saveSceneToAssets(world: EditorWorld, sceneName: string, metadata?: Partial<SerializedScene['metadata']>): Promise<string> {
    const sceneData = await this.serializeScene(world, { ...metadata, name: sceneName });
    const jsonString = JSON.stringify(sceneData, null, 2);
    
    const assetMetadata: AssetMetadata = {
      id: `scene_${Date.now()}`,
      name: sceneName,
      filename: `${sceneName}.scene.json`,
      type: AssetType.Scene,
      size: jsonString.length,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      path: `scenes/${sceneName}.scene.json`,
      mimeType: 'application/json',
      parentId: null,
      metadata: {},
      tags: ['scene']
    };
    
    const data = new TextEncoder().encode(jsonString);
    await assetService.createAsset(assetMetadata, data);
    
    consoleService.addLog('success', `Scene saved to assets: ${sceneName}`);
    return assetMetadata.id;
  }
  
  /**
   * Load scene from asset database
   * 从资源数据库加载场景
   */
  async loadSceneFromAssets(assetId: string, world: EditorWorld): Promise<void> {
    try {
        const data = await assetService.getAssetData(assetId);
      if (!data) {
        throw new Error('Asset not found');
      }
      const arrayBuffer = await data.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      const sceneData: SerializedScene = JSON.parse(text);
      
      if (!this.validateSceneData(sceneData)) {
        throw new Error('Invalid scene file format');
      }
      
      await this.deserializeScene(sceneData, world);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      consoleService.addLog('error', `Failed to load scene from assets: ${message}`);
      console.error('Scene loading error:', error);
      throw error;
    }
  }
  
  /**
   * Validate scene data format
   * 验证场景数据格式
   */
  private validateSceneData(data: any): data is SerializedScene {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.timestamp) return false;
    if (!data.metadata || !data.entities || !Array.isArray(data.entities)) return false;
    if (!data.settings) return false;
    
    // Validate entities
    for (const entity of data.entities) {
      if (typeof entity.id !== 'number') return false;
      if (typeof entity.active !== 'boolean') return false;
      if (!Array.isArray(entity.components)) return false;
    }
    
    return true;
  }
  
  /**
   * Create scene template
   * 创建场景模板
   */
  createSceneTemplate(templateName: string): SerializedScene {
    const templates: Record<string, SerializedScene> = {
      empty: {
        version: this.VERSION,
        timestamp: Date.now(),
        metadata: {
          name: 'Empty Scene',
          description: 'A completely empty scene'
        },
        entities: [],
        settings: {
          physics: { gravity: { x: 0, y: -9.81 }, timeStep: 1/60 },
          rendering: {
            backgroundColor: '#1a1a1a',
            ambientLight: '#404040',
            fog: { enabled: false, color: '#1a1a1a', near: 10, far: 50 }
          }
        }
      },
      main: {
        version: this.VERSION,
        timestamp: Date.now(),
        metadata: {
          name: 'Main Scene',
          description: 'Default scene with camera and lighting setup',
          author: 'Nova Editor',
          tags: ['default', 'main']
        },
        entities: [
          {
            id: 1,
            active: true,
            components: [
              {
                type: 'EditorMetadataComponent',
                data: {
                  name: 'Main Camera',
                  tags: ['camera', 'main'],
                  layer: 'Default',
                  isStatic: false
                }
              },
              {
                type: 'TransformComponent',
                data: {
                  position: { x: 0, y: 2, z: 10 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  parentId: null
                }
              },
              {
                type: 'ThreeCameraComponent',
                data: {
                  fov: 75,
                  aspect: 1.777,
                  near: 0.1,
                  far: 1000,
                  zoom: 1,
                  isPerspective: true,
                  left: -1,
                  right: 1,
                  top: 1,
                  bottom: -1
                }
              }
            ]
          },
          {
            id: 2,
            active: true,
            components: [
              {
                type: 'EditorMetadataComponent',
                data: {
                  name: 'Directional Light',
                  tags: ['light', 'directional', 'main'],
                  layer: 'Default',
                  isStatic: true
                }
              },
              {
                type: 'TransformComponent',
                data: {
                  position: { x: 0, y: 10, z: 5 },
                  rotation: { x: -45, y: 30, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  parentId: null
                }
              },
              {
                type: 'ThreeLightComponent',
                data: {
                  lightType: 'directional',
                  color: '#ffffff',
                  intensity: 1.0,
                  castShadow: true,
                  distance: 0,
                  decay: 1,
                  angle: 1.0471975511965976,
                  penumbra: 0,
                  width: 10,
                  height: 10
                }
              }
            ]
          }
        ],
        settings: {
          physics: { gravity: { x: 0, y: -9.81 }, timeStep: 1/60 },
          rendering: {
            backgroundColor: '#2c2c2c',
            ambientLight: '#404040',
            fog: { enabled: false, color: '#2c2c2c', near: 10, far: 100 }
          }
        }
      },
      basic: {
        version: this.VERSION,
        timestamp: Date.now(),
        metadata: {
          name: 'Basic Scene',
          description: 'A basic scene with a ground plane and lighting'
        },
        entities: [
          {
            id: 1,
            active: true,
            components: [
              {
                type: 'EditorMetadataComponent',
                data: { name: 'Ground', tags: ['ground'], layer: 'Default', isStatic: true }
              },
              {
                type: 'TransformComponent',
                data: {
                  position: { x: 0, y: -0.5, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 10, y: 1, z: 10 },
                  parentId: null
                }
              },
              {
                type: 'MeshRendererComponent',
                data: {
                  material: 'GroundMaterial',
                  castShadows: false,
                  receiveShadows: true,
                  meshType: 'plane'
                }
              }
            ]
          }
        ],
        settings: {
          physics: { gravity: { x: 0, y: -9.81 }, timeStep: 1/60 },
          rendering: {
            backgroundColor: '#87CEEB',
            ambientLight: '#404040',
            fog: { enabled: true, color: '#87CEEB', near: 10, far: 50 }
          }
        }
      }
    };
    
    return templates[templateName] || templates.empty;
  }
  
  /**
   * Get scene statistics
   * 获取场景统计信息
   */
  getSceneStats(sceneData: SerializedScene) {
    const componentCounts = new Map<string, number>();
    
    for (const entity of sceneData.entities) {
      for (const component of entity.components) {
        const count = componentCounts.get(component.type) || 0;
        componentCounts.set(component.type, count + 1);
      }
    }
    
    return {
      entityCount: sceneData.entities.length,
      activeEntities: sceneData.entities.filter(e => e.active).length,
      componentCounts: Object.fromEntries(componentCounts),
      fileSize: JSON.stringify(sceneData).length,
      version: sceneData.version,
      timestamp: sceneData.timestamp
    };
  }
}

// Export singleton instance
export const sceneSerializer = new SceneSerializer();