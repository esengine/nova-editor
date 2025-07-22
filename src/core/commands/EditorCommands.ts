/**
 * Specific editor commands for Nova Editor
 * Nova编辑器的具体命令实现
 */

import { BaseCommand, type Command } from './Command';
import type { EditorWorld } from '../../ecs/EditorWorld';
import type { Component } from '@esengine/nova-ecs';
import { TransformComponent, MeshRendererComponent, EditorMetadataComponent } from '../../ecs';
import type { Vector3 } from '../../types';

/**
 * Create entity command
 * 创建实体命令
 */
export class CreateEntityCommand extends BaseCommand {
  private createdEntityId: number | null = null;

  constructor(
    private world: EditorWorld,
    private entityName?: string
  ) {
    super('Create Entity', `Create new entity${entityName ? ` "${entityName}"` : ''}`);
  }

  execute(): void {
    const entity = this.world.createEntity();
    this.createdEntityId = entity.id;

    // Add default components
    entity.addComponent(new TransformComponent());
    entity.addComponent(new EditorMetadataComponent(
      this.entityName || `Entity_${entity.id}`
    ));

    console.log(`Created entity ${this.createdEntityId}`);
  }

  undo(): void {
    if (this.createdEntityId !== null) {
      this.world.removeEntity(this.createdEntityId);
      console.log(`Removed entity ${this.createdEntityId}`);
      this.createdEntityId = null;
    }
  }

  getEntityId(): number | null {
    return this.createdEntityId;
  }
}

/**
 * Delete entity command
 * 删除实体命令
 */
export class DeleteEntityCommand extends BaseCommand {
  private entityData: any = null;

  constructor(
    private world: EditorWorld,
    private entityId: number
  ) {
    super('Delete Entity', `Delete entity ${entityId}`);
  }

  execute(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity) {
      throw new Error(`Entity ${this.entityId} not found`);
    }

    // Store entity data before deletion
    const components = [];
    
    const transform = entity.getComponent(TransformComponent);
    if (transform) {
      components.push({ type: 'TransformComponent', data: this.serializeComponent(transform) });
    }
    
    const metadata = entity.getComponent(EditorMetadataComponent);
    if (metadata) {
      components.push({ type: 'EditorMetadataComponent', data: this.serializeComponent(metadata) });
    }
    
    const meshRenderer = entity.getComponent(MeshRendererComponent);
    if (meshRenderer) {
      components.push({ type: 'MeshRendererComponent', data: this.serializeComponent(meshRenderer) });
    }

    this.entityData = {
      id: entity.id,
      components: components
    };

    this.world.removeEntity(this.entityId);
    console.log(`Deleted entity ${this.entityId}`);
  }

  undo(): void {
    if (!this.entityData) return;

    const entity = this.world.createEntity();
    
    // Restore components
    for (const componentInfo of this.entityData.components) {
      const component = this.deserializeComponent(componentInfo.type, componentInfo.data);
      if (component) {
        entity.addComponent(component);
      }
    }

    console.log(`Restored entity ${entity.id}`);
  }

  private serializeComponent(component: Component | null | undefined): any {
    if (!component) return null;
    
    if (component instanceof TransformComponent) {
      return {
        position: { ...component.position },
        rotation: { ...component.rotation },
        scale: { ...component.scale }
      };
    }
    if (component instanceof EditorMetadataComponent) {
      return {
        name: component.name
      };
    }
    if (component instanceof MeshRendererComponent) {
      return {
        meshType: component.meshType,
        material: component.material
      };
    }
    return {};
  }

  private deserializeComponent(type: string, data: any): Component | null {
    switch (type) {
      case 'TransformComponent':
        const transform = new TransformComponent();
        if (data.position) Object.assign(transform.position, data.position);
        if (data.rotation) Object.assign(transform.rotation, data.rotation);
        if (data.scale) Object.assign(transform.scale, data.scale);
        return transform;
      
      case 'EditorMetadataComponent':
        return new EditorMetadataComponent(data.name || 'Entity');
      
      case 'MeshRendererComponent':
        return new MeshRendererComponent(data.meshType || 'box', data.material || 'DefaultMaterial');
      
      default:
        return null;
    }
  }
}

/**
 * Transform entity command
 * 变换实体命令
 */
export class TransformEntityCommand extends BaseCommand {
  private oldTransform: { position: Vector3; rotation: Vector3; scale: Vector3 } | null = null;

