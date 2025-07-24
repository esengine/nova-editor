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

      // Determine the asset folders based on template
      const assetFolders = template?.recommendedAssets || ['sprites', 'textures', 'audio'];

      // Check if running in Tauri environment for native file operations
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      console.log('Creating project:', { 
        projectPath, 
        configName: config.name, 
        isTauri, 
        hasDirectoryHandle: !!this.selectedDirectoryHandle 
      });
      
      let actualProjectPath = projectPath;
      
      if (isTauri) {
        // Use Tauri native file system operations
        actualProjectPath = await this.createProjectFilesTauri(projectPath, config, mainScene, assetFolders);
      } else {
        // Use browser File System Access API or IndexedDB fallback
        await this.createProjectFilesBrowser(projectPath, config, mainScene, assetFolders);
      }
      
      // Add to recent projects
      await this.addToRecentProjects({
        name: config.name,
        path: actualProjectPath,
        version: config.version,
        description: config.description,
        lastOpened: Date.now()
      });

      return actualProjectPath;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(`Failed to create project: ${error}`);
    }
  }

  /**
   * Create project files using Tauri native file system
   * 使用Tauri原生文件系统创建项目文件
   */
  private async createProjectFilesTauri(projectPath: string, config: ProjectConfig, mainScene: any, assetFolders: string[]): Promise<string> {
    const { mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');

    try {
      console.log('Creating Tauri project at:', projectPath);
      
      // Use the provided projectPath directly (it already includes the project folder name)
      const fullProjectPath = projectPath;
      
      console.log('Full project path:', fullProjectPath);
      
      // Create main project directory
      await mkdir(fullProjectPath, { recursive: true });

      // Create subdirectories
      const directories = [
        'assets',
        'scenes', 
        'scripts',
        'settings',
        ...assetFolders.map(folder => `assets/${folder}`)
      ];

      for (const dir of directories) {
        const dirPath = await join(fullProjectPath, dir);
        await mkdir(dirPath, { recursive: true });
      }

      // Write nova.config.json
      const configPath = await join(fullProjectPath, 'nova.config.json');
      const projectConfig = {
        name: config.name,
        version: config.version,
        description: config.description,
        author: config.author,
        createdAt: config.createdAt,
        modifiedAt: Date.now(),
        componentDiscovery: {
          packages: [
            {
              package: '@esengine/nova-ecs-core',
              description: 'Core ECS components (Transform, Metadata, etc.)',
              required: true
            },
            {
              package: '@esengine/nova-ecs-render-three',
              description: 'Three.js rendering components',
              required: false
            }
          ]
        },
        plugins: [],
        settings: config.settings
      };
      await writeTextFile(configPath, JSON.stringify(projectConfig, null, 2));

      // Write main.scene file
      const scenePath = await join(fullProjectPath, 'scenes', 'main.scene');
      await writeTextFile(scenePath, JSON.stringify(mainScene, null, 2));

      // Create .gitignore
      const gitignorePath = await join(fullProjectPath, '.gitignore');
      const gitignoreContent = `# Dependencies
node_modules/
*.log
npm-debug.log*

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Nova Editor temp files
.nova-temp/
`;
      await writeTextFile(gitignorePath, gitignoreContent);

      // Create README.md
      const readmePath = await join(fullProjectPath, 'README.md');
      const readmeContent = `# ${config.name}

${config.description}

## Getting Started

This is a Nova Editor project. Open it in Nova Editor to start developing your game.

## Project Structure

- \`assets/\` - Game assets (sprites, textures, audio, etc.)
- \`scenes/\` - Scene files
- \`scripts/\` - Custom scripts and components
- \`nova.config.json\` - Project configuration

## Author

${config.author || 'Unknown'}

---

Generated with Nova Editor v${config.version}
`;
      await writeTextFile(readmePath, readmeContent);
      
      console.log(`✅ Tauri project "${config.name}" created successfully at:`, fullProjectPath);
      
      // Return the full project path for future reference
      return fullProjectPath;

    } catch (error) {
      console.error('Error creating project files with Tauri:', error);
      throw error;
    }
  }

  /**
   * Create project files using browser File System Access API or fallback
   * 使用浏览器文件系统访问API或后备方案创建项目文件
   */
  private async createProjectFilesBrowser(projectPath: string, config: ProjectConfig, mainScene: any, assetFolders: string[]): Promise<void> {
    try {
      console.log('createProjectFilesBrowser called:', { 
        projectPath, 
        hasAPI: 'showDirectoryPicker' in window,
        hasHandle: !!this.selectedDirectoryHandle,
        configName: config.name
      });
      
      // Check if File System Access API is supported and we have a directory handle
      if ('showDirectoryPicker' in window && this.selectedDirectoryHandle) {
        console.log('Using File System Access API...');
        // Use the previously selected directory handle
        const dirHandle = this.selectedDirectoryHandle;
        
        // Extract project name from the full projectPath
        const pathParts = projectPath.split('/');
        const projectName = pathParts[pathParts.length - 1];
        
        let projectDirHandle = dirHandle;
        try {
          // Create project subdirectory if it doesn't exist
          projectDirHandle = await dirHandle.getDirectoryHandle(projectName, { create: true });
        } catch (error) {
          console.warn('Could not create project subdirectory, using selected directory directly:', error);
          // Use the selected directory directly
        }

        // Create subdirectories
        const directories = ['assets', 'scenes', 'scripts', 'settings'];
        for (const dir of directories) {
          await projectDirHandle.getDirectoryHandle(dir, { create: true });
        }

        // Create asset subdirectories
        const assetsHandle = await projectDirHandle.getDirectoryHandle('assets');
        for (const folder of assetFolders) {
          await assetsHandle.getDirectoryHandle(folder, { create: true });
        }

        // Write nova.config.json
        const configFileHandle = await projectDirHandle.getFileHandle('nova.config.json', { create: true });
        const configWritable = await configFileHandle.createWritable();
        const projectConfig = {
          name: config.name,
          version: config.version,
          description: config.description,
          author: config.author,
          createdAt: config.createdAt,
          modifiedAt: Date.now(),
          componentDiscovery: {
            packages: [
              {
                package: '@esengine/nova-ecs-core',
                description: 'Core ECS components (Transform, Metadata, etc.)',
                required: true
              },
              {
                package: '@esengine/nova-ecs-render-three',
                description: 'Three.js rendering components',
                required: false
              }
            ]
          },
          plugins: [],
          settings: config.settings
        };
        await configWritable.write(JSON.stringify(projectConfig, null, 2));
        await configWritable.close();

        // Write main.scene file
        const scenesHandle = await projectDirHandle.getDirectoryHandle('scenes');
        const sceneFileHandle = await scenesHandle.getFileHandle('main.scene', { create: true });
        const sceneWritable = await sceneFileHandle.createWritable();
        await sceneWritable.write(JSON.stringify(mainScene, null, 2));
        await sceneWritable.close();

        // Create other files
        await this.createAdditionalProjectFiles(projectDirHandle, config);
        
        console.log(`✅ Project "${config.name}" created successfully in:`, dirHandle.name);
        
        // Clear the stored handle after successful creation
        this.selectedDirectoryHandle = null;

      } else if ('showDirectoryPicker' in window && !this.selectedDirectoryHandle) {
        // File System Access API is supported but no directory was selected
        throw new Error('Please select a directory first by clicking the "Browse" button.');
      } else {
        // Fallback: Store in IndexedDB with structure information
        const projectData = {
          config,
          mainScene,
          assetFolders,
          createdAt: Date.now(),
          structure: {
            directories: ['assets', 'scenes', 'scripts', 'settings', ...assetFolders.map(f => `assets/${f}`)],
            files: {
              'nova.config.json': {
                name: config.name,
                version: config.version,
                description: config.description,
                author: config.author,
                createdAt: config.createdAt,
                modifiedAt: Date.now(),
                componentDiscovery: {
                  packages: [
                    {
                      package: '@esengine/nova-ecs-core',
                      description: 'Core ECS components (Transform, Metadata, etc.)',
                      required: true
                    },
                    {
                      package: '@esengine/nova-ecs-render-three',
                      description: 'Three.js rendering components',
                      required: false
                    }
                  ]
                },
                plugins: [],
                settings: config.settings
              },
              'scenes/main.scene': mainScene
            }
          }
        };

        // Store in localStorage with structure info (as improved fallback)
        localStorage.setItem(`nova-project-${projectPath}`, JSON.stringify(projectData));
        
        console.warn('File System Access API not supported, project structure stored in browser storage only.');
        console.log('Project structure created:', projectData.structure.directories);
      }

    } catch (error) {
      console.error('Error creating project files in browser:', error);
      throw error;
    }
  }

  /**
   * Create additional project files (README, .gitignore, etc.)
   * 创建额外的项目文件
   */
  private async createAdditionalProjectFiles(dirHandle: any, config: ProjectConfig): Promise<void> {
    try {
      // Create .gitignore
      const gitignoreHandle = await dirHandle.getFileHandle('.gitignore', { create: true });
      const gitignoreWritable = await gitignoreHandle.createWritable();
      const gitignoreContent = `# Dependencies
node_modules/
*.log
npm-debug.log*

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Nova Editor temp files
.nova-temp/
`;
      await gitignoreWritable.write(gitignoreContent);
      await gitignoreWritable.close();

      // Create README.md
      const readmeHandle = await dirHandle.getFileHandle('README.md', { create: true });
      const readmeWritable = await readmeHandle.createWritable();
      const readmeContent = `# ${config.name}

${config.description}

## Getting Started

This is a Nova Editor project. Open it in Nova Editor to start developing your game.

## Project Structure

- \`assets/\` - Game assets (sprites, textures, audio, etc.)
- \`scenes/\` - Scene files
- \`scripts/\` - Custom scripts and components
- \`nova.config.json\` - Project configuration

## Author

${config.author || 'Unknown'}

---

Generated with Nova Editor v${config.version}
`;
      await readmeWritable.write(readmeContent);
      await readmeWritable.close();

    } catch (error) {
      console.error('Error creating additional project files:', error);
      // Don't throw - these are optional files
    }
  }

  // Store the selected directory handle for reuse
  private selectedDirectoryHandle: any = null;

  /**
   * Select directory for project creation
   * 选择项目创建目录
   */
  async selectDirectory(): Promise<string | null> {
    try {
      // Check if running in Tauri environment first
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      if (isTauri) {
        // Use Tauri native directory dialog
        try {
          const { open } = await import('@tauri-apps/plugin-dialog');
          const path = await open({
            directory: true,
            title: 'Select Project Directory'
          });
          
          if (path && typeof path === 'string') {
            localStorage.setItem('nova-editor-last-project-dir', path);
            return path;
          }
          return null;
        } catch (error) {
          console.error('Tauri directory dialog error:', error);
          throw error;
        }
      }
      
      // Fallback to browser File System Access API
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'desktop'
          });
          
          // Store the handle for later use
          this.selectedDirectoryHandle = dirHandle;
          
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
      // Check if running in Tauri environment first
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      if (isTauri) {
        // Use Tauri native file dialog
        try {
          const { open } = await import('@tauri-apps/plugin-dialog');
          const filePath = await open({
            title: 'Open Project File',
            filters: [{
              name: 'Nova Project Files',
              extensions: ['nova', 'json']
            }]
          });
          
          if (filePath && typeof filePath === 'string') {
            // For Tauri, we need to read the actual file and extract project info
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const { dirname } = await import('@tauri-apps/api/path');
            
            try {
              const fileContent = await readTextFile(filePath);
              const projectConfig = JSON.parse(fileContent);
              
              // The project directory is the parent of the config file
              const projectPath = await dirname(filePath);
              
              // Update recent projects
              await this.addToRecentProjects({
                name: projectConfig.name,
                path: projectPath,
                version: projectConfig.version,
                description: projectConfig.description,
                lastOpened: Date.now()
              });
              
              return {
                path: projectPath,
                config: projectConfig
              };
            } catch (error) {
              console.error('Failed to read project file:', error);
              throw new Error(`Invalid project file: ${error}`);
            }
          }
          return null;
        } catch (error) {
          console.error('Tauri file dialog error:', error);
          throw error;
        }
      }
      
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
            
            try {
              // Read the actual file content
              const file = await fileHandle.getFile();
              const fileContent = await file.text();
              const projectConfig = JSON.parse(fileContent);
              
              // For browser File System Access API, we can't easily get the directory path
              // So we'll use the file name as a fallback identifier
              const projectPath = fileHandle.name.replace(/\.(nova|json)$/, '');
              
              // Update recent projects
              await this.addToRecentProjects({
                name: projectConfig.name,
                path: projectPath,
                version: projectConfig.version,
                description: projectConfig.description,
                lastOpened: Date.now()
              });
              
              return {
                path: projectPath,
                config: projectConfig
              };
            } catch (error) {
              console.error('Failed to read project file:', error);
              throw new Error(`Invalid project file: ${error}`);
            }
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
  /**
   * Open project from folder path (for Tauri native file dialog)
   * 从文件夹路径打开项目（用于Tauri原生文件对话框）
   */
  async openProjectFromPath(folderPath: string): Promise<ProjectOpenResult | null> {
    try {
      // Check if running in Tauri environment
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      if (isTauri) {
        // Use Tauri file system API to read project.json or nova.config.json
        const { tauriFileService } = await import('./TauriFileService');
        const { join } = await import('@tauri-apps/api/path');
        
        // Try to find project configuration file
        const possibleConfigFiles = ['project.json', 'nova.config.json', 'package.json'];
        let projectConfig: ProjectConfig | null = null;
        
        for (const configFile of possibleConfigFiles) {
          const filePath = await join(folderPath, configFile);
          if (await tauriFileService.exists(filePath)) {
            const content = await tauriFileService.readTextFile(filePath);
            const parsed = JSON.parse(content);
            
            if (configFile === 'package.json' && parsed.name) {
              // Convert package.json to project config
              projectConfig = {
                name: parsed.name,
                version: parsed.version || '1.0.0',
                description: parsed.description || '',
                author: parsed.author || '',
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                settings: {
                  defaultScene: 'main.scene',
                  physics: {
                    gravity: { x: 0, y: -9.8 },
                    timeStep: 1/60
                  },
                  rendering: {
                    backgroundColor: '#2c2c2c',
                    ambientLight: '#404040'
                  }
                }
              };
              break;
            } else if (parsed.name || parsed.title) {
              // Use as project config
              projectConfig = {
                name: parsed.name || parsed.title,
                version: parsed.version || '1.0.0',
                description: parsed.description || '',
                author: parsed.author || '',
                createdAt: parsed.createdAt || Date.now(),
                modifiedAt: Date.now(),
                settings: parsed.settings || {
                  defaultScene: 'main.scene',
                  physics: {
                    gravity: { x: 0, y: -9.8 },
                    timeStep: 1/60
                  },
                  rendering: {
                    backgroundColor: '#2c2c2c',
                    ambientLight: '#404040'
                  }
                }
              };
              break;
            }
          }
        }
        
        if (!projectConfig) {
          // Create a default project config based on folder name
          const folderName = folderPath.split(/[\\/]/).pop() || 'Untitled Project';
          projectConfig = {
            name: folderName,
            version: '1.0.0',
            description: `Project in ${folderPath}`,
            author: '',
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            settings: {
              defaultScene: 'main.scene',
              physics: {
                gravity: { x: 0, y: -9.8 },
                timeStep: 1/60
              },
              rendering: {
                backgroundColor: '#2c2c2c',
                ambientLight: '#404040'
              }
            }
          };
        }
        
        // At this point projectConfig should never be null
        if (!projectConfig) {
          throw new Error('Failed to create project configuration');
        }
        
        // Update recent projects
        await this.addToRecentProjects({
          name: projectConfig.name,
          path: folderPath,
          version: projectConfig.version,
          description: projectConfig.description,
          lastOpened: Date.now()
        });
        
        return {
          path: folderPath,
          config: projectConfig
        };
      } else {
        // Fallback to browser method
        return await this.openProjectByPath(folderPath);
      }
    } catch (error) {
      console.error('Error opening project from path:', error);
      throw error;
    }
  }

  async openProjectByPath(projectPath: string): Promise<ProjectOpenResult | null> {
    try {
      // Check if running in Tauri environment
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      if (isTauri) {
        // Use Tauri file system to read project config
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        
        try {
          const configPath = await join(projectPath, 'nova.config.json');
          const configContent = await readTextFile(configPath);
          const projectConfig = JSON.parse(configContent);
          
          // Update last opened time
          await this.addToRecentProjects({
            name: projectConfig.name,
            path: projectPath,
            version: projectConfig.version,
            description: projectConfig.description,
            lastOpened: Date.now()
          });
          
          return {
            path: projectPath,
            config: projectConfig
          };
        } catch (fileError) {
          throw new Error(`Project config file not found or invalid: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
        }
      } else {
        // Browser environment - try localStorage fallback
        const projectDataStr = localStorage.getItem(`nova-project-${projectPath}`);
        
        if (!projectDataStr) {
          throw new Error('Project not found in browser storage. Please use "Open Project File" to select the project configuration file.');
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
      }
    } catch (error) {
      console.error('Failed to open project by path:', error);
      throw new Error(`Failed to open project: ${error instanceof Error ? error.message : String(error)}`);
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