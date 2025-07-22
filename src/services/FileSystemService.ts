/**
 * File System Service for managing editor files
 * 文件系统服务，用于管理编辑器文件
 */

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  lastModified: Date;
}

export interface FileTab {
  file: EditorFile;
  isActive: boolean;
}

export class FileSystemService {
  private static instance: FileSystemService;
  private openFiles: Map<string, EditorFile> = new Map();
  private activeFileId: string | null = null;

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private constructor() {}

  /**
   * Detect language from file extension
   * 从文件扩展名检测语言
   */
  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      // TypeScript/JavaScript
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      
      // Web
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'less',
      
      // Data/Config
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'toml': 'toml',
      'ini': 'ini',
      
      // Documentation
      'md': 'markdown',
      'markdown': 'markdown',
      'txt': 'plaintext',
      'text': 'plaintext',
      
      // Shaders
      'glsl': 'glsl',
      'vert': 'glsl',
      'frag': 'glsl',
      'shader': 'glsl',
      'vs': 'glsl',
      'fs': 'glsl',
      
      // Other languages
      'py': 'python',
      'cpp': 'cpp',
      'cxx': 'cpp',
      'cc': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'hxx': 'cpp',
      'cs': 'csharp',
      'java': 'java',
      'rs': 'rust',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      'sql': 'sql',
      'lua': 'lua',
      'r': 'r',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'clj': 'clojure',
      'fsharp': 'fsharp',
      'vb': 'vb',
      'dart': 'dart'
    };

    return languageMap[ext || ''] || 'plaintext';
  }

  /**
   * Create a new file
   * 创建新文件
   */
  createFile(name: string, content: string = '', path?: string): EditorFile {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filePath = path || `/${name}`;
    
    const file: EditorFile = {
      id,
      name,
      path: filePath,
      content,
      language: this.detectLanguage(name),
      isModified: false,
      lastModified: new Date()
    };

    this.openFiles.set(id, file);
    this.activeFileId = id;
    
    return file;
  }

  /**
   * Open file from File API
   * 通过File API打开文件
   */
  async openFile(file: File): Promise<EditorFile> {
    const content = await file.text();
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const editorFile: EditorFile = {
      id,
      name: file.name,
      path: `/${file.name}`,
      content,
      language: this.detectLanguage(file.name),
      isModified: false,
      lastModified: new Date(file.lastModified)
    };

    this.openFiles.set(id, editorFile);
    this.activeFileId = id;
    
    return editorFile;
  }

  /**
   * Update file content
   * 更新文件内容
   */
  updateFile(fileId: string, content: string): void {
    const file = this.openFiles.get(fileId);
    if (file) {
      file.content = content;
      file.isModified = true;
      file.lastModified = new Date();
    }
  }

  /**
   * Save file (download as file)
   * 保存文件（下载文件）
   */
  async saveFile(fileId: string): Promise<void> {
    const file = this.openFiles.get(fileId);
    if (!file) return;

    // Create blob and download
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    // Mark as saved
    file.isModified = false;
  }

  /**
   * Close file
   * 关闭文件
   */
  closeFile(fileId: string): void {
    this.openFiles.delete(fileId);
    
    if (this.activeFileId === fileId) {
      // Set active file to the last opened file
      const fileIds = Array.from(this.openFiles.keys());
      this.activeFileId = fileIds.length > 0 ? fileIds[fileIds.length - 1] : null;
    }
  }

  /**
   * Set active file
   * 设置活动文件
   */
  setActiveFile(fileId: string): void {
    if (this.openFiles.has(fileId)) {
      this.activeFileId = fileId;
    }
  }

  /**
   * Get active file
   * 获取活动文件
   */
  getActiveFile(): EditorFile | null {
    return this.activeFileId ? this.openFiles.get(this.activeFileId) || null : null;
  }

  /**
   * Get all open files
   * 获取所有打开的文件
   */
  getOpenFiles(): EditorFile[] {
    return Array.from(this.openFiles.values());
  }

  /**
   * Get file tabs for display
   * 获取文件标签用于显示
   */
  getFileTabs(): FileTab[] {
    return Array.from(this.openFiles.values()).map(file => ({
      file,
      isActive: file.id === this.activeFileId
    }));
  }

  /**
   * Check if there are unsaved changes
   * 检查是否有未保存的更改
   */
  hasUnsavedChanges(): boolean {
    return Array.from(this.openFiles.values()).some(file => file.isModified);
  }
}