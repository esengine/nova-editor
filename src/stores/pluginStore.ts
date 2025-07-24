/**
 * Plugin state management store
 * 插件状态管理存储
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import type { ECSPlugin } from '@esengine/nova-ecs';

// Enable MapSet support in Immer
enableMapSet();

/**
 * Plugin loading state
 * 插件加载状态
 */
export enum PluginLoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed'
}

/**
 * Plugin information
 * 插件信息
 */
export interface PluginInfo {
  name: string;
  version: string;
  description?: string | undefined;
  state: PluginLoadingState;
  error?: string | undefined;
  loadTime?: number | undefined;
  plugin?: ECSPlugin | undefined;
  enabled: boolean;
  author?: string | undefined;
}

/**
 * Plugin store state
 * 插件存储状态
 */
interface PluginState {
  // Plugin registry | 插件注册表
  plugins: Map<string, PluginInfo>;
  
  // Loading states | 加载状态
  isLoading: boolean;
  loadingPlugins: Set<string>;
  loadedPlugins: Set<string>;
  failedPlugins: Set<string>;
  
  // Overall loading progress | 总体加载进度
  totalPlugins: number;
  loadedCount: number;
  
  // Initialization status | 初始化状态
  isInitialized: boolean;
  initializationError?: string | undefined;
}

/**
 * Plugin store actions
 * 插件存储操作
 */
interface PluginActions {
  // Plugin management | 插件管理
  registerPlugin: (plugin: ECSPlugin) => void;
  setPluginState: (name: string, state: PluginLoadingState, error?: string | undefined) => void;
  setPluginLoadTime: (name: string, loadTime: number) => void;
  enablePlugin: (name: string) => void;
  disablePlugin: (name: string) => void;
  togglePlugin: (name: string) => void;
  
  // Loading management | 加载管理
  startLoading: (pluginNames: string[]) => void;
  finishLoading: () => void;
  
  // Initialization | 初始化
  setInitialized: (initialized: boolean, error?: string | undefined) => void;
  
  // Utilities | 工具方法
  reset: () => void;
  getPluginInfo: (name: string) => PluginInfo | undefined;
  getAllPlugins: () => PluginInfo[];
  getLoadingProgress: () => { loaded: number; total: number; percentage: number };
  getEnabledPlugins: () => PluginInfo[];
  getDisabledPlugins: () => PluginInfo[];
}

/**
 * Initial state
 * 初始状态
 */
const initialState: PluginState = {
  plugins: new Map(),
  isLoading: false,
  loadingPlugins: new Set(),
  loadedPlugins: new Set(),
  failedPlugins: new Set(),
  totalPlugins: 0,
  loadedCount: 0,
  isInitialized: false
};

/**
 * Plugin store
 * 插件存储
 */
export const usePluginStore = create<PluginState & PluginActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      registerPlugin: (plugin: ECSPlugin) => set((state) => {
        const pluginInfo: PluginInfo = {
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          description: plugin.metadata.description,
          state: PluginLoadingState.Idle,
          plugin,
          enabled: true, // Default to enabled
          author: plugin.metadata.author
        };
        
        state.plugins.set(plugin.metadata.name, pluginInfo);
      }),

      setPluginState: (name: string, state: PluginLoadingState, error?: string | undefined) => set((draft) => {
        const plugin = draft.plugins.get(name);
        if (plugin) {
          const oldState = plugin.state;
          plugin.state = state;
          plugin.error = error;
          
          // Update loading sets
          draft.loadingPlugins.delete(name);
          draft.loadedPlugins.delete(name);
          draft.failedPlugins.delete(name);
          
          switch (state) {
            case PluginLoadingState.Loading:
              draft.loadingPlugins.add(name);
              break;
            case PluginLoadingState.Loaded:
              draft.loadedPlugins.add(name);
              if (oldState !== PluginLoadingState.Loaded) {
                draft.loadedCount++;
              }
              break;
            case PluginLoadingState.Failed:
              draft.failedPlugins.add(name);
              if (oldState !== PluginLoadingState.Failed) {
                draft.loadedCount++;
              }
              break;
          }
        }
      }),

      setPluginLoadTime: (name: string, loadTime: number) => set((state) => {
        const plugin = state.plugins.get(name);
        if (plugin) {
          plugin.loadTime = loadTime;
        }
      }),

      startLoading: (pluginNames: string[]) => set((state) => {
        state.isLoading = true;
        state.totalPlugins = pluginNames.length;
        state.loadedCount = 0;
        state.loadingPlugins.clear();
        state.loadedPlugins.clear();
        state.failedPlugins.clear();
      }),

      finishLoading: () => set((state) => {
        state.isLoading = false;
      }),

      setInitialized: (initialized: boolean, error?: string | undefined) => set((state) => {
        state.isInitialized = initialized;
        state.initializationError = error;
      }),

      reset: () => set((state) => {
        Object.assign(state, initialState);
        state.plugins = new Map();
        state.loadingPlugins = new Set();
        state.loadedPlugins = new Set();
        state.failedPlugins = new Set();
      }),

      getPluginInfo: (name: string) => {
        return get().plugins.get(name);
      },

      getAllPlugins: () => {
        return Array.from(get().plugins.values());
      },

      enablePlugin: (name: string) => set((state) => {
        const plugin = state.plugins.get(name);
        if (plugin) {
          plugin.enabled = true;
        }
      }),

      disablePlugin: (name: string) => set((state) => {
        const plugin = state.plugins.get(name);
        if (plugin) {
          plugin.enabled = false;
        }
      }),

      togglePlugin: (name: string) => set((state) => {
        const plugin = state.plugins.get(name);
        if (plugin) {
          plugin.enabled = !plugin.enabled;
        }
      }),

      getEnabledPlugins: () => {
        return Array.from(get().plugins.values()).filter(plugin => plugin.enabled);
      },

      getDisabledPlugins: () => {
        return Array.from(get().plugins.values()).filter(plugin => !plugin.enabled);
      },

      getLoadingProgress: () => {
        const state = get();
        return {
          loaded: state.loadedCount,
          total: state.totalPlugins,
          percentage: state.totalPlugins > 0 ? (state.loadedCount / state.totalPlugins) * 100 : 0
        };
      }
    })),
    {
      name: 'nova-editor-plugin-store'
    }
  )
);