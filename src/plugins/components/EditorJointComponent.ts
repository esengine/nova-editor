/**
 * Editor Joint Component - extends core JointComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { JointComponent } from '@esengine/nova-ecs-physics-core';
import type { BaseJointConfig } from '@esengine/nova-ecs-physics-core';

@component({
  displayName: 'Joint',
  description: 'Connects two rigid bodies, constraining their relative motion',
  icon: '🔗',
  category: 'Physics',
  order: 3,
  removable: true
})
export class EditorJointComponent extends JointComponent {
  @property({
    displayName: 'Joint Type',
    description: 'Type of joint connection',
    type: 'enum',
    options: ['revolute', 'prismatic', 'distance', 'weld', 'wheel', 'rope', 'pulley', 'gear']
  })
  get jointType(): string {
    return (this.config as BaseJointConfig)?.type || 'revolute';
  }

  @property({
    displayName: 'Active',
    description: 'Whether the joint is active',
    type: 'boolean'
  })
  declare active: boolean;

  @property({
    displayName: 'Break Force',
    description: 'Maximum force before joint breaks',
    type: 'number',
    min: 0,
    max: 10000,
    step: 100
  })
  get breakForce(): number {
    return (this.config as any)?.breakSettings?.maxForce || 0;
  }

  @property({
    displayName: 'Break Torque',
    description: 'Maximum torque before joint breaks',
    type: 'number',
    min: 0,
    max: 10000,
    step: 100
  })
  get breakTorque(): number {
    return (this.config as any)?.breakSettings?.maxTorque || 0;
  }
}