/**
 * Editor Physics Transform Component - extends core PhysicsTransformComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { PhysicsTransformComponent } from '@esengine/nova-ecs-physics-core';
import { FixedVector2, Fixed } from '@esengine/nova-ecs-math';

@component({
  displayName: 'Physics Transform',
  description: 'Stores transform information used by the physics system',
  icon: '🌐',
  category: 'Physics',
  order: 4,
  removable: false
})
export class EditorPhysicsTransformComponent extends PhysicsTransformComponent {
  @property({
    displayName: 'Position',
    description: 'Position coordinates in physics space',
    type: 'vector3',
    readonly: true
  })
  get editorPosition(): { x: number; y: number } {
    const pos = this.position as FixedVector2;
    return { x: pos?.x?.toNumber() || 0, y: pos?.y?.toNumber() || 0 };
  }

  @property({
    displayName: 'Rotation',
    description: 'Rotation angle in physics space (radians)',
    type: 'number',
    readonly: true
  })
  get editorRotation(): number {
    const rot = this.rotation as Fixed;
    return rot?.toNumber() || 0;
  }

  @property({
    displayName: 'Previous Position',
    description: 'Previous frame position for interpolation',
    type: 'vector3',
    readonly: true
  })
  get editorPreviousPosition(): { x: number; y: number } {
    const prevPos = this.previousPosition as FixedVector2;
    return { x: prevPos?.x?.toNumber() || 0, y: prevPos?.y?.toNumber() || 0 };
  }

  @property({
    displayName: 'Previous Rotation',
    description: 'Previous frame rotation for interpolation',
    type: 'number',
    readonly: true
  })
  get editorPreviousRotation(): number {
    const prevRot = this.previousRotation as Fixed;
    return prevRot?.toNumber() || 0;
  }
}