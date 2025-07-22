/**
 * Modern File System Access API wrapper
 * 现代文件系统访问API封装
 */

export interface FileHandle {
  name: string;
  kind: 'file' | 'directory';
}

export interface DirectoryHandle extends FileHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileHandle]>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandle>;
}

export interface FileSystemFileHandle extends FileHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

/**
 * Check if File System Access API is supported
 * 检查是否支持文件系统访问API
 */
export const isFileSystemAccessSupported = (): boolean => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

/**
 * File picker options
 * 文件选择器选项
 */
export interface FilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}

/**
 * Directory picker options
 * 目录选择器选项
 */
export interface DirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
}

/**
 * Save file picker options
 * 保存文件选择器选项
 */
export interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

/**
 * Modern File System Access API implementation
 * 现代文件系统访问API实现
 */
export class FileSystemAccess {
  /**
   * Show open file picker
   * 显示打开文件选择器
   */
  static async showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]> {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access API not supported');
    }

    try {
      // @ts-ignore - API might not be in types yet
      return await window.showOpenFilePicker(options);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('File picker cancelled');
      }
      throw error;
    }
  }

  /**
   * Show directory picker
   * 显示目录选择器
   */
  static async showDirectoryPicker(options?: DirectoryPickerOptions): Promise<DirectoryHandle> {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access API not supported');
    }

    try {
      // @ts-ignore - API might not be in types yet
      return await window.showDirectoryPicker(options);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Directory picker cancelled');
      }
      throw error;
    }
  }

  /**
   * Show save file picker
   * 显示保存文件选择器
   */
  static async showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle> {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access API not supported');
    }

    try {
      // @ts-ignore - API might not be in types yet
      return await window.showSaveFilePicker(options);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('File picker cancelled');
      }
      throw error;
    }
  }

  /**
   * Read file from handle
   * 从句柄读取文件
   */
  static async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  /**
   * Write file to handle
   * 向句柄写入文件
   */
  static async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * List directory contents
   * 列出目录内容
   */
  static async* listDirectory(dirHandle: DirectoryHandle): AsyncIterableIterator<FileHandle> {
    for await (const [_name, handle] of dirHandle.entries()) {
      yield handle;
    }
  }

  /**
   * Check if file/directory exists in directory
   * 检查文件/目录是否存在于目录中
   */
  static async exists(dirHandle: DirectoryHandle, name: string): Promise<boolean> {
    try {
      await dirHandle.getFileHandle(name);
      return true;
    } catch {
      try {
        await dirHandle.getDirectoryHandle(name);
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * Common file type definitions
 * 常用文件类型定义
 */
export const FILE_TYPES = {
  // Code files
  TYPESCRIPT: {
    description: 'TypeScript files',
    accept: {
      'text/typescript': ['.ts', '.tsx']
    }
  },
  JAVASCRIPT: {
    description: 'JavaScript files', 
    accept: {
      'text/javascript': ['.js', '.jsx', '.mjs']
    }
  },
  JSON: {
    description: 'JSON files',
    accept: {
      'application/json': ['.json']
    }
  },
  
  // Asset files
  IMAGES: {
    description: 'Image files',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    }
  },
  AUDIO: {
    description: 'Audio files',
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    }
  },
  MODELS: {
    description: '3D Model files',
    accept: {
      'model/*': ['.gltf', '.glb', '.fbx', '.obj']
    }
  },
  
  // Project files
  PROJECT: {
    description: 'Nova Editor Project',
    accept: {
      'application/json': ['.nova']
    }
  },
  
  // All files
  ALL: {
    description: 'All files',
    accept: {
      '*/*': ['*']
    }
  }
} as const;