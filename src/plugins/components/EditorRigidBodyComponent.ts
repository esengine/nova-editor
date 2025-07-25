/**
 * Editor Rigid Body Component - extends core RigidBodyComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { RigidBodyComponent, RigidBodyType } from '@esengine/nova-ecs-physics-core';
import { Fixed } from '@esengine/nova-ecs-math';

@component({
  displayName: 'Rigid Body',
  description: 'Adds physics rigid body properties to entity for physics simulation',
  icon: '🔲',
  category: 'Physics',
  order: 1,
  removable: true
})
export class EditorRigidBodyComponent extends RigidBodyComponent {
  @property({
    displayName: 'Body Type',
    description: 'Physics type of the rigid body',
    type: 'enum',
    options: ['static', 'kinematic', 'dynamic']
  })
  get editorType(): string {
    return this.type as string || 'dynamic';
  }
  
  set editorType(value: string) {
    this.type = value as RigidBodyType;
  }

  @property({
    displayName: 'Linear Damping',
    description: 'Resistance to linear motion',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1
  })
  get editorLinearDamping(): number {
    const damping = this.linearDamping as Fixed;
    return damping?.toNumber() || 0;
  }
  
  set editorLinearDamping(value: number) {
    this.linearDamping = new Fixed(value);
  }

  @property({
    displayName: 'Angular Damping',
    description: 'Resistance to rotational motion',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1
  })
  get editorAngularDamping(): number {
    const damping = this.angularDamping as Fixed;
    return damping?.toNumber() || 0;
  }
  
  set editorAngularDamping(value: number) {
    this.angularDamping = new Fixed(value);
  }

  @property({
    displayName: 'Gravity Scale',
    description: 'Multiplier for gravity affecting this object',
    type: 'number',
    min: 0,
    max: 5,
    step: 0.1
  })
  get editorGravityScale(): number {
    const scale = this.gravityScale as Fixed;
    return scale?.toNumber() || 1;
  }
  
  set editorGravityScale(value: number) {
    this.gravityScale = new Fixed(value);
  }

  @property({
    displayName: 'Allow Sleep',
    description: 'Allow body to sleep when at rest for performance',
    type: 'boolean'
  })
  declare allowSleep: boolean;

  @property({
    displayName: 'Fixed Rotation',
    description: 'Prevent body from rotating due to collisions',
    type: 'boolean'
  })
  declare fixedRotation: boolean;

  @property({
    displayName: 'Bullet Mode',
    description: 'Enable continuous collision detection for fast objects',
    type: 'boolean'
  })
  declare bullet: boolean;
}