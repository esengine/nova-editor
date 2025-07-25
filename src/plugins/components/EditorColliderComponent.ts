/**
 * Editor Collider Component - extends core ColliderComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { ColliderComponent } from '@esengine/nova-ecs-physics-core';

@component({
  displayName: 'Collider',
  description: 'Defines collision boundaries and physics material for the entity',
  icon: '🔳',
  category: 'Physics',
  order: 2,
  removable: true
})
export class EditorColliderComponent extends ColliderComponent {
  @property({
    displayName: 'Is Sensor',
    description: 'When enabled, collider only detects overlaps without physical response',
    type: 'boolean'
  })
  declare isSensor: boolean;

  @property({
    displayName: 'Friction',
    description: 'Surface friction coefficient (0 = no friction, 1 = high friction)',
    type: 'number',
    min: 0,
    max: 2,
    step: 0.1
  })
  get friction(): number {
    return this.material?.friction?.toNumber() || 0.3;
  }

  @property({
    displayName: 'Restitution',
    description: 'Bounciness after collision (0 = no bounce, 1 = perfect bounce)',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.1
  })
  get restitution(): number {
    return this.material?.restitution?.toNumber() || 0.1;
  }

  @property({
    displayName: 'Density',
    description: 'Material density, affects object mass',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1
  })
  get density(): number {
    return this.material?.density?.toNumber() || 1.0;
  }
}