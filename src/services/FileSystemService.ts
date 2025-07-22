/**
 * Enhanced File System Service with real file system access
 * 增强的文件系统服务，支持真实的文件系统访问
 */

import { 
  FileSystemAccess, 
  isFileSystemAccessSupported, 
  FILE_TYPES,
  type FileSystemFileHandle,
  type DirectoryHandle
} from './FileSystemAPI';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  lastModified: Date;
  size: number;
  handle?: FileSystemFileHandle; // Real file handle when available
}

export interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  children: (ProjectFile | ProjectFolder)[];
  handle?: DirectoryHandle; // Real directory handle when available
}

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  rootFolder: ProjectFolder;
  openFiles: ProjectFile[];
  activeFileId: string | null;
  handle?: DirectoryHandle | undefined; // Project root directory handle
}

/**
 * Enhanced File System Service
 * 增强的文件系统服务
 */
export class FileSystemService {
  private static instance: FileSystemService;
  private currentProject: Project | null = null;
  private hasFileSystemAccess: boolean;

  private constructor() {
    this.hasFileSystemAccess = isFileSystemAccessSupported();
    console.log('File System Access API supported:', this.hasFileSystemAccess);
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  /**
   * Check if modern file system access is available
   * 检查是否支持现代文件系统访问
   */
  isModernFileSystemSupported(): boolean {
    return this.hasFileSystemAccess;
  }

  /**
   * Create new project
   * 创建新项目
   */
  async createNewProject(name: string): Promise<Project> {
    let rootFolder: ProjectFolder;
    let handle: DirectoryHandle | undefined;

    if (this.hasFileSystemAccess) {
      try {
        // Ask user to select or create project directory
        handle = await FileSystemAccess.showDirectoryPicker({ mode: 'readwrite' });
        rootFolder = await this.createFolderFromHandle(handle, '/');
      } catch (error) {
        console.warn('Failed to access file system, using in-memory project:', error);
        rootFolder = this.createEmptyFolder(name, '/');
      }
    } else {
      rootFolder = this.createEmptyFolder(name, '/');
    }

    const project: Project = {
      id: `project_${Date.now()}`,
      name,
      rootPath: '/',
      rootFolder,
      openFiles: [],
      activeFileId: null,
      handle: handle
    };

    this.currentProject = project;
    return project;
  }

  /**
   * Open existing project
   * 打开现有项目
   */
  async openProject(): Promise<Project> {
    if (!this.hasFileSystemAccess) {
      throw new Error('File system access not supported');
    }

    try {
      const handle = await FileSystemAccess.showDirectoryPicker({ mode: 'readwrite' });
      const rootFolder = await this.createFolderFromHandle(handle, '/');

      const project: Project = {
        id: `project_${Date.now()}`,
        name: handle.name,
        rootPath: '/',
        rootFolder,
        openFiles: [],
        activeFileId: null,
        handle
      };

      this.currentProject = project;
      return project;
    } catch (error) {
      throw new Error(`Failed to open project: ${error}`);
    }
  }

  /**
   * Create folder structure from directory handle
   * 从目录句柄创建文件夹结构
   */
  private async createFolderFromHandle(handle: DirectoryHandle, path: string): Promise<ProjectFolder> {
    const children: (ProjectFile | ProjectFolder)[] = [];

    for await (const fileHandle of FileSystemAccess.listDirectory(handle)) {
      const childPath = `${path}${path === '/' ? '' : '/'}${fileHandle.name}`;

      if (fileHandle.kind === 'directory') {
        const childFolder = await this.createFolderFromHandle(
          fileHandle as DirectoryHandle, 
          childPath
        );
        children.push(childFolder);
      } else if (fileHandle.kind === 'file') {
        const file = await this.createFileFromHandle(
          fileHandle as FileSystemFileHandle, 
          childPath
        );
        children.push(file);
      }
    }

    return {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: handle.name,
      path,
      children,
      handle
    };
  }

  /**
   * Create file from file handle
   * 从文件句柄创建文件
   */
  private async createFileFromHandle(handle: FileSystemFileHandle, path: string): Promise<ProjectFile> {
    const file = await handle.getFile();
    const content = await file.text();

    return {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: handle.name,
      path,
      content,
      language: this.detectLanguage(handle.name),
      isModified: false,
      lastModified: new Date(file.lastModified),
      size: file.size,
      handle
    };
  }

  /**
   * Create empty folder
   * 创建空文件夹
   */
  private createEmptyFolder(name: string, path: string): ProjectFolder {
    return {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      path,
      children: []
    };
  }

  /**
   * Open file in project
   * 在项目中打开文件
   */
  async openFile(filePath: string): Promise<ProjectFile> {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }

    // Check if file is already open
    const existingFile = this.currentProject.openFiles.find(f => f.path === filePath);
    if (existingFile) {
      this.currentProject.activeFileId = existingFile.id;
      return existingFile;
    }

    // Find file in project structure
    const file = this.findFileInProject(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Add to open files
    this.currentProject.openFiles.push(file);
    this.currentProject.activeFileId = file.id;

    return file;
  }

  /**
   * Save file
   * 保存文件
   */
  async saveFile(fileId: string): Promise<void> {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }

    const file = this.currentProject.openFiles.find(f => f.id === fileId);
    if (!file) {
      throw new Error('File not found in open files');
    }

    if (file.handle && this.hasFileSystemAccess) {
      // Save to real file system
      try {
        await FileSystemAccess.writeFile(file.handle, file.content);
        file.isModified = false;
        file.lastModified = new Date();
        console.log(`Saved file: ${file.name}`);
      } catch (error) {
        throw new Error(`Failed to save file: ${error}`);
      }
    } else {
      // Fallback: download file
      this.downloadFile(file.name, file.content);
      file.isModified = false;
      file.lastModified = new Date();
    }
  }

