/**
 * Editor Transform Component - extends core TransformComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { TransformComponent } from '@esengine/nova-ecs-core';

@component({
  displayName: 'Transform',
  description: 'Controls entity position, rotation and scale in 3D space',
  icon: '📍',
  category: 'Core',
  order: 0,
  removable: false
})
export class EditorTransformComponent extends TransformComponent {
  @property({
    displayName: 'Position',
    description: 'Entity position coordinates in 3D space',
    type: 'vector3'
  })
  declare position: { x: number; y: number; z: number };

  @property({
    displayName: 'Rotation',
    description: 'Entity rotation angles (Euler angles in degrees)',
    type: 'vector3'
  })
  declare rotation: { x: number; y: number; z: number };

  @property({
    displayName: 'Scale',
    description: 'Entity scale ratio on each axis',
    type: 'vector3'
  })
  declare scale: { x: number; y: number; z: number };

  @property({
    displayName: 'Parent ID',
    description: 'Parent entity ID (hierarchy relationship)',
    type: 'number',
    readonly: true
  })
  declare parentId: number | null;
}