/**
 * EditorStoreIntegration - Bridge between EditorWorld and Zustand store
 * 编辑器存储集成 - EditorWorld和Zustand存储之间的桥梁
 */

import type { EditorWorld } from './EditorWorld';
import type { EntityId } from '@esengine/nova-ecs';

/**
 * Simplified store interface for integration
 * 集成的简化存储接口
 */
interface StoreInterface {
  setState: (updater: any) => void;
  getState: () => any;
}

/**
 * Integration layer that syncs EditorWorld state with the Zustand store
 * 将EditorWorld状态与Zustand存储同步的集成层
 */
export class EditorStoreIntegration {
  private readonly _world: EditorWorld;
  private readonly _store: StoreInterface;
  private readonly _unsubscribers: Array<() => void> = [];

  constructor(world: EditorWorld, store: StoreInterface) {
    this._world = world;
    this._store = store;
    this._setupEventListeners();
  }

  /**
   * Setup event listeners to sync world events with store
   * 设置事件监听器以将世界事件与存储同步
   */
  private _setupEventListeners(): void {
    // Entity selection events
    this._unsubscribers.push(
      this._world.editorEvents.on('entitySelected', ({ selectedEntities, primarySelection }) => {
        this._store.setState((state: any) => {
          state.selection.selectedEntities = selectedEntities;
          state.selection.primarySelection = primarySelection;
        });
      })
    );

    this._unsubscribers.push(
      this._world.editorEvents.on('entityDeselected', ({ selectedEntities, primarySelection }) => {
        this._store.setState((state: any) => {
          state.selection.selectedEntities = selectedEntities;
          state.selection.primarySelection = primarySelection;
        });
      })
    );

    this._unsubscribers.push(
      this._world.editorEvents.on('selectionCleared', ({ selectedEntities, primarySelection }) => {
        this._store.setState((state: any) => {
          state.selection.selectedEntities = selectedEntities;
          state.selection.primarySelection = primarySelection;
        });
      })
    );

    // Entity lifecycle events
    this._unsubscribers.push(
      this._world.editorEvents.on('entityCreated', () => {
        this._updateHierarchy();
      })
    );

    this._unsubscribers.push(
      this._world.editorEvents.on('entityDestroyed', () => {
        this._updateHierarchy();
      })
    );

    this._unsubscribers.push(
      this._world.editorEvents.on('entityRenamed', () => {
        this._updateHierarchy();
      })
    );
  }

  /**
   * Update hierarchy in store from world state
   * 从世界状态更新存储中的层次结构
   */
  private _updateHierarchy(): void {
    const hierarchy = this._world.getEntityHierarchy();
    this._store.setState((state: any) => {
      state.world.entityHierarchy = hierarchy;
    });
  }

  /**
   * Sync store actions with world operations
   * 将存储操作与世界操作同步
   */
  getStoreActions() {
    return {
      // Entity selection
      selectEntity: (entityId: EntityId, addToSelection = false) => {
        this._world.selectEntity(entityId, addToSelection);
      },

      deselectEntity: (entityId: EntityId) => {
        this._world.deselectEntity(entityId);
      },

      clearSelection: () => {
        this._world.clearSelection();
      },

      // Entity creation (for direct internal use, UI should use store actions)
      createEntity: (name?: string) => {
        console.warn('EditorStoreIntegration.createEntity called directly - prefer using store actions');
        const entityName = name || `Entity_${Date.now()}`;
        const entity = this._world.createEntity();
        
        // Add editor metadata component
        entity.addComponent(new EditorMetadataComponent(entityName));
        
        // Add default Transform component if not present
        if (!entity.getComponent(TransformComponent)) {
          entity.addComponent(new TransformComponent());
        }
        
        this._world.editorEvents.emit('entityCreated', {
          entityId: entity.id,
          name: entityName
        });
        
        this._updateHierarchy();
        return entity;
      },

      // Entity removal
      removeEntity: (entityId: EntityId) => {
        this._world.removeEntity(entityId);
        this._updateHierarchy();
      },

      // Entity property changes
      setEntityName: (entityId: EntityId, name: string) => {
        const entity = this._world.getEntity(entityId);
        if (entity) {
          let metadata = entity.getComponent(EditorMetadataComponent) as EditorMetadataComponent;
          if (!metadata) {
            // Create metadata component if it doesn't exist
            metadata = new EditorMetadataComponent(name);
            entity.addComponent(metadata);
          } else {
            const oldName = metadata.name;
            metadata.name = name;
            this._world.editorEvents.emit('entityRenamed', {
              entityId,
              oldName,
              newName: name
            });
          }
          this._updateHierarchy();
        }
      },

      setEntityActive: (entityId: EntityId, active: boolean) => {
        const entity = this._world.getEntity(entityId);
        if (entity) {
          entity.active = active;
          this._updateHierarchy();
        }
      },

      // Component operations
      addComponent: (entityId: EntityId, componentType: string) => {
        const entity = this._world.getEntity(entityId);
        if (entity) {
          const component = this._createComponentByType(componentType);
          if (component) {
            entity.addComponent(component);
            this._world.editorEvents.emit('componentAdded', {
              entityId,
              componentType
            });
            // Update hierarchy to trigger UI refresh
            this._updateHierarchy();
          }
        }
      },

      removeComponent: (entityId: EntityId, componentType: string) => {
        const entity = this._world.getEntity(entityId);
        if (entity) {
          const ComponentClass = this._getComponentClassByType(componentType);
          if (ComponentClass) {
            entity.removeComponent(ComponentClass);
            this._world.editorEvents.emit('componentRemoved', {
              entityId,
              componentType
            });
            // Update hierarchy to trigger UI refresh
            this._updateHierarchy();
          }
        }
      },

      // Property updates
      updateComponentProperty: (
        entityId: EntityId,
        componentType: string,
        property: string,
        value: unknown
      ) => {
        const entity = this._world.getEntity(entityId);
        if (entity) {
          const ComponentClass = this._getComponentClassByType(componentType);
          if (ComponentClass) {
            const component = entity.getComponent(ComponentClass);
            if (component && property in component) {
              const oldValue = (component as any)[property];
              (component as any)[property] = value;
              
              this._world.editorEvents.emit('propertyChanged', {
                entityId,
                componentType,
                property,
                oldValue,
                newValue: value
              });
              
              // Don't update hierarchy for property changes to avoid input disruption
              // Property changes don't affect entity hierarchy structure
            }
          }
        }
      },

      // World operations
      updateWorld: (deltaTime: number) => {
        this._world.update(deltaTime);
      },

      getWorld: () => this._world,

      // Initialize with sample data (removed to prevent auto-creation)
      initializeSampleData: () => {
        // Sample data creation disabled
        console.log('Sample data creation is disabled');
      }
    };
  }