  /**
   * Save all modified files
   * 保存所有修改的文件
   */
  async saveAllFiles(): Promise<void> {
    if (!this.currentProject) return;

    const modifiedFiles = this.currentProject.openFiles.filter(f => f.isModified);
    for (const file of modifiedFiles) {
      await this.saveFile(file.id);
    }
  }

  /**
   * Create new file in project
   * 在项目中创建新文件
   */
  async createFile(name: string, parentPath: string = '/'): Promise<ProjectFile> {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }

    const filePath = `${parentPath}${parentPath === '/' ? '' : '/'}${name}`;
    
    const newFile: ProjectFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      path: filePath,
      content: '',
      language: this.detectLanguage(name),
      isModified: true,
      lastModified: new Date(),
      size: 0
    };

    // Add to project structure
    const parentFolder = this.findFolderInProject(parentPath);
    if (parentFolder) {
      parentFolder.children.push(newFile);
    }

    // Add to open files
    this.currentProject.openFiles.push(newFile);
    this.currentProject.activeFileId = newFile.id;

    return newFile;
  }

  /**
   * Import files via file picker
   * 通过文件选择器导入文件
   */
  async importFiles(): Promise<ProjectFile[]> {
    const importedFiles: ProjectFile[] = [];

    if (this.hasFileSystemAccess) {
      try {
        const fileHandles = await FileSystemAccess.showOpenFilePicker({
          multiple: true,
          types: [{
            description: FILE_TYPES.ALL.description,
            accept: { '*/*': ['*'] }
          }]
        });

        for (const handle of fileHandles) {
          const file = await this.createFileFromHandle(handle, `/${handle.name}`);
          importedFiles.push(file);

          // Add to current project if one is open
          if (this.currentProject) {
            this.currentProject.rootFolder.children.push(file);
            this.currentProject.openFiles.push(file);
          }
        }
      } catch (error) {
        throw new Error(`Failed to import files: ${error}`);
      }
    } else {
      // Fallback: use input element
      return this.importFilesViaInput();
    }

    return importedFiles;
  }

  /**
   * Fallback file import via input element
   * 通过input元素的后备文件导入
   */
  private async importFilesViaInput(): Promise<ProjectFile[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '*/*';

      input.onchange = async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files) {
          resolve([]);
          return;
        }

        const importedFiles: ProjectFile[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await file.text();
          
          const projectFile: ProjectFile = {
            id: `file_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            path: `/${file.name}`,
            content,
            language: this.detectLanguage(file.name),
            isModified: false,
            lastModified: new Date(file.lastModified),
            size: file.size
          };
          
          importedFiles.push(projectFile);
        }

        resolve(importedFiles);
      };

      input.onerror = () => reject(new Error('Failed to import files'));
      input.click();
    });
  }

  /**
   * Download file as fallback save method
   * 下载文件作为后备保存方法
   */
  private downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Find file in project by path
   * 通过路径在项目中查找文件
   */
  private findFileInProject(path: string): ProjectFile | null {
    if (!this.currentProject) return null;
    
    const findInFolder = (folder: ProjectFolder): ProjectFile | null => {
      for (const child of folder.children) {
        if (child.path === path && 'content' in child) {
          return child as ProjectFile;
        }
        if ('children' in child) {
          const found = findInFolder(child as ProjectFolder);
          if (found) return found;
        }
      }
      return null;
    };

    return findInFolder(this.currentProject.rootFolder);
  }

  /**
   * Find folder in project by path
   * 通过路径在项目中查找文件夹
   */
  private findFolderInProject(path: string): ProjectFolder | null {
    if (!this.currentProject) return null;
    
    if (path === '/') return this.currentProject.rootFolder;
    
    const findInFolder = (folder: ProjectFolder): ProjectFolder | null => {
      if (folder.path === path) return folder;
      
      for (const child of folder.children) {
        if ('children' in child) {
          const found = findInFolder(child as ProjectFolder);
          if (found) return found;
        }
      }
      return null;
    };

    return findInFolder(this.currentProject.rootFolder);
  }

  /**
   * Detect language from file extension
   * 从文件扩展名检测语言
   */
  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'md': 'markdown',
      'py': 'python',
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'glsl': 'glsl',
      'vert': 'glsl',
      'frag': 'glsl'
    };

    return languageMap[ext || ''] || 'plaintext';
  }

  // Getters
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  getOpenFiles(): ProjectFile[] {
    return this.currentProject?.openFiles || [];
  }

  getActiveFile(): ProjectFile | null {
    if (!this.currentProject || !this.currentProject.activeFileId) return null;
    return this.currentProject.openFiles.find(f => f.id === this.currentProject!.activeFileId) || null;
  }

  hasUnsavedChanges(): boolean {
    return this.currentProject?.openFiles.some(f => f.isModified) || false;
  }

  /**
   * Get file tabs for editor UI
   * 获取编辑器UI的文件标签页
   */
  getFileTabs(): ProjectFile[] {
    return this.getOpenFiles();
  }

  /**
   * Update file content
   * 更新文件内容
   */
  updateFile(fileId: string, content: string): void {
    if (!this.currentProject) return;

    const file = this.currentProject.openFiles.find(f => f.id === fileId);
    if (file) {
      file.content = content;
      file.isModified = true;
      file.size = content.length;
    }
  }

  /**
   * Set active file
   * 设置活动文件
   */
  setActiveFile(fileId: string): void {
    if (this.currentProject) {
      this.currentProject.activeFileId = fileId;
    }
  }

  /**
   * Close file
   * 关闭文件
   */
  closeFile(fileId: string): void {
    if (!this.currentProject) return;

    // Remove from open files
    this.currentProject.openFiles = this.currentProject.openFiles.filter(f => f.id !== fileId);
    
    // If this was the active file, select another one
    if (this.currentProject.activeFileId === fileId) {
      const remainingFiles = this.currentProject.openFiles;
      this.currentProject.activeFileId = remainingFiles.length > 0 ? remainingFiles[0].id : null;
    }
  }

  /**
   * Open file by handle (for drag & drop or file picker)
   * 通过文件句柄打开文件（用于拖拽或文件选择器）
   */
  async openFileByHandle(fileHandle: FileSystemFileHandle): Promise<ProjectFile> {
    const file = await this.createFileFromHandle(fileHandle, `/${fileHandle.name}`);
    
    if (this.currentProject) {
      // Check if file is already open
      const existingFile = this.currentProject.openFiles.find(f => f.name === file.name);
      if (existingFile) {
        this.currentProject.activeFileId = existingFile.id;
        return existingFile;
      }

      // Add to project and open files
      this.currentProject.rootFolder.children.push(file);
      this.currentProject.openFiles.push(file);
      this.currentProject.activeFileId = file.id;
    }

    return file;
  }
}