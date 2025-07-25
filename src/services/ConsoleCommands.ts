/**
 * Built-in console commands for the editor
 * 编辑器的内置控制台命令
 */

import { consoleService } from './ConsoleService';
import { useEditorStore } from '../stores/editorStore';
import type { ConsoleCommand } from '../types/ConsoleTypes';

/**
 * Scene manipulation commands
 * 场景操作命令
 */
export const sceneCommands: ConsoleCommand[] = [
  {
    name: 'scene.clear',
    description: 'Clear all entities from the scene',
    usage: 'scene.clear',
    execute: async () => {
      const world = useEditorStore.getState().world.instance;
      if (!world) {
        throw new Error('No world instance');
      }
      
      const entities = [...world.entities];
      entities.forEach(entity => world.removeEntity(entity.id));
      
      consoleService.addLog('info', `Cleared ${entities.length} entities from scene`);
      return `Scene cleared`;
    }
  },
  {
    name: 'scene.stats',
    description: 'Show scene statistics',
    usage: 'scene.stats',
    execute: async () => {
      const state = useEditorStore.getState();
      const world = state.world.instance;
      
      if (!world) {
        throw new Error('No world instance');
      }
      
      const stats = {
        entities: world.getEntityCount(),
        systems: world.getSystemCount(),
        components: world.entities.reduce((count: number, entity: any) => {
          return count + entity.getComponents().length;
        }, 0)
      };
      
      consoleService.addLog('info', `Scene Statistics: ${JSON.stringify(stats, null, 2)}`);
      return stats;
    }
  },
  {
    name: 'scene.save',
    description: 'Save current scene to JSON',
    usage: 'scene.save [filename]',
    execute: async (args: string[]) => {
      const filename = args[0] || 'scene.json';
      const world = useEditorStore.getState().world.instance;
      
      if (!world) {
        throw new Error('No world instance');
      }
      
      // Serialize scene
      const sceneData = {
        entities: world.entities.map((entity: any) => ({
          id: entity.id,
          components: entity.getComponents().map((comp: any) => ({
            type: comp.constructor.name,
            data: comp
          }))
        }))
      };
      
      // Create download
      const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      consoleService.addLog('success', `Scene saved to ${filename}`);
      return `Scene saved`;
    }
  }
];

/**
 * Entity manipulation commands
 * 实体操作命令
 */
export const entityCommands: ConsoleCommand[] = [
  {
    name: 'entity.create',
    description: 'Create a new entity',
    usage: 'entity.create [name]',
    execute: async (args: string[]) => {
      const name = args[0] || undefined;
      const store = useEditorStore.getState();
      
      await store.createEntity(name);
      
      const entityName = name || `Entity_${store.world.stats.entityCount}`;
      consoleService.addLog('success', `Created entity: ${entityName}`);
      return `Entity created`;
    }
  },
  {
    name: 'entity.list',
    description: 'List all entities',
    usage: 'entity.list',
    execute: async () => {
      const world = useEditorStore.getState().world.instance;
      if (!world) {
        throw new Error('No world instance');
      }
      
      const entities = world.entities.map((entity: any) => {
        const metadata = entity.getComponent('EditorMetadataComponent');
        return {
          id: entity.id,
          name: metadata?.name || `Entity_${entity.id}`,
          active: entity.active,
          components: entity.getComponents().length
        };
      });
      
      consoleService.addLog('info', 'Entities:', entities);
      return entities;
    }
  },
  {
    name: 'entity.select',
    description: 'Select entity by ID or name',
    usage: 'entity.select <id|name>',
    execute: async (args: string[]) => {
      if (!args[0]) {
        throw new Error('Entity ID or name required');
      }
      
      const world = useEditorStore.getState().world.instance;
      if (!world) {
        throw new Error('No world instance');
      }
      
      const target = args[0];
      let entity;
      
      // Try as ID first
      const id = parseInt(target);
      if (!isNaN(id)) {
        entity = world.getEntity(id);
      } else {
        // Search by name
        entity = world.entities.find((e: any) => {
          const metadata = e.getComponent('EditorMetadataComponent');
          return metadata?.name === target;
        });
      }
      
      if (!entity) {
        throw new Error(`Entity not found: ${target}`);
      }
      
      useEditorStore.getState().selectEntity(entity.id);
      consoleService.addLog('info', `Selected entity: ${entity.id}`);
      return `Entity selected`;
    }
  },
  {
    name: 'entity.delete',
    description: 'Delete selected entities',
    usage: 'entity.delete',
    execute: async () => {
      const state = useEditorStore.getState();
      const selected = state.selection.selectedEntities;
      
      if (selected.length === 0) {
        throw new Error('No entities selected');
      }
      
      for (const entityId of selected) {
        await state.removeEntity(entityId);
      }
      
      consoleService.addLog('success', `Deleted ${selected.length} entities`);
      return `Entities deleted`;
    }
  }
];

/**
 * Component manipulation commands
 * 组件操作命令
 */