  /**
   * Create component instance by type string
   * 通过类型字符串创建组件实例
   */
  private _createComponentByType(componentType: string): Component | null {
    switch (componentType) {
      case 'MeshRenderer':
        return new MeshRendererComponent();
      case 'BoxCollider':
        return new BoxColliderComponent();
      case 'SphereCollider':
        return new SphereColliderComponent();
      case 'RigidBody':
        return new RigidBodyComponent();
      case 'AudioSource':
        return new AudioSourceComponent();
      case 'Light':
        return new LightComponent();
      case 'Camera':
        return new CameraComponent();
      default:
        return null;
    }
  }

  /**
   * Get component class by type string
   * 通过类型字符串获取组件类
   */
  private _getComponentClassByType(componentType: string): any {
    // Normalize component type name (remove "Component" suffix if present)
    const normalizedType = componentType.endsWith('Component') 
      ? componentType.slice(0, -'Component'.length)
      : componentType;
    
    switch (normalizedType) {
      case 'Transform':
        return TransformComponent;
      case 'MeshRenderer':
        return MeshRendererComponent;
      case 'BoxCollider':
        return BoxColliderComponent;
      case 'SphereCollider':
        return SphereColliderComponent;
      case 'RigidBody':
        return RigidBodyComponent;
      case 'AudioSource':
        return AudioSourceComponent;
      case 'Light':
        return LightComponent;
      case 'Camera':
        return CameraComponent;
      default:
        console.warn('Unknown component type:', componentType, 'normalized to:', normalizedType);
        return null;
    }
  }


  /**
   * Dispose integration and cleanup
   * 处理集成和清理
   */
  dispose(): void {
    this._unsubscribers.forEach(unsubscribe => unsubscribe());
    this._unsubscribers.length = 0;
  }
}

// Import component types for type checking
import { EditorMetadataComponent, TransformComponent } from '@esengine/nova-ecs-core';
import { MeshRendererComponent } from '@esengine/nova-ecs-render-three';
import { BoxColliderComponent } from './EditorWorld';
import { Component } from '@esengine/nova-ecs';

// Additional component types for editor functionality
export class SphereColliderComponent extends Component {
  constructor(
    public radius: number = 0.5,
    public center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public isTrigger: boolean = false
  ) {
    super();
  }
}

export class RigidBodyComponent extends Component {
  constructor(
    public mass: number = 1.0,
    public drag: number = 0.0,
    public angularDrag: number = 0.05,
    public useGravity: boolean = true
  ) {
    super();
  }
}

export class AudioSourceComponent extends Component {
  constructor(
    public clip: string | null = null,
    public volume: number = 1.0,
    public pitch: number = 1.0,
    public loop: boolean = false,
    public playOnAwake: boolean = true
  ) {
    super();
  }
}

export class LightComponent extends Component {
  constructor(
    public type: 'directional' | 'point' | 'spot' = 'directional',
    public color: { r: number; g: number; b: number } = { r: 1, g: 1, b: 1 },
    public intensity: number = 1.0,
    public range: number = 10.0,
    public angle: number = 30.0
  ) {
    super();
  }
}

export class CameraComponent extends Component {
  constructor(
    public fov: number = 75,
    public near: number = 0.1,
    public far: number = 1000,
    public orthographic: boolean = false,
    public orthographicSize: number = 5
  ) {
    super();
  }
}