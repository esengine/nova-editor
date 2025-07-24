/**
 * Example User Plugin - Demonstrates how users can create custom plugins
 * 示例用户插件 - 演示用户如何创建自定义插件
 */

import { EditorComponentPlugin, component, property } from '@esengine/nova-ecs-editor';
import { Component } from '@esengine/nova-ecs';

/**
 * Example custom component
 * 示例自定义组件
 */
export class CustomHealthComponent extends Component {
  constructor() {
    super();
    this.health = 100;
    this.maxHealth = 100;
    this.regenerationRate = 1;
  }
}

/**
 * Example user plugin
 * 示例用户插件
 */
export class ExampleUserPlugin extends EditorComponentPlugin {
  metadata = {
    name: 'Example User Plugin',
    version: '1.0.0',
    description: 'An example plugin created by a user to demonstrate the plugin system',
    author: 'Nova User'
  };

  getComponentTypes() {
    return [CustomHealthComponent];
  }

  async install() {
    try {
      // Apply decorators to the component
      component({
        displayName: 'Health',
        category: 'Gameplay',
        icon: '❤️',
        description: 'Character health and regeneration system',
        order: 100
      })(CustomHealthComponent);

      // Apply property decorators
      property({
        displayName: 'Current Health',
        type: 'number',
        description: 'Current health points',
        min: 0
      })(CustomHealthComponent.prototype, 'health');

      property({
        displayName: 'Max Health',
        type: 'number',
        description: 'Maximum health points',
        min: 1
      })(CustomHealthComponent.prototype, 'maxHealth');

      property({
        displayName: 'Regeneration Rate',
        type: 'number',
        description: 'Health points regenerated per second',
        min: 0,
        step: 0.1
      })(CustomHealthComponent.prototype, 'regenerationRate');

      // Register the component
      const { getEditorComponentRegistry } = await import('@esengine/nova-ecs-editor');
      const registry = getEditorComponentRegistry();
      registry.register(CustomHealthComponent);

      console.log('Example User Plugin: Registered CustomHealthComponent with metadata');
    } catch (error) {
      console.error('Error installing ExampleUserPlugin:', error);
      throw error;
    }
  }
}

// Export as default for easy loading
export default ExampleUserPlugin;