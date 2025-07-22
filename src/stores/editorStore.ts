/**
 * Main editor state store using Zustand
 * 使用Zustand的主编辑器状态存储
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type {
  LayoutConfig,
  SelectionState,
  ViewportState,
  ProjectConfig,
  ThemeConfig,
  EditorEvent,
  PanelConfig,
  WorldState
} from '../types';
import type { AssetBrowserState, AssetType } from '../types/AssetTypes';
import {
  EditorEventType,
  PanelType
} from '../types';
import { EditorWorld, EditorStoreIntegration } from '../ecs';
import type { EntityId } from '@esengine/nova-ecs';

/**
 * Editor store state interface
 * 编辑器存储状态接口
 */
interface EditorState {
  // Project state | 项目状态
  project: ProjectConfig | null;
  projectPath: string | null;
  isProjectDirty: boolean;

  // Layout state | 布局状态
  layout: LayoutConfig;
  
  // Selection state | 选择状态
  selection: SelectionState;
  
  // Viewport state | 视口状态
  viewport: ViewportState;
  
  // World state | 世界状态
  world: WorldState;
  
  // Asset browser state | 资源浏览器状态
  assetBrowser: AssetBrowserState;
  
  // Force update trigger | 强制更新触发器
  forceUpdateTrigger: number;
  
  // Theme state | 主题状态
  theme: ThemeConfig;
  
  // UI state | UI状态
  isLoading: boolean;
  activePanel: PanelType | null;
  
  // Event system | 事件系统
  events: EditorEvent[];
}

/**
 * Editor store actions interface
 * 编辑器存储操作接口
 */
interface EditorActions {
  // Project actions | 项目操作
  setProject: (project: ProjectConfig | null) => void;
  setProjectPath: (path: string | null) => void;
  setProjectDirty: (dirty: boolean) => void;
  
  // Layout actions | 布局操作
  updateLayout: (layout: Partial<LayoutConfig>) => void;
  togglePanelVisibility: (panelId: string) => void;
  updatePanelConfig: (panelId: string, config: Partial<PanelConfig>) => void;
  
  // Selection actions | 选择操作
  selectEntity: (entityId: EntityId, addToSelection?: boolean) => void;
  deselectEntity: (entityId: EntityId) => void;
  clearSelection: () => void;
  selectAsset: (assetId: string, addToSelection?: boolean) => void;
  deselectAsset: (assetId: string) => void;
  
  // Viewport actions | 视口操作
  updateViewport: (viewport: Partial<ViewportState>) => void;
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraRotation: (rotation: { x: number; y: number; z: number }) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleGizmos: () => void;
  
  // World actions | 世界操作
  initializeWorld: () => void;
  updateWorldStats: () => void;
  
  // Entity actions | 实体操作
  createEntity: (name?: string) => void;
  removeEntity: (entityId: EntityId) => void;
  setEntityName: (entityId: EntityId, name: string) => void;
  setEntityActive: (entityId: EntityId, active: boolean) => void;
  
  // Component actions | 组件操作
  addComponent: (entityId: EntityId, componentType: string) => void;
  removeComponent: (entityId: EntityId, componentType: string) => void;
  updateComponentProperty: (entityId: EntityId, componentType: string, property: string, value: unknown) => void;
  
  // Theme actions | 主题操作
  setTheme: (theme: ThemeConfig) => void;
  
  // UI actions | UI操作
  setLoading: (loading: boolean) => void;
  setActivePanel: (panel: PanelType | null) => void;
  
  // Event actions | 事件操作
  dispatchEvent: (type: EditorEventType, data?: unknown) => void;
  clearEvents: () => void;
  
  // Asset browser actions | 资源浏览器操作
  navigateToFolder: (folderId: string) => void;
  setAssetViewMode: (mode: 'grid' | 'list') => void;
  setAssetGridSize: (size: number) => void;
  searchAssets: (query: string) => void;
  filterAssetsByType: (type: AssetType | null) => void;
  sortAssets: (by: 'name' | 'type' | 'size' | 'date', order: 'asc' | 'desc') => void;
}

/**
 * Default layout configuration
 * 默认布局配置
 */
