/**
 * Geometry System for SceneView rendering
 */

import * as THREE from 'three';

/**
 * Geometry configuration interface
 */
export interface GeometryConfig {
  type: 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus' | 'capsule' | 'custom';
  parameters?: Record<string, number>;
}

/**
 * Predefined geometry configurations
 */
export const PREDEFINED_GEOMETRIES: Record<string, GeometryConfig> = {
  'box': {
    type: 'box',
    parameters: { width: 1, height: 1, depth: 1 }
  },
  'sphere': {
    type: 'sphere',
    parameters: { radius: 0.5, widthSegments: 16, heightSegments: 12 }
  },
  'plane': {
    type: 'plane',
    parameters: { width: 1, height: 1 }
  },
  'cylinder': {
    type: 'cylinder',
    parameters: { radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 8 }
  },
  'cone': {
    type: 'cone',
    parameters: { radius: 0.5, height: 1, radialSegments: 8 }
  },
  'torus': {
    type: 'torus',
    parameters: { radius: 0.4, tube: 0.2, radialSegments: 8, tubularSegments: 6 }
  },
  'capsule': {
    type: 'capsule',
    parameters: { radius: 0.3, length: 0.8, capSegments: 4, radialSegments: 8 }
  }
};

/**
 * Create Three.js geometry from configuration
 */
export function createGeometry(config: GeometryConfig): THREE.BufferGeometry {
  const params = config.parameters || {};

  switch (config.type) {
    case 'box':
      return new THREE.BoxGeometry(
        params.width || 1,
        params.height || 1,
        params.depth || 1
      );

    case 'sphere':
      return new THREE.SphereGeometry(
        params.radius || 0.5,
        params.widthSegments || 16,
        params.heightSegments || 12
      );

    case 'plane':
      return new THREE.PlaneGeometry(
        params.width || 1,
        params.height || 1
      );

    case 'cylinder':
      return new THREE.CylinderGeometry(
        params.radiusTop || 0.5,
        params.radiusBottom || 0.5,
        params.height || 1,
        params.radialSegments || 8
      );

    case 'cone':
      return new THREE.ConeGeometry(
        params.radius || 0.5,
        params.height || 1,
        params.radialSegments || 8
      );

    case 'torus':
      return new THREE.TorusGeometry(
        params.radius || 0.4,
        params.tube || 0.2,
        params.radialSegments || 8,
        params.tubularSegments || 6
      );

    case 'capsule':
      return new THREE.CapsuleGeometry(
        params.radius || 0.3,
        params.length || 0.8,
        params.capSegments || 4,
        params.radialSegments || 8
      );

    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

/**
 * Get geometry configuration by type
 */
export function getGeometryConfig(geometryType: string): GeometryConfig {
  return PREDEFINED_GEOMETRIES[geometryType] || PREDEFINED_GEOMETRIES['box'];
}

/**
 * Get all available geometry types
 */
export function getAvailableGeometries(): string[] {
  return Object.keys(PREDEFINED_GEOMETRIES);
}