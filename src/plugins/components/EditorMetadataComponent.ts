/**
 * Editor Metadata Component - extends core EditorMetadataComponent with editor metadata
 */

import { component, property } from '@esengine/nova-ecs-editor';
import { EditorMetadataComponent } from '@esengine/nova-ecs-core';

@component({
  displayName: 'Editor Metadata',
  description: 'Stores editor-specific information for the entity',
  icon: '📝',
  category: 'Core',
  order: -1,
  removable: false
})
export class EditorEditorMetadataComponent extends EditorMetadataComponent {
  @property({
    displayName: 'Name',
    description: 'Entity display name in the editor',
    type: 'string'
  })
  declare name: string;

  @property({
    displayName: 'Tag',
    description: 'Entity tag for categorization and filtering',
    type: 'string'
  })
  declare tag: string;

  @property({
    displayName: 'Layer',
    description: 'Rendering layer the entity belongs to',
    type: 'number',
    min: 0,
    max: 31
  })
  declare layer: number;

  @property({
    displayName: 'Static',
    description: 'Mark entity as static (non-moving for performance)',
    type: 'boolean'
  })
  declare isStatic: boolean;
}