const defaultLayout: LayoutConfig = {
  panels: [
    {
      id: 'hierarchy',
      type: PanelType.Hierarchy,
      title: 'Hierarchy',
      icon: 'apartment',
      visible: true,
      dockable: true,
      minWidth: 200,
      minHeight: 300
    },
    {
      id: 'scene-view',
      type: PanelType.SceneView,
      title: 'Scene',
      icon: 'eye',
      visible: true,
      dockable: true,
      minWidth: 400,
      minHeight: 300
    },
    {
      id: 'inspector',
      type: PanelType.Inspector,
      title: 'Inspector',
      icon: 'setting',
      visible: true,
      dockable: true,
      minWidth: 250,
      minHeight: 300
    },
    {
      id: 'asset-browser',
      type: PanelType.AssetBrowser,
      title: 'Assets',
      icon: 'folder',
      visible: true,
      dockable: true,
      minWidth: 300,
      minHeight: 200
    },
    {
      id: 'console',
      type: PanelType.Console,
      title: 'Console',
      icon: 'console-sql',
      visible: true,
      dockable: true,
      minWidth: 400,
      minHeight: 150
    }
  ],
  grid: {
    cols: 12,
    rows: 12,
    margin: [10, 10],
    containerPadding: [10, 10]
  }
};

/**
 * Default theme configuration
 * 默认主题配置
 */
const defaultTheme: ThemeConfig = {
  name: 'Dark',
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    background: '#141414',
    surface: '#1f1f1f',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#303030',
    accent: '#52c41a',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    lineHeight: 1.5
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
};

/**
 * Create editor store with Zustand
 * 使用Zustand创建编辑器存储
 */
