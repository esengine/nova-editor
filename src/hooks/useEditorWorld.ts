/**
 * React hook for managing EditorWorld lifecycle
 * 管理EditorWorld生命周期的React钩子
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { componentPreloader } from '../core/plugins/ComponentPreloader';

/**
 * Hook to initialize and manage the EditorWorld instance
 * 初始化和管理EditorWorld实例的钩子
 */
export function useEditorWorld(shouldInitialize: boolean = true) {
  const initializeWorld = useEditorStore(state => state.initializeWorld);
  const updateWorldStats = useEditorStore(state => state.updateWorldStats);
  const world = useEditorStore(state => state.world.instance);
  const isLoading = useEditorStore(state => state.isLoading);
  const initialized = useRef(false);

  useEffect(() => {
    if (shouldInitialize && !initialized.current && !world && !isLoading) {
      const initializeWhenReady = () => {
        if (componentPreloader.isLoaded()) {
          initialized.current = true;
          initializeWorld().catch(console.error);
        } else {
          setTimeout(initializeWhenReady, 50);
        }
      };
      
      initializeWhenReady();
    }
  }, [shouldInitialize, initializeWorld, world, isLoading]);

  useEffect(() => {
    if (!world) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const updateLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Update world
      if (world.updateAsync) {
        world.updateAsync(deltaTime).catch(console.error);
      } else {
        world.update(deltaTime);
      }

      // Update stats periodically (every 60 frames ~1 second)
      if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - deltaTime * 1000) / 1000)) {
        updateWorldStats();
      }

      animationFrame = requestAnimationFrame(updateLoop);
    };

    animationFrame = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [world, updateWorldStats]);

  return {
    world,
    isInitialized: !!world
  };
}