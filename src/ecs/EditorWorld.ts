/**
 * EditorWorld - Extended NovaECS World for editor integration
 * 编辑器世界 - 为编辑器集成扩展的NovaECS世界
 */

import { World, Entity, Component, type EntityId } from '@esengine/nova-ecs';
import { EditorEvents } from './EditorEvents';

/**
 * EditorWorld extends NovaECS World with editor-specific functionality
 * EditorWorld扩展NovaECS世界，提供编辑器特定功能
 */
export class EditorWorld extends World {
  private readonly _editorEvents = new EditorEvents();
  private readonly _selectedEntities = new Set<EntityId>();
  private _primarySelection: EntityId | null = null;

  /**
   * Get editor event system
   * 获取编辑器事件系统
   */
  get editorEvents(): EditorEvents {
    return this._editorEvents;
  }

  /**
   * Get selected entities
   * 获取选中的实体
   */
  get selectedEntities(): EntityId[] {
    return Array.from(this._selectedEntities);
  }

  /**
   * Get primary selected entity
   * 获取主要选中的实体
   */
  get primarySelection(): EntityId | null {
    return this._primarySelection;
  }

  /**
   * Select entity (adds to selection)
   * 选择实体（添加到选择中）
   */
  selectEntity(entityId: EntityId, addToSelection = false): void {
    if (!addToSelection) {
      this._selectedEntities.clear();
    }
    
    this._selectedEntities.add(entityId);
    this._primarySelection = entityId;
    
    this._editorEvents.emit('entitySelected', {
      entityId,
      selectedEntities: this.selectedEntities,
      primarySelection: this._primarySelection
    });
  }

  /**
   * Deselect entity
   * 取消选择实体
   */
  deselectEntity(entityId: EntityId): void {
    this._selectedEntities.delete(entityId);
    
    if (this._primarySelection === entityId) {
      this._primarySelection = this._selectedEntities.size > 0 
        ? Array.from(this._selectedEntities)[0] 
        : null;
    }
    
    this._editorEvents.emit('entityDeselected', {
      entityId,
      selectedEntities: this.selectedEntities,
      primarySelection: this._primarySelection
    });
  }

  /**
   * Clear all selections
   * 清除所有选择
   */
  clearSelection(): void {
    this._selectedEntities.clear();
    this._primarySelection = null;
    
    this._editorEvents.emit('selectionCleared', {
      selectedEntities: [],
      primarySelection: null
    });
  }

  /**
   * Check if entity is selected
   * 检查实体是否被选中
   */
  isEntitySelected(entityId: EntityId): boolean {
    return this._selectedEntities.has(entityId);
  }

  /**
   * Create entity with optional name
   * 创建带可选名称的实体
   */
  createNamedEntity(name?: string): Entity {
    const entity = this.createEntity();
    
    // Add editor metadata if name provided
    if (name) {
      entity.addComponent(new EditorMetadataComponent(name));
    }
    
    this._editorEvents.emit('entityCreated', {
      entityId: entity.id,
      name: name || `Entity_${entity.id}`
    });
    
    return entity;
  }

  /**
   * Override removeEntity to handle selection cleanup
   * 重写removeEntity以处理选择清理
   */
  override removeEntity(entityOrId: Entity | EntityId): this {
    const id = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    
    // Clean up selection
    if (this._selectedEntities.has(id)) {
      this.deselectEntity(id);
    }
    
    this._editorEvents.emit('entityDestroyed', { entityId: id });
    
    return super.removeEntity(entityOrId);
  }

  /**
   * Get entity hierarchy (entities with their children)
   * 获取实体层次结构（实体及其子级）
   */
  getEntityHierarchy(): EntityHierarchyNode[] {
    const entities = this.entities;
    const hierarchyMap = new Map<EntityId, EntityHierarchyNode>();
    const rootEntities: EntityHierarchyNode[] = [];

    // Create hierarchy nodes
    for (const entity of entities) {
      const metadata = entity.getComponent(EditorMetadataComponent);
      const transform = entity.getComponent(TransformComponent);
      
      const node: EntityHierarchyNode = {
        id: entity.id,
        name: metadata?.name || `Entity_${entity.id}`,
        active: entity.active,
        children: [],
        parentId: transform?.parentId || null
      };
      
      hierarchyMap.set(entity.id, node);
    }

    // Build hierarchy relationships
    for (const node of hierarchyMap.values()) {
      if (node.parentId && hierarchyMap.has(node.parentId)) {
        hierarchyMap.get(node.parentId)!.children.push(node);
      } else {
        rootEntities.push(node);
      }
    }

    return rootEntities;
  }

  /**
   * Dispose editor world
   * 处理编辑器世界
   */
  override dispose(): void {
    this._editorEvents.removeAllListeners();
    super.dispose();
  }
}

/**
 * Editor metadata component for entity names and editor-specific data
 * 编辑器元数据组件，用于实体名称和编辑器特定数据
 */
export class EditorMetadataComponent extends Component {
  constructor(
    public name: string = '',
    public tags: string[] = [],
    public layer: string = 'Default',
    public isStatic: boolean = false
  ) {
    super();
  }
}

/**
 * Transform component for 3D position, rotation, and scale
 * 3D位置、旋转和缩放的变换组件
 */
export class TransformComponent extends Component {
  constructor(
    public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 },
    public parentId: EntityId | null = null
  ) {
    super();
  }
}

/**
 * Mesh renderer component for 3D rendering
 * 3D渲染的网格渲染器组件
 */
export class MeshRendererComponent extends Component {
  constructor(
    public material: string = 'DefaultMaterial',
    public castShadows: boolean = true,
    public receiveShadows: boolean = true,
    public meshType: 'box' | 'sphere' | 'plane' | 'custom' = 'box'
  ) {
    super();
  }
}

/**
 * Box collider component for physics
 * 物理碰撞的盒子碰撞器组件
 */
export class BoxColliderComponent extends Component {
  constructor(
    public size: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 },
    public center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public isTrigger: boolean = false
  ) {
    super();
  }
}

/**
 * Entity hierarchy node for tree display
 * 树形显示的实体层次节点
 */
export interface EntityHierarchyNode {
  id: EntityId;
  name: string;
  active: boolean;
  children: EntityHierarchyNode[];
  parentId: EntityId | null;
}