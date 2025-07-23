/**
 * SceneViewPanel exports
 */

export { SceneViewPanel } from './SceneViewPanel';
export type { SceneViewPanelProps } from './SceneViewPanel';

// Export enhanced rendering systems
export { MaterialComponent, PREDEFINED_MATERIALS, getMaterialConfig, getAvailableMaterials } from './MaterialSystem';
export { createGeometry, getGeometryConfig, getAvailableGeometries, PREDEFINED_GEOMETRIES } from './GeometrySystem';
export { NovaThreeRenderer } from './NovaThreeRenderer';