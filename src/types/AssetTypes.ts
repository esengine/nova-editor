/**
 * Asset system types and interfaces
 * 资源系统类型和接口
 */

/**
 * Asset type enumeration
 * 资源类型枚举
 */
export enum AssetType {
  Folder = 'folder',
  Texture = 'texture',
  Mesh = 'mesh',
  Model = 'model',
  Audio = 'audio',
  Video = 'video',
  Script = 'script',
  Scene = 'scene',
  Prefab = 'prefab',
  Material = 'material',
  Font = 'font',
  Unknown = 'unknown'
}

/**
 * Asset metadata interface
 * 资源元数据接口
 */
export interface AssetMetadata {
  /** Unique asset ID */
  id: string;
  
  /** Asset name (filename without extension) */
  name: string;
  
  /** Full filename with extension */
  filename: string;
  
  /** Asset type */
  type: AssetType;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type */
  mimeType: string;
  
  /** Parent folder ID */
  parentId: string | null;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last modified timestamp */
  modifiedAt: number;
  
  /** Asset-specific metadata */
  metadata: Record<string, any>;
  
  /** Thumbnail data URL (optional) */
  thumbnail?: string;
  
  /** Asset tags for searching */
  tags: string[];
  
  /** Asset file path */
  path: string;
  
  /** Image/Video width (optional) */
  width?: number;
  
  /** Image/Video height (optional) */
  height?: number;
}

/**
 * Asset file data interface
 * 资源文件数据接口
 */
export interface AssetFileData {
  /** Asset metadata */
  metadata: AssetMetadata;
  
  /** File blob data */
  data: Blob;
}

/**
 * Asset folder interface
 * 资源文件夹接口
 */
export interface AssetFolder {
  /** Unique folder ID */
  id: string;
  
  /** Folder name */
  name: string;
  
  /** Parent folder ID */
  parentId: string | null;
  
  /** Child folder IDs */
  children: string[];
  
  /** Asset IDs in this folder */
  assets: string[];
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Folder path */
  path: string;
  
  /** Whether folder is expanded in UI */
  expanded?: boolean;
}

/**
 * Asset import configuration
 * 资源导入配置
 */
export interface AssetImportConfig {
  /** Target folder ID */
  targetFolderId: string;
  
  /** Whether to generate thumbnails */
  generateThumbnails: boolean;
  
  /** Maximum thumbnail size */
  thumbnailSize: number;
  
  /** Whether to overwrite existing assets */
  overwrite: boolean;
  
  /** Custom asset metadata */
  metadata?: Record<string, any>;
}

/**
 * Asset import result
 * 资源导入结果
 */
export interface AssetImportResult {
  /** Whether import was successful */
  success: boolean;
  
  /** Imported asset metadata (if successful) */
  asset?: AssetMetadata;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Import warnings */
  warnings: string[];
}

/**
 * Asset browser state interface
 * 资源浏览器状态接口
 */
export interface AssetBrowserState {
  /** Current folder ID being viewed */
  currentFolderId: string;
  
  /** Selected asset IDs */
  selectedAssets: string[];
  
  /** Primary selected asset ID */
  primarySelection: string | null;
  
  /** View mode (grid/list) */
  viewMode: 'grid' | 'list';
  
  /** Grid item size */
  gridSize: number;
  
  /** Search query */
  searchQuery: string;
  
  /** Asset type filter */
  typeFilter: AssetType | null;
  
  /** Sort options */
  sortBy: 'name' | 'type' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
  
  /** Loading state */
  isLoading: boolean;
}

/**
 * Asset browser actions interface
 * 资源浏览器操作接口
 */
export interface AssetBrowserActions {
  /** Navigate to folder */
  navigateToFolder: (folderId: string) => void;
  
  /** Create new folder */
  createFolder: (name: string, parentId: string) => Promise<AssetFolder>;
  
  /** Delete folder */
  deleteFolder: (folderId: string) => Promise<void>;
  
