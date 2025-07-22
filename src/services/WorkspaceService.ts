/**
 * Workspace configuration persistence service
 * 工作区配置持久化服务
 */

import type { LayoutConfig, ThemeConfig } from '../types';

const WORKSPACE_STORAGE_KEY = 'nova-editor-workspace';

/**
 * Workspace configuration interface
 * 工作区配置接口
 */
export interface WorkspaceConfig {
  /** Layout configuration */
  layout: LayoutConfig;
  /** Theme configuration */
  theme: ThemeConfig;
  /** Last saved timestamp */
  lastSaved: number;
  /** Workspace version */
  version: string;
}

/**
 * Workspace service for managing layout and theme persistence
 * 工作区服务，用于管理布局和主题的持久化
 */
export class WorkspaceService {
  private static instance: WorkspaceService | null = null;

  /**
   * Get singleton instance
   */
  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  /**
   * Save workspace configuration to localStorage
   * 将工作区配置保存到localStorage
   */
  public saveWorkspace(layout: LayoutConfig, theme: ThemeConfig): void {
    try {
      const workspaceConfig: WorkspaceConfig = {
        layout,
        theme,
        lastSaved: Date.now(),
        version: '1.0.0'
      };

      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceConfig));
      console.log('Workspace configuration saved');
    } catch (error) {
      console.error('Failed to save workspace configuration:', error);
    }
  }

  /**
   * Load workspace configuration from localStorage
   * 从localStorage加载工作区配置
   */
  public loadWorkspace(): WorkspaceConfig | null {
    try {
      const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const config = JSON.parse(stored) as WorkspaceConfig;
      
      // Validate configuration structure
      if (!this.isValidWorkspaceConfig(config)) {
        console.warn('Invalid workspace configuration found, ignoring');
        return null;
      }

      console.log('Workspace configuration loaded');
      return config;
    } catch (error) {
      console.error('Failed to load workspace configuration:', error);
      return null;
    }
  }

  /**
   * Clear workspace configuration
   * 清除工作区配置
   */
  public clearWorkspace(): void {
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      console.log('Workspace configuration cleared');
    } catch (error) {
      console.error('Failed to clear workspace configuration:', error);
    }
  }

  /**
   * Check if workspace configuration exists
   * 检查工作区配置是否存在
   */
  public hasWorkspace(): boolean {
    try {
      return localStorage.getItem(WORKSPACE_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Export workspace configuration as JSON
   * 将工作区配置导出为JSON
   */
  public exportWorkspace(): string | null {
    const config = this.loadWorkspace();
    if (!config) {
      return null;
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import workspace configuration from JSON
   * 从JSON导入工作区配置
   */
  public importWorkspace(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson) as WorkspaceConfig;
      
      if (!this.isValidWorkspaceConfig(config)) {
        throw new Error('Invalid workspace configuration format');
      }

      // Update timestamp
      config.lastSaved = Date.now();
      
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(config));
      console.log('Workspace configuration imported');
      return true;
    } catch (error) {
      console.error('Failed to import workspace configuration:', error);
      return false;
    }
  }

  /**
   * Validate workspace configuration structure
   * 验证工作区配置结构
   */
  private isValidWorkspaceConfig(config: any): config is WorkspaceConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // Check required properties
    if (!config.layout || !config.theme || typeof config.lastSaved !== 'number') {
      return false;
    }

    // Check layout structure
    if (!Array.isArray(config.layout.panels) || !config.layout.grid) {
      return false;
    }

    // Check theme structure
    if (!config.theme.name || !config.theme.colors || !config.theme.typography) {
      return false;
    }

    return true;
  }

  /**
   * Save configuration with debouncing to avoid too frequent saves
   * 使用防抖保存配置，避免过于频繁的保存
   */
  private saveTimer: number | null = null;
  
  public debouncedSave(layout: LayoutConfig, theme: ThemeConfig, delay: number = 1000): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = window.setTimeout(() => {
      this.saveWorkspace(layout, theme);
      this.saveTimer = null;
    }, delay);
  }
}

// Export singleton instance
export const workspaceService = WorkspaceService.getInstance();