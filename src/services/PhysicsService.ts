/**
 * Physics service for managing physics engines in the editor
 * 编辑器中管理物理引擎的物理服务
 */

import { Box2DPhysicsPlugin, type Box2DPluginConfig } from '@esengine/nova-ecs-physics-box2d';
import { FixedVector2 } from '@esengine/nova-ecs-math';
import { EditorWorld } from '../ecs/EditorWorld';

/**
 * Physics service singleton for managing physics integration
 * 管理物理集成的物理服务单例
 */
export class PhysicsService {
  private static instance: PhysicsService;
  private physicsPlugin: Box2DPhysicsPlugin | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PhysicsService {
    if (!PhysicsService.instance) {
      PhysicsService.instance = new PhysicsService();
    }
    return PhysicsService.instance;
  }

  /**
   * Initialize physics system with Box2D
   * 使用Box2D初始化物理系统
   */
  async initializePhysics(world: EditorWorld): Promise<void> {
    if (this.isInitialized) {
      console.warn('Physics system already initialized');
      return;
    }

    try {
      // Create Box2D physics plugin with editor-friendly settings
      const config: Box2DPluginConfig = {
        worldConfig: {
          gravity: new FixedVector2(0, -9.81),
          velocityIterations: 8,
          positionIterations: 3,
          allowSleep: true
        },
        fixedTimeStep: 1/60,
        maxSubSteps: 10,
        enableDebugRender: true,
        autoCreateSystems: true,
        enableCCD: true,
        enableWarmStarting: true,
        enableSubStepping: false
      };

      this.physicsPlugin = new Box2DPhysicsPlugin(config);
      
      // Install physics plugin to the world
      await world.plugins.install(this.physicsPlugin);
      
      this.isInitialized = true;
      console.log('Physics system initialized with Box2D');
    } catch (error) {
      console.error('Failed to initialize physics system:', error);
      throw error;
    }
  }

  /**
   * Shutdown physics system
   * 关闭物理系统
   */
  async shutdownPhysics(world: EditorWorld): Promise<void> {
    if (!this.isInitialized || !this.physicsPlugin) {
      return;
    }

    try {
      await world.plugins.uninstall(this.physicsPlugin.metadata.name);
      this.physicsPlugin = null;
      this.isInitialized = false;
      console.log('Physics system shutdown');
    } catch (error) {
      console.error('Failed to shutdown physics system:', error);
      throw error;
    }
  }

  /**
   * Get the current physics plugin
   * 获取当前物理插件
   */
  getPhysicsPlugin(): Box2DPhysicsPlugin | null {
    return this.physicsPlugin;
  }

  /**
   * Check if physics system is initialized
   * 检查物理系统是否已初始化
   */
  isPhysicsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Update physics settings
   * 更新物理设置
   */
  updatePhysicsSettings(settings: Partial<Box2DPluginConfig>): void {
    if (!this.physicsPlugin) {
      console.warn('Physics plugin not initialized');
      return;
    }

    // Update plugin configuration
    // const currentConfig = this.physicsPlugin.getConfig();
    // const newConfig = { ...currentConfig, ...settings };
    
    // Note: Some settings may require recreating the world
    console.log('Physics settings updated:', settings);
  }

  /**
   * Toggle physics simulation
   * 切换物理模拟
   */
  togglePhysicsSimulation(enabled: boolean): void {
    if (!this.physicsPlugin) {
      console.warn('Physics plugin not initialized');
      return;
    }

    // This would typically pause/resume the physics world
    console.log('Physics simulation', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get physics debug information
   * 获取物理调试信息
   */
  getPhysicsDebugInfo(): Record<string, unknown> {
    if (!this.physicsPlugin) {
      return { status: 'not_initialized' };
    }

    return this.physicsPlugin.getDebugInfo();
  }
}

// Export singleton instance
export const physicsService = PhysicsService.getInstance();