  /** Rename folder */
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  
  /** Import asset files */
  importAssets: (files: FileList, config: AssetImportConfig) => Promise<AssetImportResult[]>;
  
  /** Delete assets */
  deleteAssets: (assetIds: string[]) => Promise<void>;
  
  /** Select assets */
  selectAssets: (assetIds: string[], addToSelection?: boolean) => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Set view mode */
  setViewMode: (mode: 'grid' | 'list') => void;
  
  /** Set grid size */
  setGridSize: (size: number) => void;
  
  /** Search assets */
  searchAssets: (query: string) => void;
  
  /** Filter by type */
  filterByType: (type: AssetType | null) => void;
  
  /** Sort assets */
  sortAssets: (by: 'name' | 'type' | 'size' | 'date', order: 'asc' | 'desc') => void;
}

/**
 * File type to asset type mapping
 * 文件类型到资源类型的映射
 */
export const FILE_TYPE_MAPPING: Record<string, AssetType> = {
  // Images
  'image/png': AssetType.Texture,
  'image/jpeg': AssetType.Texture,
  'image/jpg': AssetType.Texture,
  'image/webp': AssetType.Texture,
  'image/gif': AssetType.Texture,
  'image/bmp': AssetType.Texture,
  'image/tiff': AssetType.Texture,
  
  // 3D Models
  'model/gltf+json': AssetType.Model,
  'model/gltf-binary': AssetType.Model,
  'application/octet-stream': AssetType.Model, // .glb files
  'text/plain': AssetType.Model, // .obj files (sometimes)
  
  // Audio
  'audio/mpeg': AssetType.Audio,
  'audio/wav': AssetType.Audio,
  'audio/ogg': AssetType.Audio,
  'audio/mp4': AssetType.Audio,
  'audio/aac': AssetType.Audio,
  
  // Scripts
  'text/javascript': AssetType.Script,
  'application/javascript': AssetType.Script,
  'text/typescript': AssetType.Script,
  'application/typescript': AssetType.Script,
  
  // Scene files
  'application/json': AssetType.Scene, // Could also be other JSON files
};

/**
 * Get asset type from file
 * 从文件获取资源类型
 */
export function getAssetTypeFromFile(file: File): AssetType {
  const mimeType = file.type;
  const extension = file.name.toLowerCase().split('.').pop();
  
  // First try MIME type
  if (FILE_TYPE_MAPPING[mimeType]) {
    return FILE_TYPE_MAPPING[mimeType];
  }
  
  // Then try extension
  switch (extension) {
    case 'gltf':
    case 'glb':
    case 'obj':
    case 'fbx':
      return AssetType.Model;
      
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
    case 'bmp':
    case 'tiff':
      return AssetType.Texture;
      
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'aac':
    case 'm4a':
      return AssetType.Audio;
      
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return AssetType.Script;
      
    case 'scene':
      return AssetType.Scene;
      
    case 'prefab':
      return AssetType.Prefab;
      
    case 'mat':
    case 'material':
      return AssetType.Material;
      
    default:
      return AssetType.Unknown;
  }
}

/**
 * Get file extension for asset type
 * 为资源类型获取文件扩展名
 */
export function getFileExtensionsForType(type: AssetType): string[] {
  switch (type) {
    case AssetType.Texture:
      return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'];
    case AssetType.Model:
      return ['gltf', 'glb', 'obj', 'fbx'];
    case AssetType.Audio:
      return ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    case AssetType.Script:
      return ['js', 'ts', 'jsx', 'tsx'];
    case AssetType.Scene:
      return ['scene', 'json'];
    case AssetType.Prefab:
      return ['prefab'];
    case AssetType.Material:
      return ['mat', 'material', 'json'];
    default:
      return [];
  }
}

/**
 * Generate asset ID
 * 生成资源ID
 */
export function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate folder ID
 * 生成文件夹ID
 */
export function generateFolderId(): string {
  return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}