  constructor(
    private world: EditorWorld,
    private entityId: number,
    private newTransform: { position?: Vector3; rotation?: Vector3; scale?: Vector3 },
    private transformType: 'translate' | 'rotate' | 'scale' = 'translate'
  ) {
    super(
      `${transformType.charAt(0).toUpperCase() + transformType.slice(1)} Entity`,
      `${transformType} entity ${entityId}`
    );
  }

  execute(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity) {
      throw new Error(`Entity ${this.entityId} not found`);
    }

    const transform = entity.getComponent(TransformComponent);
    if (!transform) {
      throw new Error(`Entity ${this.entityId} has no transform component`);
    }

    // Store old transform
    this.oldTransform = {
      position: { ...transform.position },
      rotation: { ...transform.rotation },
      scale: { ...transform.scale }
    };

    // Apply new transform
    if (this.newTransform.position) {
      Object.assign(transform.position, this.newTransform.position);
    }
    if (this.newTransform.rotation) {
      Object.assign(transform.rotation, this.newTransform.rotation);
    }
    if (this.newTransform.scale) {
      Object.assign(transform.scale, this.newTransform.scale);
    }
  }

  undo(): void {
    if (!this.oldTransform) return;

    const entity = this.world.getEntity(this.entityId);
    if (!entity) return;

    const transform = entity.getComponent(TransformComponent);
    if (!transform) return;

    // Restore old transform
    Object.assign(transform.position, this.oldTransform.position);
    Object.assign(transform.rotation, this.oldTransform.rotation);
    Object.assign(transform.scale, this.oldTransform.scale);
  }

  canMerge(other: Command): boolean {
    if (!(other instanceof TransformEntityCommand)) return false;
    if (other.entityId !== this.entityId) return false;
    if (other.transformType !== this.transformType) return false;
    
    // Allow merging within 500ms
    return (other.timestamp - this.timestamp) <= 500;
  }

  merge(other: Command): Command {
    if (!(other instanceof TransformEntityCommand)) {
      throw new Error('Cannot merge with non-transform command');
    }
    
    // Keep the old transform from this command and new transform from other
    return new TransformEntityCommand(
      this.world,
      this.entityId,
      other.newTransform,
      this.transformType
    );
  }
}

/**
 * Add component command
 * 添加组件命令
 */
export class AddComponentCommand extends BaseCommand {
  constructor(
    private world: EditorWorld,
    private entityId: number,
    private componentType: string,
    private componentData?: any
  ) {
    super('Add Component', `Add ${componentType} to entity ${entityId}`);
  }

  execute(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity) {
      throw new Error(`Entity ${this.entityId} not found`);
    }

    let component: Component | null = null;
    
    switch (this.componentType) {
      case 'MeshRenderer':
        component = new MeshRendererComponent(
          this.componentData?.meshType || 'box',
          this.componentData?.material || 'DefaultMaterial'
        );
        break;
      default:
        throw new Error(`Unknown component type: ${this.componentType}`);
    }

    if (component) {
      entity.addComponent(component);
    }
  }

  undo(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity) return;

    switch (this.componentType) {
      case 'MeshRenderer':
        const meshRenderer = entity.getComponent(MeshRendererComponent);
        if (meshRenderer) {
          entity.removeComponent(MeshRendererComponent);
        }
        break;
    }
  }
}

/**
 * Remove component command
 * 移除组件命令
 */
export class RemoveComponentCommand extends BaseCommand {
  private componentData: any = null;

  constructor(
    private world: EditorWorld,
    private entityId: number,
    private componentType: string
  ) {
    super('Remove Component', `Remove ${componentType} from entity ${entityId}`);
  }

  execute(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity) {
      throw new Error(`Entity ${this.entityId} not found`);
    }

    switch (this.componentType) {
      case 'MeshRenderer':
        const meshRenderer = entity.getComponent(MeshRendererComponent);
        if (meshRenderer) {
          this.componentData = {
            meshType: meshRenderer.meshType,
            material: meshRenderer.material
          };
          entity.removeComponent(MeshRendererComponent);
        }
        break;
    }
  }

  undo(): void {
    const entity = this.world.getEntity(this.entityId);
    if (!entity || !this.componentData) return;

    switch (this.componentType) {
      case 'MeshRenderer':
        const component = new MeshRendererComponent(
          this.componentData.meshType,
          this.componentData.material
        );
        entity.addComponent(component);
        break;
    }
  }
}