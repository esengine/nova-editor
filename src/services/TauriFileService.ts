/**
 * Tauri File Service - Native file operations using Tauri plugins
 * Tauri文件服务 - 使用Tauri插件的原生文件操作
 */

import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, exists, readDir } from '@tauri-apps/plugin-fs';
// Path utilities are imported when needed

/**
 * File dialog options
 * 文件对话框选项
 */
export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  multiple?: boolean;
}

/**
 * Tauri-specific file service for native file operations
 * Tauri特定的文件服务，用于原生文件操作
 */
export class TauriFileService {
  /**
   * Open file dialog and return selected file path(s)
   * 打开文件对话框并返回选中的文件路径
   */
  async openFileDialog(options: FileDialogOptions = {}): Promise<string | string[] | null> {
    try {
      const dialogOptions: any = {
        title: options.title || 'Open File',
        multiple: options.multiple || false
      };
      
      if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
      }
      
      if (options.filters) {
        dialogOptions.filters = options.filters;
      }
      
      const result = await open(dialogOptions);
      return result;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  }

  /**
   * Open save file dialog and return selected path
   * 打开保存文件对话框并返回选中的路径
   */
  async saveFileDialog(options: FileDialogOptions = {}): Promise<string | null> {
    try {
      const dialogOptions: any = {
        title: options.title || 'Save File'
      };
      
      if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
      }
      
      if (options.filters) {
        dialogOptions.filters = options.filters;
      }
      
      const result = await save(dialogOptions);
      return result;
    } catch (error) {
      console.error('Error opening save dialog:', error);
      return null;
    }
  }

  /**
   * Open folder dialog
   * 打开文件夹对话框
   */
  async openFolderDialog(options: Omit<FileDialogOptions, 'multiple'> = {}): Promise<string | null> {
    try {
      const dialogOptions: any = {
        title: options.title || 'Select Folder',
        directory: true
      };
      
      if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
      }
      
      const result = await open(dialogOptions);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error opening folder dialog:', error);
      return null;
    }
  }

  /**
   * Read text file content
   * 读取文本文件内容
   */
  async readTextFile(filePath: string): Promise<string> {
    try {
      return await readTextFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * Write text content to file
   * 将文本内容写入文件
   */
  async writeTextFile(filePath: string, content: string): Promise<void> {
    try {
      await writeTextFile(filePath, content);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  /**
   * Check if file or directory exists
   * 检查文件或目录是否存在
   */
  async exists(path: string): Promise<boolean> {
    try {
      return await exists(path);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Read directory contents
   * 读取目录内容
   */
  async readDirectory(path: string): Promise<Array<{ name: string; isFile: boolean; isDirectory: boolean }>> {
    try {
      const entries = await readDir(path);
      return entries.map(entry => ({
        name: entry.name || '',
        isFile: entry.isFile || false,
        isDirectory: entry.isDirectory || false
      }));
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }

  /**
   * Get common file filters for different file types
   * 获取不同文件类型的常用文件过滤器
   */
  getFileFilters() {
    return {
      project: [
        { name: 'Nova Project', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      script: [
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      scene: [
        { name: 'Scene Files', extensions: ['scene', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      image: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      model: [
        { name: '3D Models', extensions: ['gltf', 'glb', 'fbx', 'obj'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      audio: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    };
  }
}

// Singleton instance
export const tauriFileService = new TauriFileService();