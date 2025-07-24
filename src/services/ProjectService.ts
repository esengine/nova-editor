/**
 * Project Service - Manages project creation, opening, and recent projects
 * 项目服务 - 管理项目创建、打开和最近项目
 */

import type { ProjectConfig } from '../types';

export interface RecentProject {
  name: string;
  path: string;
  version?: string;
  description?: string | undefined;
  lastOpened: number;
}

export interface ProjectOpenResult {
  path: string;
  config: ProjectConfig;
}

class ProjectService {
  private readonly RECENT_PROJECTS_KEY = 'nova-editor-recent-projects';
  private readonly MAX_RECENT_PROJECTS = 10;

  /**
   * Get default component properties based on template
   * 根据模板获取默认组件属性
   */
  private getDefaultComponentProperties(componentName: string, template?: any) {
    const defaults: Record<string, any> = {
      Transform: { 
        position: { x: 0, y: 0, z: 0 }, 
        rotation: { x: 0, y: 0, z: 0 }, 
        scale: { x: 1, y: 1, z: 1 } 
      },
      Camera: { 
        fov: template?.cameraType === 'orthographic' ? 10 : 60,
        type: template?.cameraType || 'perspective',
        near: 0.1,
        far: 1000
      },
      MeshRenderer: { 
        material: 'DefaultMaterial',
        castShadows: true,
        receiveShadows: true,
        meshType: template?.id === '2d-game' ? 'plane' : 'box'
      },
      BoxCollider: { 
        size: { x: 1, y: 1, z: template?.id === '2d-game' ? 0.1 : 1 },
        center: { x: 0, y: 0, z: 0 },
        isTrigger: false
      },
      RigidBody: {
        type: 'dynamic',
        mass: 1,
        drag: 0,
        angularDrag: 0.05,
        useGravity: template?.id !== 'empty'
      },
      Light: {
        type: 'directional',
        color: '#FFFFFF',
        intensity: 1,
        shadows: true
      }
    };
    return defaults[componentName] || {};
  }

  /**
   * Create a new project
   * 创建新项目
   */
  async createProject(projectPath: string, config: ProjectConfig, template?: any): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Create project directory structure
      // 2. Write project configuration file
      // 3. Initialize default assets and scenes
      // 4. Set up build configuration
      
      // Create initial entities based on template
      const defaultEntities = template?.defaultEntities || [
        { name: 'MainCamera', components: ['Transform', 'Camera'] }
      ];
      
      // Create initial scene with template entities
      const mainScene = {
        entities: defaultEntities.map((entity: any, index: number) => ({
          id: index + 1,
          name: entity.name,
          active: true,
          components: entity.components.map((compName: string) => ({
            type: compName,
            properties: this.getDefaultComponentProperties(compName, template)
          }))
        })),
        systems: template?.enabledSystems || ['Core'],
        settings: {
          cameraType: template?.cameraType || 'perspective',
          ambientLight: config.settings.rendering.ambientLight,
          backgroundColor: config.settings.rendering.backgroundColor
        }
      };
      
      // For now, we'll simulate this with localStorage for demo purposes
      const projectData = {
        config,
        template: template?.id || 'empty',
        createdAt: Date.now(),
        structure: {
          assets: {
            // Create recommended asset folders based on template
            ...(template?.recommendedAssets?.reduce((acc: any, assetType: string) => {
              acc[assetType] = {};
              return acc;
            }, {}) || {})
          },
          scenes: {
            'main.scene': mainScene
          },
          scripts: {},
          settings: config.settings
        }
      };

      // Store project data (in real app, this would be file system operations)
      localStorage.setItem(`nova-project-${projectPath}`, JSON.stringify(projectData));
      
      // Add to recent projects
      await this.addToRecentProjects({
        name: config.name,
        path: projectPath,
        version: config.version,
        description: config.description,
        lastOpened: Date.now()
      });

