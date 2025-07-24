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
    console.log('Preloading nova-ecs-core components...');
    
    try {
      await import('@esengine/nova-ecs-core/src/components/TransformComponent');
      console.log('TransformComponent loaded');
      
      await import('@esengine/nova-ecs-core/src/components/EditorMetadataComponent');
      console.log('EditorMetadataComponent loaded');
      
      console.log('All nova-ecs-core components preloaded');
    } catch (error) {
      console.error('Failed to preload nova-ecs-core components:', error);
      throw error;
    }
  }

  private async preloadThreeComponents(): Promise<void> {
    console.log('Preloading nova-ecs-render-three components...');
    
    try {
      await import('@esengine/nova-ecs-render-three/src/components/ThreeLightComponent');
      console.log('ThreeLightComponent loaded');
      
      await import('@esengine/nova-ecs-render-three/src/components/ThreeCameraComponent');
      console.log('ThreeCameraComponent loaded');
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeMeshComponent');
        console.log('ThreeMeshComponent loaded');
      } catch (e) {
        console.warn('ThreeMeshComponent not found, skipping');
      }
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeMaterialComponent');
        console.log('ThreeMaterialComponent loaded');
      } catch (e) {
        console.warn('ThreeMaterialComponent not found, skipping');
      }
      
      try {
        await import('@esengine/nova-ecs-render-three/src/components/ThreeGeometryComponent');
        console.log('ThreeGeometryComponent loaded');
      } catch (e) {
        console.warn('ThreeGeometryComponent not found, skipping');
      }
      
      console.log('All nova-ecs-render-three components preloaded');
    } catch (error) {
      console.error('Failed to preload nova-ecs-render-three components:', error);
      throw error;
    }
  }

  async preloadAllComponents(): Promise<void> {
    if (this.loaded) {
      console.warn('Components already preloaded');
      return;
    }

    console.log('Starting component preloading...');
    
    try {
      await this.preloadCoreComponents();
      await this.preloadThreeComponents();
      
      console.log('Discovering and registering components...');
      const { discoverAndRegisterComponents } = await import('@esengine/nova-ecs-editor');
      discoverAndRegisterComponents();
      console.log('Component discovery and registration completed');
      
      this.loaded = true;
      console.log('All system components preloaded successfully');
      
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