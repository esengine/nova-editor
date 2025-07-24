/**
 * Dynamically imports component files to trigger decorator execution
 */
export class ComponentPreloader {
  private static instance: ComponentPreloader;
  private loaded = false;

  private constructor() {}

  static getInstance(): ComponentPreloader {
    if (!ComponentPreloader.instance) {
      ComponentPreloader.instance = new ComponentPreloader();
    }
    return ComponentPreloader.instance;
  }

  private async preloadCoreComponents(): Promise<void> {
    try {
      await import('@esengine/nova-ecs-core/src/components/TransformComponent');
      await import('@esengine/nova-ecs-core/src/components/EditorMetadataComponent');
    } catch (error) {
      console.error('Failed to preload nova-ecs-core components:', error);
      throw error;
    }
  }

  private async preloadThreeComponents(): Promise<void> {
    try {
      await import('@esengine/nova-ecs-render-three/src/components/ThreeLightComponent');
      await import('@esengine/nova-ecs-render-three/src/components/ThreeCameraComponent');
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeMeshComponent');
      } catch (e) {
        console.warn('ThreeMeshComponent not found, skipping');
      }
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeMaterialComponent');
      } catch (e) {
        console.warn('ThreeMaterialComponent not found, skipping');
      }
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeGeometryComponent');
      } catch (e) {
        console.warn('ThreeGeometryComponent not found, skipping');
      }
    } catch (error) {
      console.error('Failed to preload nova-ecs-render-three components:', error);
      throw error;
    }
  }

  async preloadAllComponents(): Promise<void> {
    if (this.loaded) {
      return;
    }
    
    try {
      await this.preloadCoreComponents();
      await this.preloadThreeComponents();
      
      const { discoverAndRegisterComponents } = await import('@esengine/nova-ecs-editor');
      discoverAndRegisterComponents();
      
      this.loaded = true;
      
    } catch (error) {
      console.error('Failed to preload components:', error);
      throw error;
    }
  }
  isLoaded(): boolean {
    return this.loaded;
  }
}

// Export singleton instance
export const componentPreloader = ComponentPreloader.getInstance();