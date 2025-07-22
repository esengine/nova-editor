/**
 * EditorEvents - Event system for editor-specific events
 * 编辑器事件 - 编辑器特定事件的事件系统
 */

import type { EntityId } from '@esengine/nova-ecs';

/**
 * Editor event types and their payload interfaces
 * 编辑器事件类型及其载荷接口
 */
export interface EditorEventMap {
  entitySelected: {
    entityId: EntityId;
    selectedEntities: EntityId[];
    primarySelection: EntityId | null;
  };
  
  entityDeselected: {
    entityId: EntityId;
    selectedEntities: EntityId[];
    primarySelection: EntityId | null;
  };
  
  selectionCleared: {
    selectedEntities: EntityId[];
    primarySelection: EntityId | null;
  };
  
  entityCreated: {
    entityId: EntityId;
    name: string;
  };
  
  entityDestroyed: {
    entityId: EntityId;
  };
  
  entityRenamed: {
    entityId: EntityId;
    oldName: string;
    newName: string;
  };
  
  componentAdded: {
    entityId: EntityId;
    componentType: string;
  };
  
  componentRemoved: {
    entityId: EntityId;
    componentType: string;
  };
  
  propertyChanged: {
    entityId: EntityId;
    componentType: string;
    property: string;
    oldValue: unknown;
    newValue: unknown;
  };
}

export type EditorEventType = keyof EditorEventMap;
export type EditorEventPayload<T extends EditorEventType> = EditorEventMap[T];
export type EditorEventListener<T extends EditorEventType> = (payload: EditorEventPayload<T>) => void;

/**
 * Simple event emitter for editor events
 * 编辑器事件的简单事件发射器
 */
export class EditorEvents {
  private readonly _listeners = new Map<EditorEventType, Set<EditorEventListener<any>>>();

  /**
   * Subscribe to an editor event
   * 订阅编辑器事件
   */
  on<T extends EditorEventType>(
    eventType: T,
    listener: EditorEventListener<T>
  ): () => void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    
    this._listeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this._listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Subscribe to an event that only fires once
   * 订阅只触发一次的事件
   */
  once<T extends EditorEventType>(
    eventType: T,
    listener: EditorEventListener<T>
  ): () => void {
    const oneTimeListener = (payload: EditorEventPayload<T>) => {
      listener(payload);
      unsubscribe();
    };
    
    const unsubscribe = this.on(eventType, oneTimeListener);
    return unsubscribe;
  }

  /**
   * Emit an editor event
   * 发射编辑器事件
   */
  emit<T extends EditorEventType>(
    eventType: T,
    payload: EditorEventPayload<T>
  ): void {
    const listeners = this._listeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in editor event listener for ${eventType}:`, error);
        }
      }
    }
  }

  /**
   * Remove a specific listener
   * 移除特定监听器
   */
  off<T extends EditorEventType>(
    eventType: T,
    listener: EditorEventListener<T>
  ): void {
    this._listeners.get(eventType)?.delete(listener);
  }

  /**
   * Remove all listeners for an event type
   * 移除某种事件类型的所有监听器
   */
  removeAllListeners(eventType?: EditorEventType): void {
    if (eventType) {
      this._listeners.delete(eventType);
    } else {
      this._listeners.clear();
    }
  }

  /**
   * Get listener count for an event type
   * 获取某种事件类型的监听器数量
   */
  getListenerCount(eventType: EditorEventType): number {
    return this._listeners.get(eventType)?.size || 0;
  }
}