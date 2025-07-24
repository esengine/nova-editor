/**
 * Example User Plugin - Demonstrates how users can create custom plugins
 * 示例用户插件 - 演示用户如何创建自定义插件
 */

import { EditorComponentPlugin } from '@esengine/nova-ecs-editor';
import { Component } from '@esengine/nova-ecs';
import type { ComponentType, PluginMetadata } from '@esengine/nova-ecs';

/**
 * Example custom component
 * 示例自定义组件
 */
export class CustomHealthComponent extends Component {
  health: number = 100;
  maxHealth: number = 100;
  regenerationRate: number = 1;

  constructor() {
    super();
  }
}

/**
 * Example user plugin
 * 示例用户插件
 */
export class ExampleUserPlugin extends EditorComponentPlugin {
  readonly metadata: PluginMetadata = {
    name: 'Example User Plugin',
    version: '1.0.0',
    description: 'An example plugin created by a user to demonstrate the plugin system',
    author: 'Nova User'
  };

  getComponentTypes(): ComponentType[] {
    return [CustomHealthComponent];
  }

  async install(): Promise<void> {
    // Call parent install to register components
    await super.install();

    // Register metadata for the custom component
    const { getEditorComponentRegistry } = await import('@esengine/nova-ecs-editor');
    const registry = getEditorComponentRegistry();

    registry.registerComponent(CustomHealthComponent, {
      displayName: 'Health',
      category: 'Gameplay',
      icon: '❤️',
      description: 'Character health and regeneration system',
      order: 100
    }, new Map([
      ['health', {
        displayName: 'Current Health',
        type: 'number',
        description: 'Current health points',
        min: 0
      }],
      ['maxHealth', {
        displayName: 'Max Health',
        type: 'number',
        description: 'Maximum health points',
        min: 1
      }],
      ['regenerationRate', {
        displayName: 'Regeneration Rate',
        type: 'number',
        description: 'Health points regenerated per second',
        min: 0,
        step: 0.1
      }]
    ]));

    console.log('Example User Plugin: Registered CustomHealthComponent with metadata');
  }
}

// Export as default for easy loading
export default ExampleUserPlugin;