export const componentCommands: ConsoleCommand[] = [
  {
    name: 'component.add',
    description: 'Add component to selected entity',
    usage: 'component.add <componentType>',
    execute: async (args: string[]) => {
      if (!args[0]) {
        throw new Error('Component type required');
      }
      
      const state = useEditorStore.getState();
      const selected = state.selection.primarySelection;
      
      if (typeof selected !== 'number') {
        throw new Error('No entity selected');
      }
      
      state.addComponent(selected, args[0]);
      consoleService.addLog('success', `Added ${args[0]} component`);
      return `Component added`;
    }
  },
  {
    name: 'component.remove',
    description: 'Remove component from selected entity',
    usage: 'component.remove <componentType>',
    execute: async (args: string[]) => {
      if (!args[0]) {
        throw new Error('Component type required');
      }
      
      const state = useEditorStore.getState();
      const selected = state.selection.primarySelection;
      
      if (typeof selected !== 'number') {
        throw new Error('No entity selected');
      }
      
      state.removeComponent(selected, args[0]);
      consoleService.addLog('success', `Removed ${args[0]} component`);
      return `Component removed`;
    }
  },
  {
    name: 'component.list',
    description: 'List available component types',
    usage: 'component.list',
    execute: async () => {
      const componentTypes = [
        'Transform',
        'MeshRenderer',
        'BoxCollider',
        'EditorMetadata'
      ];
      
      consoleService.addLog('info', `Available components: ${componentTypes.join(', ')}`);
      return componentTypes;
    }
  }
];

/**
 * Editor utility commands
 * 编辑器实用命令
 */
export const utilityCommands: ConsoleCommand[] = [
  {
    name: 'help',
    description: 'Show available commands',
    usage: 'help [command]',
    execute: async (args: string[]) => {
      const commandName = args[0];
      const allCommands = [
        ...sceneCommands,
        ...entityCommands,
        ...componentCommands,
        ...utilityCommands,
        ...debugCommands
      ];
      
      if (commandName) {
        const command = allCommands.find(cmd => cmd.name === commandName);
        if (command) {
          consoleService.addLog('info', `${command.name}: ${command.description}\nUsage: ${command.usage}`);
          return command;
        } else {
          throw new Error(`Command not found: ${commandName}`);
        }
      }
      
      const commandList = allCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description
      }));
      
      consoleService.addLog('info', `Available commands: ${commandList.map(c => `${c.name} - ${c.description}`).join(', ')}`);
      return commandList;
    }
  },
  {
    name: 'clear',
    description: 'Clear console output',
    usage: 'clear',
    execute: async () => {
      consoleService.clear();
      return 'Console cleared';
    }
  },
  {
    name: 'theme',
    description: 'Change editor theme',
    usage: 'theme <dark|light>',
    execute: async (args: string[]) => {
      const theme = args[0];
      if (!['dark', 'light'].includes(theme)) {
        throw new Error('Invalid theme. Use "dark" or "light"');
      }
      
      // TODO: Implement theme switching
      consoleService.addLog('info', `Theme changed to: ${theme}`);
      return `Theme changed`;
    }
  },
  {
    name: 'workspace.save',
    description: 'Save workspace layout',
    usage: 'workspace.save',
    execute: async () => {
      useEditorStore.getState().saveWorkspace();
      consoleService.addLog('success', 'Workspace saved');
      return 'Workspace saved';
    }
  },
  {
    name: 'workspace.reset',
    description: 'Reset workspace to default',
    usage: 'workspace.reset',
    execute: async () => {
      useEditorStore.getState().resetWorkspace();
      consoleService.addLog('info', 'Workspace reset to default');
      return 'Workspace reset';
    }
  }
];

/**
 * Debug commands
 * 调试命令
 */
export const debugCommands: ConsoleCommand[] = [
  {
    name: 'debug.fps',
    description: 'Toggle FPS counter',
    usage: 'debug.fps',
    execute: async () => {
      // TODO: Implement FPS toggle
      consoleService.addLog('info', 'FPS counter toggled');
      return 'FPS toggled';
    }
  },
  {
    name: 'debug.wireframe',
    description: 'Toggle wireframe mode',
    usage: 'debug.wireframe',
    execute: async () => {
      // TODO: Implement wireframe toggle
      consoleService.addLog('info', 'Wireframe mode toggled');
      return 'Wireframe toggled';
    }
  },
  {
    name: 'debug.bounds',
    description: 'Toggle bounding boxes',
    usage: 'debug.bounds',
    execute: async () => {
      // TODO: Implement bounds toggle
      consoleService.addLog('info', 'Bounding boxes toggled');
      return 'Bounds toggled';
    }
  },
  {
    name: 'debug.physics',
    description: 'Toggle physics debug visualization',
    usage: 'debug.physics',
    execute: async () => {
      // TODO: Implement physics debug toggle
      consoleService.addLog('info', 'Physics debug toggled');
      return 'Physics debug toggled';
    }
  }
];

/**
 * Register all built-in commands
 * 注册所有内置命令
 */
export function registerBuiltInCommands() {
  const allCommands = [
    ...sceneCommands,
    ...entityCommands,
    ...componentCommands,
    ...utilityCommands,
    ...debugCommands
  ];
  
  allCommands.forEach(command => {
    consoleService.registerCommand(command);
  });
  
}

/**
 * Command auto-completion helper
 * 命令自动补全辅助
 */
export function getCommandSuggestions(partial: string): string[] {
  const allCommands = consoleService.getCommands();
  
  if (!partial) {
    return allCommands.map(cmd => cmd.name);
  }
  
  return allCommands
    .map(cmd => cmd.name)
    .filter(name => name.startsWith(partial))
    .sort();
}

/**
 * Command history manager
 * 命令历史管理器
 */
export class CommandHistory {
  private history: string[] = [];
  private currentIndex = -1;
  private maxHistory = 100;
  
  add(command: string) {
    // Don't add empty commands or duplicates
    if (!command || (this.history.length > 0 && this.history[this.history.length - 1] === command)) {
      return;
    }
    
    this.history.push(command);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.currentIndex = this.history.length;
  }
  
  getPrevious(): string | null {
    if (this.history.length === 0) return null;
    
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.history[this.currentIndex] || null;
  }
  
  getNext(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    
    this.currentIndex = this.history.length;
    return '';
  }
  
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}