      return projectPath;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(`Failed to create project: ${error}`);
    }
  }

  /**
   * Select directory for project creation
   * 选择项目创建目录
   */
  async selectDirectory(): Promise<string | null> {
    try {
      // Check if File System Access API is supported (Chrome 86+)
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'desktop'
          });
          
          // Get the directory path (this is simplified - in reality you'd work with the handle)
          const path = dirHandle.name;
          localStorage.setItem('nova-editor-last-project-dir', path);
          return path;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // User cancelled the picker
            return null;
          }
          throw error;
        }
      }
      
      // Fallback: Try to use input[type="file"] with webkitdirectory
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        
        input.onchange = (event: any) => {
          const files = event.target.files;
          if (files.length > 0) {
            // Get the common path from the first file
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath.split('/');
            // Remove the filename and get the folder path
            pathParts.pop();
            const folderPath = pathParts.join('/') || firstFile.name;
            
            localStorage.setItem('nova-editor-last-project-dir', folderPath);
            resolve(folderPath);
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => {
          resolve(null);
        };
        
        // Trigger the file picker
        input.click();
      });
      
    } catch (error) {
      console.error('Failed to select directory:', error);
      
      // Final fallback: use prompt
      const path = prompt('Please enter the directory path for project creation:', 
        localStorage.getItem('nova-editor-last-project-dir') || 
        (navigator.platform.indexOf('Win') > -1 ? 'C:\\Projects' : '/home/user/Projects'));
      
      if (path) {
        localStorage.setItem('nova-editor-last-project-dir', path);
      }
      
      return path;
    }
  }

  /**
   * Open an existing project using file dialog
   * 使用文件对话框打开现有项目
   */
  async openProject(): Promise<ProjectOpenResult | null> {
    try {
      // Try to use File System Access API for file selection
      if ('showOpenFilePicker' in window) {
        try {
          const fileHandles = await (window as any).showOpenFilePicker({
            types: [{
              description: 'Nova Project Files',
              accept: {
                'application/json': ['.nova', '.json']
              }
            }],
            startIn: 'desktop'
          });
          
          if (fileHandles.length > 0) {
            const fileHandle = fileHandles[0];
            // In a real implementation, you'd read the file content
            const projectPath = fileHandle.name;
            return await this.openProjectByPath(projectPath);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            return null;
          }
          throw error;
        }
      }
      
      // Fallback: Use traditional file input
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.nova,.json';
        
        input.onchange = async (event: any) => {
          const files = event.target.files;
          if (files.length > 0) {
            const file = files[0];
            try {
              // Read the file content
              const content = await file.text();
              const projectData = JSON.parse(content);
              
              if (projectData.config) {
                resolve({
                  path: file.name,
                  config: projectData.config
                });
              } else {
                reject(new Error('Invalid project file'));
              }
            } catch (error) {
              reject(new Error('Failed to read project file'));
            }
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => {
          resolve(null);
        };
        
        input.click();
      });
      
    } catch (error) {
      console.error('Failed to open project:', error);
      
      // Final fallback: prompt for path
      const projectPath = prompt('Enter project path:');
      
      if (!projectPath) {
        return null;
      }

      return await this.openProjectByPath(projectPath);
    }
  }

  /**
   * Open project by path
   * 通过路径打开项目
   */
  async openProjectByPath(projectPath: string): Promise<ProjectOpenResult | null> {
    try {
      // In real implementation, this would read from file system
      const projectDataStr = localStorage.getItem(`nova-project-${projectPath}`);
      
      if (!projectDataStr) {
        throw new Error('Project not found or invalid project path');
      }

      const projectData = JSON.parse(projectDataStr);
      
      // Update last opened time
      await this.addToRecentProjects({
        name: projectData.config.name,
        path: projectPath,
        version: projectData.config.version,
        description: projectData.config.description,
        lastOpened: Date.now()
      });

      return {
        path: projectPath,
        config: projectData.config
      };
    } catch (error) {
      console.error('Failed to open project by path:', error);
      throw new Error(`Failed to open project: ${error}`);
    }
  }

  /**
   * Save current project
   * 保存当前项目
   */
  async saveProject(projectPath: string, config: ProjectConfig, worldData?: any): Promise<void> {
    try {
      const existingData = localStorage.getItem(`nova-project-${projectPath}`);
      let projectData = existingData ? JSON.parse(existingData) : {};

      projectData.config = {
        ...config,
        modifiedAt: Date.now()
      };

      if (worldData) {
        projectData.worldData = worldData;
      }

      localStorage.setItem(`nova-project-${projectPath}`, JSON.stringify(projectData));

      // Update recent projects
      await this.addToRecentProjects({
        name: config.name,
        path: projectPath,
        version: config.version,
        description: config.description,
        lastOpened: Date.now()
      });
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error(`Failed to save project: ${error}`);
    }
  }

  /**
   * Get list of recent projects
   * 获取最近项目列表
   */
  async getRecentProjects(): Promise<RecentProject[]> {
    try {
      const recentProjectsStr = localStorage.getItem(this.RECENT_PROJECTS_KEY);
      
      if (!recentProjectsStr) {
        return [];
      }

      const projects: RecentProject[] = JSON.parse(recentProjectsStr);
      
      // Sort by last opened (most recent first)
      return projects
        .sort((a, b) => b.lastOpened - a.lastOpened)
        .slice(0, this.MAX_RECENT_PROJECTS);
    } catch (error) {
      console.error('Failed to get recent projects:', error);
      return [];
    }
  }

  /**
   * Add project to recent projects list
   * 将项目添加到最近项目列表
   */
  async addToRecentProjects(project: RecentProject): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();
      
      // Remove existing entry if exists
      const filteredProjects = recentProjects.filter(p => p.path !== project.path);
      
      // Add new entry at the beginning
      const updatedProjects = [project, ...filteredProjects].slice(0, this.MAX_RECENT_PROJECTS);
      
      localStorage.setItem(this.RECENT_PROJECTS_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Failed to add to recent projects:', error);
    }
  }

  /**
   * Remove project from recent projects list
   * 从最近项目列表中移除项目
   */
  async removeFromRecentProjects(projectPath: string): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();
      const filteredProjects = recentProjects.filter(p => p.path !== projectPath);
      
      localStorage.setItem(this.RECENT_PROJECTS_KEY, JSON.stringify(filteredProjects));
    } catch (error) {
      console.error('Failed to remove from recent projects:', error);
    }
  }

  /**
   * Check if project exists at path
   * 检查路径是否存在项目
   */
  async projectExists(projectPath: string): Promise<boolean> {
    try {
      // In real implementation, this would check file system
      const projectData = localStorage.getItem(`nova-project-${projectPath}`);
      return projectData !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get project configuration without opening
   * 获取项目配置但不打开项目
   */
  async getProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
    try {
      const projectDataStr = localStorage.getItem(`nova-project-${projectPath}`);
      
      if (!projectDataStr) {
        return null;
      }

      const projectData = JSON.parse(projectDataStr);
      return projectData.config;
    } catch (error) {
      console.error('Failed to get project config:', error);
      return null;
    }
  }

  /**
   * Validate project configuration
   * 验证项目配置
   */
  validateProjectConfig(config: ProjectConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (!config.version || !/^\d+\.\d+\.\d+$/.test(config.version)) {
      errors.push('Invalid version format (expected: x.y.z)');
    }

    if (!config.settings) {
      errors.push('Project settings are required');
    } else {
      if (!config.settings.physics) {
        errors.push('Physics settings are required');
      }
      if (!config.settings.rendering) {
        errors.push('Rendering settings are required');
      }
    }

    if (!config.createdAt || !config.modifiedAt) {
      errors.push('Project timestamps are required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const projectService = new ProjectService();

// Default export
export default projectService;