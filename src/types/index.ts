/**
 * Common type definitions for Nova Editor
 * Nova编辑器通用类型定义
 */

/**
 * Editor panel types
 * 编辑器面板类型
 */
export enum PanelType {
  Hierarchy = 'hierarchy',
  Inspector = 'inspector',
  SceneView = 'scene-view',
  AssetBrowser = 'asset-browser',
  Console = 'console',
  CodeEditor = 'code-editor'
}

/**
 * Editor panel configuration
 * 编辑器面板配置
 */
export interface PanelConfig {
  /** Panel unique identifier | 面板唯一标识符 */
  id: string;
  /** Panel type | 面板类型 */
  type: PanelType;
  /** Panel title | 面板标题 */
  title: string;
  /** Panel icon | 面板图标 */
  icon?: string;
  /** Whether panel is visible | 面板是否可见 */
  visible: boolean;
  /** Whether panel is dockable | 面板是否可停靠 */
  dockable: boolean;
  /** Panel size constraints | 面板尺寸约束 */
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Editor layout configuration
 * 编辑器布局配置
 */
export interface LayoutConfig {
  /** Layout panels | 布局面板 */
  panels: PanelConfig[];
  /** Layout grid configuration | 布局网格配置 */
  grid: {
    cols: number;
    rows: number;
    margin: [number, number];
    containerPadding: [number, number];
  };
}

/**
 * Vector2 type for 2D coordinates
 * 2D坐标向量类型
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Vector3 type for 3D coordinates
 * 3D坐标向量类型
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Transform component data
 * 变换组件数据
 */
export interface Transform {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

/**
 * Asset types supported by the editor
 * 编辑器支持的资源类型
 */
export enum AssetType {
  Scene = 'scene',
  Prefab = 'prefab',
  Script = 'script',
  Texture = 'texture',
  Material = 'material',
  Mesh = 'mesh',
  Audio = 'audio',
  Font = 'font'
}

/**
 * Asset metadata
 * 资源元数据
 */
export interface AssetMetadata {
  /** Asset unique identifier | 资源唯一标识符 */
  id: string;
  /** Asset name | 资源名称 */
  name: string;
  /** Asset type | 资源类型 */
  type: AssetType;
  /** Asset file path | 资源文件路径 */
  path: string;
  /** Asset file size in bytes | 资源文件大小（字节） */
  size: number;
  /** Asset creation timestamp | 资源创建时间戳 */
  createdAt: number;
  /** Asset modification timestamp | 资源修改时间戳 */
  modifiedAt: number;
  /** Asset thumbnail URL | 资源缩略图URL */
  thumbnail?: string;
}

/**
 * Project configuration
 * 项目配置
 */
export interface ProjectConfig {
  /** Project name | 项目名称 */
  name: string;
  /** Project version | 项目版本 */
  version: string;
  /** Project description | 项目描述 */
  description?: string;
  /** Project author | 项目作者 */
  author?: string;
  /** Project creation timestamp | 项目创建时间戳 */
  createdAt: number;
  /** Project modification timestamp | 项目修改时间戳 */
  modifiedAt: number;
  /** Project settings | 项目设置 */
  settings: {
    /** Default scene | 默认场景 */
    defaultScene?: string;
    /** Physics settings | 物理设置 */
    physics: {
      gravity: Vector2;
      timeStep: number;
    };
    /** Rendering settings | 渲染设置 */
    rendering: {
      backgroundColor: string;
      ambientLight: string;
    };
  };
}

/**
 * Editor selection state
 * 编辑器选择状态
 */
export interface SelectionState {
  /** Selected entity IDs | 选中的实体ID */
  selectedEntities: number[];
  /** Selected asset IDs | 选中的资源ID */
  selectedAssets: string[];
  /** Primary selection (first selected item) | 主选择（第一个选中项） */
  primarySelection: number | string | null;
}

/**
 * Editor viewport state
 * 编辑器视口状态
 */
export interface ViewportState {
  /** Camera position | 相机位置 */
  cameraPosition: Vector3;
  /** Camera rotation | 相机旋转 */
  cameraRotation: Vector3;
  /** Camera zoom level | 相机缩放级别 */
  zoom: number;
  /** Viewport size | 视口尺寸 */
  size: Vector2;
  /** Whether grid is visible | 网格是否可见 */
  showGrid: boolean;
  /** Whether gizmos are visible | 操作手柄是否可见 */
  showGizmos: boolean;
}

/**
 * Editor theme configuration
 * 编辑器主题配置
 */
export interface ThemeConfig {
  /** Theme name | 主题名称 */
  name: string;
  /** Primary colors | 主要颜色 */
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  /** Typography settings | 字体设置 */
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  /** Spacing settings | 间距设置 */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

/**
 * Editor command interface
 * 编辑器命令接口
 */
export interface EditorCommand {
  /** Command unique identifier | 命令唯一标识符 */
  id: string;
  /** Command name | 命令名称 */
  name: string;
  /** Command description | 命令描述 */
  description?: string;
  /** Command keyboard shortcut | 命令键盘快捷键 */
  shortcut?: string;
  /** Command execution function | 命令执行函数 */
  execute: (...args: unknown[]) => void | Promise<void>;
  /** Command undo function | 命令撤销函数 */
  undo?: (...args: unknown[]) => void | Promise<void>;
  /** Whether command can be undone | 命令是否可撤销 */
  canUndo: boolean;
}

/**
 * Editor event types
 * 编辑器事件类型
 */
export enum EditorEventType {
  EntitySelected = 'entity-selected',
  EntityDeselected = 'entity-deselected',
  AssetSelected = 'asset-selected',
  AssetDeselected = 'asset-deselected',
  SceneChanged = 'scene-changed',
  ProjectSaved = 'project-saved',
  ProjectLoaded = 'project-loaded',
  ViewportChanged = 'viewport-changed',
  ThemeChanged = 'theme-changed'
}

/**
 * Editor event data
 * 编辑器事件数据
 */
export interface EditorEvent<T = unknown> {
  /** Event type | 事件类型 */
  type: EditorEventType;
  /** Event data | 事件数据 */
  data: T;
  /** Event timestamp | 事件时间戳 */
  timestamp: number;
}

/**
 * World state for NovaECS integration
 * NovaECS集成的世界状态
 */
export interface WorldState {
  /** Entity hierarchy for tree display | 用于树形显示的实体层次结构 */
  entityHierarchy: EntityHierarchyNode[];
  /** Current world instance | 当前世界实例 */
  instance: any; // EditorWorld
  /** World update statistics | 世界更新统计 */
  stats: {
    entityCount: number;
    systemCount: number;
    frameTime: number;
    fps: number;
  };
}

/**
 * Entity hierarchy node for tree display
 * 树形显示的实体层次节点
 */
export interface EntityHierarchyNode {
  id: number;
  name: string;
  active: boolean;
  children: EntityHierarchyNode[];
  parentId: number | null;
}