export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state | 初始状态
      project: null,
      projectPath: null,
      isProjectDirty: false,
      layout: defaultLayout,
      selection: {
        selectedEntities: [],
        selectedAssets: [],
        primarySelection: null
      },
      world: {
        entityHierarchy: [],
        instance: null,
        stats: {
          entityCount: 0,
          systemCount: 0,
          frameTime: 0,
          fps: 0
        }
      },
      viewport: {
        cameraPosition: { x: 0, y: 0, z: 10 },
        cameraRotation: { x: 0, y: 0, z: 0 },
        zoom: 1,
        size: { x: 800, y: 600 },
        showGrid: true,
        showGizmos: true
      },
      assetBrowser: {
        currentFolderId: 'root',
        selectedAssets: [],
        primarySelection: null,
        viewMode: 'grid',
        gridSize: 128,
        searchQuery: '',
        typeFilter: null,
        sortBy: 'name',
        sortOrder: 'asc',
        isLoading: false
      },
      theme: defaultTheme,
      isLoading: false,
      activePanel: null,
      events: [],
      forceUpdateTrigger: 0,

      // Actions | 操作
      setProject: (project) => set((state) => {
        state.project = project;
      }),

      setProjectPath: (path) => set((state) => {
        state.projectPath = path;
      }),

      setProjectDirty: (dirty) => set((state) => {
        state.isProjectDirty = dirty;
      }),

      updateLayout: (layout) => set((state) => {
        Object.assign(state.layout, layout);
      }),

      togglePanelVisibility: (panelId) => set((state) => {
        const panel = state.layout.panels.find((p: PanelConfig) => p.id === panelId);
        if (panel) {
          panel.visible = !panel.visible;
        }
      }),

      updatePanelConfig: (panelId, config) => set((state) => {
        const panel = state.layout.panels.find((p: PanelConfig) => p.id === panelId);
        if (panel) {
          Object.assign(panel, config);
        }
      }),

      selectEntity: (entityId, addToSelection = false) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().selectEntity(entityId, addToSelection);
        }
      },

      deselectEntity: (entityId) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().deselectEntity(entityId);
        }
      },

      clearSelection: () => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().clearSelection();
        }
      },

      selectAsset: (assetId, addToSelection = false) => set((state) => {
        if (!addToSelection) {
          state.selection.selectedAssets = [assetId];
          state.selection.primarySelection = assetId;
        } else if (!state.selection.selectedAssets.includes(assetId)) {
          state.selection.selectedAssets.push(assetId);
          if (!state.selection.primarySelection) {
            state.selection.primarySelection = assetId;
          }
        }
      }),

      deselectAsset: (assetId) => set((state) => {
        state.selection.selectedAssets = state.selection.selectedAssets.filter((id: string) => id !== assetId);
        if (state.selection.primarySelection === assetId) {
          state.selection.primarySelection = state.selection.selectedAssets[0];
        }
      }),

      updateViewport: (viewport) => set((state) => {
        Object.assign(state.viewport, viewport);
      }),

      setCameraPosition: (position) => set((state) => {
        state.viewport.cameraPosition = position;
      }),

      setCameraRotation: (rotation) => set((state) => {
        state.viewport.cameraRotation = rotation;
      }),

      setZoom: (zoom) => set((state) => {
        state.viewport.zoom = Math.max(0.1, Math.min(10, zoom));
      }),

      toggleGrid: () => set((state) => {
        state.viewport.showGrid = !state.viewport.showGrid;
      }),

      toggleGizmos: () => set((state) => {
        state.viewport.showGizmos = !state.viewport.showGizmos;
      }),

      setTheme: (theme) => set((state) => {
        state.theme = theme;
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),

      setActivePanel: (panel) => set((state) => {
        state.activePanel = panel;
      }),

      dispatchEvent: (type, data) => set((state) => {
        const event: EditorEvent = {
          type,
          data,
          timestamp: Date.now()
        };
        state.events.push(event);
        
        // Keep only last 100 events to prevent memory leaks
        if (state.events.length > 100) {
          state.events = state.events.slice(-100);
        }
      }),

      clearEvents: () => set((state) => {
        state.events = [];
      }),

      // World actions implementation
      initializeWorld: () => set((state) => {
        // Create EditorWorld instance
        const editorWorld = new EditorWorld();
        
        // Create integration layer
        const integration = new EditorStoreIntegration(editorWorld, {
          setState: (updater: any) => {
            if (typeof updater === 'function') {
              set((state) => updater(state));
            } else {
              set(updater);
            }
          },
          getState: get
        } as any);
        
        // Store integration reference
        (editorWorld as any)._integration = integration;
        
        state.world.instance = editorWorld;
        
        // Initialize with empty world (no sample data)
        // integration.getStoreActions().initializeSampleData();
      }),

      updateWorldStats: () => set((state) => {
        if (state.world.instance) {
          state.world.stats = {
            entityCount: state.world.instance.getEntityCount(),
            systemCount: state.world.instance.getSystemCount(),
            frameTime: 16.67, // Mock 60fps
            fps: 60
          };
        }
      }),

      // Entity actions implementation
      createEntity: (name?: string) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().createEntity(name);
        }
      },

      removeEntity: (entityId: EntityId) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().removeEntity(entityId);
        }
      },

      setEntityName: (entityId: EntityId, name: string) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().setEntityName(entityId, name);
          // Force update to refresh Inspector panel
          set((state) => {
            state.forceUpdateTrigger = state.forceUpdateTrigger + 1;
          });
        }
      },

      setEntityActive: (entityId: EntityId, active: boolean) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().setEntityActive(entityId, active);
        }
      },

      // Component actions implementation
      addComponent: (entityId: EntityId, componentType: string) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().addComponent(entityId, componentType);
          // Force update to refresh Inspector panel
          set((state) => {
            state.forceUpdateTrigger = state.forceUpdateTrigger + 1;
          });
        }
      },

      removeComponent: (entityId: EntityId, componentType: string) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().removeComponent(entityId, componentType);
          // Force update to refresh Inspector panel
          set((state) => {
            state.forceUpdateTrigger = state.forceUpdateTrigger + 1;
          });
        }
      },

      updateComponentProperty: (entityId: EntityId, componentType: string, property: string, value: unknown) => {
        const state = get() as any;
        const integration = state.world.instance?._integration;
        if (integration) {
          integration.getStoreActions().updateComponentProperty(entityId, componentType, property, value);
          // Force update to refresh Inspector panel
          set((state) => {
            state.forceUpdateTrigger = state.forceUpdateTrigger + 1;
          });
        }
      },

      // Asset browser actions implementation
      navigateToFolder: (folderId) => set((state) => {
        state.assetBrowser.currentFolderId = folderId;
        state.assetBrowser.selectedAssets = [];
        state.assetBrowser.primarySelection = null;
      }),

      setAssetViewMode: (mode) => set((state) => {
        state.assetBrowser.viewMode = mode;
      }),

      setAssetGridSize: (size) => set((state) => {
        state.assetBrowser.gridSize = Math.max(64, Math.min(256, size));
      }),

      searchAssets: (query) => set((state) => {
        state.assetBrowser.searchQuery = query;
      }),

      filterAssetsByType: (type) => set((state) => {
        state.assetBrowser.typeFilter = type;
      }),

      sortAssets: (by, order) => set((state) => {
        state.assetBrowser.sortBy = by;
        state.assetBrowser.sortOrder = order;
      })
    })),
    {
      name: 'nova-editor-store'
    }
  )
);
