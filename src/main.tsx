import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { componentPreloader } from './core/plugins/ComponentPreloader';
import { usePluginStore } from './stores/pluginStore';
async function initializeTauri() {
  if ('isTauri' in window) {
    return;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('tauri');
    
    Object.defineProperty(window, 'isTauri', {
      value: true,
      writable: false,
      enumerable: true,
      configurable: true
    });
  } catch (error) {
    Object.defineProperty(window, 'isTauri', {
      value: false,
      writable: false,
      enumerable: true,
      configurable: true
    });
  }
}

const initializeApp = async () => {
  try {
    const pluginStore = usePluginStore.getState();
    
    console.log('Preloading components...');
    await componentPreloader.preloadAllComponents();
    console.log('Components preloaded successfully');
    
    pluginStore.setInitialized(true);
    console.log('Plugin system initialized');
    
    console.log('Nova Editor application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Nova Editor application:', error);
    
    const pluginStore = usePluginStore.getState();
    pluginStore.setInitialized(false, error instanceof Error ? error.message : String(error));
    
    throw error;
  }
};

initializeTauri()
  .then(() => initializeApp())
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error('Application initialization failed:', error);
    
    if (!('isTauri' in window)) {
      Object.defineProperty(window, 'isTauri', {
        value: false,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

console.log('Nova Editor Starting...');
console.log('Nova Editor - Next Generation Visual Editor for NovaECS');
