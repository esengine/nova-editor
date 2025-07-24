/**
 * Asset storage service using IndexedDB
 * 使用IndexedDB的资源存储服务
 */

import { openDB, type IDBPDatabase } from 'idb';
import {
  AssetType,
  getAssetTypeFromFile,
  generateAssetId,
  generateFolderId
} from '../types/AssetTypes';
import type {
  AssetMetadata,
  AssetFolder,
  AssetImportConfig,
  AssetImportResult
} from '../types/AssetTypes';

/**
 * Database schema version
 */
const DB_VERSION = 1;
const DB_NAME = 'NovaEditorAssets';

/**
 * Asset service class
 * 资源服务类
 */
export class AssetService {
  private static instance: AssetService | null = null;
  private db: IDBPDatabase | null = null;
  private initialized = false;

  /**
   * Get singleton instance
   */
  public static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService();
    }
    return AssetService.instance;
  }

  /**
   * Initialize database
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Assets table
          if (!db.objectStoreNames.contains('assets')) {
            const assetsStore = db.createObjectStore('assets', { keyPath: 'id' });
            assetsStore.createIndex('parentId', 'parentId');
            assetsStore.createIndex('type', 'type');
            assetsStore.createIndex('name', 'name');
          }

          // Folders table
          if (!db.objectStoreNames.contains('folders')) {
            const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
            foldersStore.createIndex('parentId', 'parentId');
            foldersStore.createIndex('name', 'name');
          }

          // File data table (stores actual file blobs)
          if (!db.objectStoreNames.contains('fileData')) {
            db.createObjectStore('fileData', { keyPath: 'assetId' });
          }
        },
      });

      // Create root folder if it doesn't exist
      await this.ensureRootFolder();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize asset database:', error);
      throw new Error('Asset service initialization failed');
    }
  }

  /**
   * Ensure root folder exists
   * 确保根文件夹存在
   */
  private async ensureRootFolder(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const rootFolder = await this.db.get('folders', 'root');
    if (!rootFolder) {
      const root: AssetFolder = {
        id: 'root',
        name: 'Assets',
        parentId: null,
        children: [],
        assets: [],
        createdAt: Date.now(),
        path: '/',
        expanded: true
      };
      await this.db.put('folders', root);
    }
  }

  /**
   * Get all folders
   * 获取所有文件夹
   */
  public async getFolders(): Promise<AssetFolder[]> {
    if (!this.db) await this.initialize();
    return await this.db!.getAll('folders');
  }

  /**
   * Get folder by ID
   * 根据ID获取文件夹
   */
  public async getFolder(folderId: string): Promise<AssetFolder | undefined> {
    if (!this.db) await this.initialize();
    return await this.db!.get('folders', folderId);
  }

  /**
   * Create new folder
   * 创建新文件夹
   */
  public async createFolder(name: string, parentId: string): Promise<AssetFolder> {
    if (!this.db) await this.initialize();

    const parent = await this.getFolder(parentId);
    if (!parent) {
      throw new Error(`Parent folder with ID ${parentId} not found`);
    }

    const folderId = generateFolderId();
    const parentPath = parent.path === '/' ? '' : parent.path;
    
    const folder: AssetFolder = {
      id: folderId,
      name,
      parentId,
      children: [],
      assets: [],
      createdAt: Date.now(),
      path: `${parentPath}/${name}`,
      expanded: false
    };

    // Add to database
    await this.db!.put('folders', folder);

    // Update parent folder
    parent.children.push(folderId);
    await this.db!.put('folders', parent);

    return folder;
  }

  /**
   * Delete folder
   * 删除文件夹
   */
  public async deleteFolder(folderId: string): Promise<void> {
    if (!this.db) await this.initialize();
    if (folderId === 'root') {
      throw new Error('Cannot delete root folder');
    }

    const folder = await this.getFolder(folderId);
    if (!folder) {
      throw new Error(`Folder with ID ${folderId} not found`);
    }

    // Recursively delete child folders
    for (const childId of folder.children) {
      await this.deleteFolder(childId);
    }

    // Delete assets in this folder
    for (const assetId of folder.assets) {
      await this.deleteAsset(assetId);
    }

    // Remove from parent
    if (folder.parentId) {
      const parent = await this.getFolder(folder.parentId);
      if (parent) {
        parent.children = parent.children.filter(id => id !== folderId);
        await this.db!.put('folders', parent);
      }
    }

    // Delete folder
    await this.db!.delete('folders', folderId);
  }

  /**
   * Get assets in folder
   * 获取文件夹中的资源
   */
  public async getAssetsInFolder(folderId: string): Promise<AssetMetadata[]> {
    if (!this.db) await this.initialize();

    const assets: AssetMetadata[] = [];
    const cursor = await this.db!.transaction('assets').store.index('parentId').openCursor(folderId);
    
    if (cursor) {
      do {
        assets.push(cursor.value);
      } while (await cursor.continue());
    }

    return assets;
  }

  /**
   * Get asset by ID
   * 根据ID获取资源
   */
  public async getAsset(assetId: string): Promise<AssetMetadata | undefined> {
    if (!this.db) await this.initialize();
    return await this.db!.get('assets', assetId);
  }

  /**
   * Get asset file data
   * 获取资源文件数据
   */
  public async getAssetData(assetId: string): Promise<Blob | undefined> {
    if (!this.db) await this.initialize();
    const fileData = await this.db!.get('fileData', assetId);
    return fileData?.data;
  }

  /**
   * Create new asset
   * 创建新资源
   */
  public async createAsset(metadata: AssetMetadata, data: ArrayBuffer | string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(['assets', 'fileData'], 'readwrite');
    
    // Store metadata
    await tx.objectStore('assets').add(metadata);
    
    // Store file data
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : new Blob([data]);
    await tx.objectStore('fileData').add({
      id: metadata.id,
      data: blob
    });
    
    await tx.done;
  }

  /**
   * Import assets from files
   * 从文件导入资源
   */
  public async importAssets(files: FileList, config: AssetImportConfig): Promise<AssetImportResult[]> {
    if (!this.db) await this.initialize();

    const results: AssetImportResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.importSingleAsset(file, config);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          warnings: []
        });
      }
    }

    return results;
  }

  /**
   * Import single asset
   * 导入单个资源
   */
  private async importSingleAsset(file: File, config: AssetImportConfig): Promise<AssetImportResult> {
    const assetId = generateAssetId();
    const assetType = getAssetTypeFromFile(file);
    const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    
    // Check if asset already exists
    const existing = await this.findAssetByName(file.name, config.targetFolderId);
    if (existing && !config.overwrite) {
      throw new Error(`Asset ${file.name} already exists`);
    }

    // Create thumbnail if needed
    let thumbnail: string | undefined;
    if (config.generateThumbnails && assetType === AssetType.Texture) {
      thumbnail = await this.generateImageThumbnail(file, config.thumbnailSize);
    }

    // Get folder for path calculation
    const folder = await this.getFolder(config.targetFolderId);
    if (!folder) {
      throw new Error(`Target folder ${config.targetFolderId} not found`);
    }

    const parentPath = folder.path === '/' ? '' : folder.path;

    const metadata: AssetMetadata = {
      id: assetId,
      name,
      filename: file.name,
      type: assetType,
      size: file.size,
      mimeType: file.type,
      parentId: config.targetFolderId,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      metadata: config.metadata || {},
      ...(thumbnail && { thumbnail }),
      tags: [],
      path: `${parentPath}/${file.name}`
    };

    // Store asset metadata
    await this.db!.put('assets', metadata);

    // Store file data
    await this.db!.put('fileData', {
      assetId,
      data: file
    });

    // Update folder
    folder.assets.push(assetId);
    await this.db!.put('folders', folder);

    return {
      success: true,
      asset: metadata,
      warnings: []
    };
  }

  /**
   * Find asset by name in folder
   * 在文件夹中按名称查找资源
   */
  private async findAssetByName(filename: string, folderId: string): Promise<AssetMetadata | undefined> {
    const assets = await this.getAssetsInFolder(folderId);
    return assets.find(asset => asset.filename === filename);
  }

  /**
   * Generate thumbnail for image
   * 为图片生成缩略图
   */
  private async generateImageThumbnail(file: File, size: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(size / img.width, size / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete asset
   * 删除资源
   */
  public async deleteAsset(assetId: string): Promise<void> {
    if (!this.db) await this.initialize();

    const asset = await this.getAsset(assetId);
    if (!asset) return;

    // Remove from folder
    if (asset.parentId) {
      const folder = await this.getFolder(asset.parentId);
      if (folder) {
        folder.assets = folder.assets.filter(id => id !== assetId);
        await this.db!.put('folders', folder);
      }
    }

    // Delete asset data
    await this.db!.delete('fileData', assetId);
    
    // Delete asset metadata
    await this.db!.delete('assets', assetId);
  }

  /**
   * Search assets
   * 搜索资源
   */
  public async searchAssets(query: string, typeFilter?: AssetType): Promise<AssetMetadata[]> {
    if (!this.db) await this.initialize();

    const allAssets = await this.db!.getAll('assets');
    const lowerQuery = query.toLowerCase();

    return allAssets.filter(asset => {
      const matchesQuery = !query || 
        asset.name.toLowerCase().includes(lowerQuery) ||
        asset.filename.toLowerCase().includes(lowerQuery) ||
        asset.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery));

      const matchesType = !typeFilter || asset.type === typeFilter;

      return matchesQuery && matchesType;
    });
  }

  /**
   * Get folder hierarchy
   * 获取文件夹层次结构
   */
  public async getFolderHierarchy(rootId: string = 'root'): Promise<AssetFolder[]> {
    if (!this.db) await this.initialize();

    const buildHierarchy = async (folderId: string): Promise<AssetFolder[]> => {
      const folder = await this.getFolder(folderId);
      if (!folder) return [];

      const children: AssetFolder[] = [];
      for (const childId of folder.children) {
        const childFolders = await buildHierarchy(childId);
        children.push(...childFolders);
      }

      return [folder, ...children];
    };

    return await buildHierarchy(rootId);
  }

  /**
   * Scan and import assets from project directory
   * 扫描并导入项目目录中的资源
   */
  public async scanProjectAssets(projectPath: string): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      // Check if running in Tauri environment
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      console.log('Asset scanning debug:', {
        hasWindow: typeof window !== 'undefined',
        hasTauriInternals: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
        isTauri,
        projectPath
      });
      
      if (isTauri) {
        console.log('Starting Tauri asset scanning...');
        await this.scanProjectAssetsTauri(projectPath);
      } else {
        // For browser environment, we can't easily scan file system
        // This would require user to select the assets directory
        console.warn('Asset scanning not supported in browser environment');
      }
    } catch (error) {
      console.error('Failed to scan project assets:', error);
    }
  }

  /**
   * Scan project assets using Tauri file system
   * 使用Tauri文件系统扫描项目资源
   */
  private async scanProjectAssetsTauri(projectPath: string): Promise<void> {
    console.log('scanProjectAssetsTauri called with path:', projectPath);
    try {
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const { join } = await import('@tauri-apps/api/path');

      // Clear existing assets (optional - you might want to merge instead)
      console.log('Clearing existing assets...');
      await this.clearAllAssets();
      
      // Scan multiple directories
      const directoriesToScan = [
        { name: 'assets', path: await join(projectPath, 'assets') },
        { name: 'scenes', path: await join(projectPath, 'scenes') }
      ];
      
      for (const { name, path } of directoriesToScan) {
        console.log(`Checking if ${name} directory exists...`);
        try {
          const entries = await readDir(path);
          console.log(`${name} directory contents:`, entries);
          
          // Recursively scan directory
          console.log(`Starting recursive scan of ${name}...`);
          await this.scanDirectoryRecursive(path, 'root');
          console.log(`Recursive scan of ${name} completed`);
        } catch (dirError) {
          console.warn(`${name} directory not found or not accessible:`, path, dirError);
        }
      }
      
    } catch (error) {
      console.error('Failed to scan assets directory:', error);
      // Assets directory might not exist or be accessible
    }
  }

  /**
   * Recursively scan directory for assets
   * 递归扫描目录中的资源
   */
  private async scanDirectoryRecursive(dirPath: string, parentFolderId: string): Promise<void> {
    try {
      const { readDir, readFile } = await import('@tauri-apps/plugin-fs');
      const { join } = await import('@tauri-apps/api/path');

      const entries = await readDir(dirPath);

      for (const entry of entries) {
        const fullPath = await join(dirPath, entry.name);

        if (entry.isDirectory) {
          // Create folder in asset browser
          const folderId = generateFolderId();
          const folder: AssetFolder = {
            id: folderId,
            name: entry.name,
            path: `${parentFolderId === 'root' ? '' : await this.getFolderPath(parentFolderId)}/${entry.name}`,
            parentId: parentFolderId,
            children: [],
            assets: [],
            createdAt: Date.now(),
          };

          await this.db!.put('folders', folder);
          
          // Update parent folder
          const parentFolder = await this.getFolder(parentFolderId);
          if (parentFolder) {
            parentFolder.children.push(folderId);
            await this.db!.put('folders', parentFolder);
          }

          // Recursively scan subdirectory
          await this.scanDirectoryRecursive(fullPath, folderId);
        } else {
          // Import file as asset
          try {
            const fileData = await readFile(fullPath);
            const file = new File([fileData], entry.name, {
              type: this.getMimeTypeFromExtension(entry.name)
            });

            const assetType = getAssetTypeFromFile(file);
            
            // Only import supported asset types
            if (assetType !== AssetType.Unknown) {
              await this.importSingleAsset(file, {
                targetFolderId: parentFolderId,
                generateThumbnails: true,
                thumbnailSize: 128,
                overwrite: false
              });
            }
          } catch (fileError) {
            console.warn(`Failed to import asset ${entry.name}:`, fileError);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * Get MIME type from file extension
   * 从文件扩展名获取MIME类型
   */
  private getMimeTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'json': 'application/json',
      'txt': 'text/plain',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'css': 'text/css',
      'html': 'text/html',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Get folder path by ID
   * 通过ID获取文件夹路径
   */
  private async getFolderPath(folderId: string): Promise<string> {
    const folder = await this.getFolder(folderId);
    return folder ? folder.path : '';
  }

  /**
   * Clear all assets (for re-scanning)
   * 清除所有资源（用于重新扫描）
   */
  private async clearAllAssets(): Promise<void> {
    if (!this.db) return;

    // Clear all assets and file data
    await this.db.clear('assets');
    await this.db.clear('fileData');
    
    // Reset folders to just root
    await this.db.clear('folders');
    
    // Recreate root folder
    const rootFolder: AssetFolder = {
      id: 'root',
      name: 'Assets',
      path: '/',
      parentId: null,
      children: [],
      assets: [],
      createdAt: Date.now(),
    };
    
    await this.db.put('folders', rootFolder);
  }
}

// Export singleton instance
export const assetService = AssetService.getInstance();