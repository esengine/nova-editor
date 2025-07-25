/**
 * Scene serialization system for saving and loading scenes
 * 场景序列化系统，用于保存和加载场景
 */

import { EditorWorld, MeshRendererComponent, BoxColliderComponent } from '../ecs';
import { EditorMetadataComponent, TransformComponent } from '@esengine/nova-ecs-core';
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
    console.log('Deserializing scene:', sceneData.metadata.name);
    console.log('Entities to create:', sceneData.entities.length);
    
    // Clear existing entities
    const existingEntities = [...world.entities];
    console.log('Clearing existing entities:', existingEntities.length);
    for (const entity of existingEntities) {
      world.removeEntity(entity.id);
    }
    
    // Create entities from serialized data
    for (const entityData of sceneData.entities) {
      console.log('Creating entity:', entityData);
      const entity = world.createEntity();
      entity.active = entityData.active;
      
      // Add components
      for (const componentData of entityData.components) {
        console.log('Deserializing component:', componentData);
        const component = await this.deserializeComponent(componentData);
        if (component) {
          console.log('Adding component to entity:', component);
          entity.addComponent(component);
        } else {
          console.warn('Failed to deserialize component:', componentData);
        }
      }
    }
    
    console.log('Final world entity count:', world.entities.length);
    consoleService.addLog('success', `Loaded scene: ${sceneData.metadata.name} (${sceneData.entities.length} entities)`);
  }
  
  /**
   * Serialize component
   * 序列化组件
   */
  private async serializeComponent(component: any): Promise<SerializedComponent | null> {
    const type = component.constructor.name;
    
    switch (type) {
      case 'EditorMetadataComponent':
        return {
          type,
          data: {
            name: component.name,
            tags: component.tags,
            layer: component.layer,
            isStatic: component.isStatic
          }
        };
        
      case 'TransformComponent':
        return {
          type,
          data: {
            position: { ...component.position },
            rotation: { ...component.rotation },
            scale: { ...component.scale },
            parentId: component.parentId
          }
        };
        
      case 'MeshRendererComponent':
        return {
          type,
          data: {
            material: component.material,
            castShadows: component.castShadows,
            receiveShadows: component.receiveShadows,
            meshType: component.meshType
          }
        };
        
      case 'BoxColliderComponent':
        return {
          type,
          data: {
            size: { ...component.size },
            center: { ...component.center },
            isTrigger: component.isTrigger
          }
        };
        
      default:
        // Generic serialization for unknown components
        try {
          return {
            type,
            data: JSON.parse(JSON.stringify(component))
          };
        } catch (error) {
          consoleService.addLog('warning', `Failed to serialize component: ${type}`);
          return null;
        }
    }
  }
  
  /**
   * Deserialize component
   * 反序列化组件
   */
  private async deserializeComponent(componentData: SerializedComponent): Promise<any | null> {
    const { type, data } = componentData;
    
    try {
      switch (type) {
        case 'EditorMetadataComponent':
          const metadata = new EditorMetadataComponent(data.name);
          if (data.tag !== undefined) metadata.tag = data.tag;
          if (data.layer !== undefined) metadata.layer = data.layer;
          return metadata;
          
        case 'TransformComponent':
          const transform = new TransformComponent();
          if (data.position !== undefined) transform.position = data.position;
          if (data.rotation !== undefined) transform.rotation = data.rotation;
          if (data.scale !== undefined) transform.scale = data.scale;
          return transform;
          
        case 'MeshRendererComponent':
          return new MeshRendererComponent(
            data.material,
            data.castShadows,
            data.receiveShadows,
            data.meshType
          );
          
        case 'BoxColliderComponent':
          return new BoxColliderComponent(
            data.size,
            data.center,
            data.isTrigger
          );
          
        default:
          consoleService.addLog('warning', `Unknown component type: ${type}`);
          return null;
      }
    } catch (error) {
      consoleService.addLog('error', `Failed to deserialize component: ${type}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
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
      console.log('Loading scene from asset ID:', assetId);
      const data = await assetService.getAssetData(assetId);
      if (!data) {
        throw new Error('Asset not found');
      }
      console.log('Asset data found, size:', data.size);
      const arrayBuffer = await data.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      console.log('Scene file content:', text);
      const sceneData: SerializedScene = JSON.parse(text);
      
      if (!this.validateSceneData(sceneData)) {
        throw new Error('Invalid scene file format');
      }
      
      console.log('Scene data valid, deserializing...', sceneData);
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