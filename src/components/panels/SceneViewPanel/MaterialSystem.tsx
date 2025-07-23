/**
 * Material System for SceneView rendering
 * SceneView渲染的材质系统
 */

import React from 'react';
import * as THREE from 'three';
// import { useLoader } from '@react-three/fiber'; // Unused for now

/**
 * Material configuration interface
 * 材质配置接口
 */
export interface MaterialConfig {
  type: 'standard' | 'phong' | 'lambert' | 'basic' | 'wireframe' | 'physical';
  color: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
  texture?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
}

/**
 * Predefined materials for common use cases
 * 常用情况的预定义材质
 */
export const PREDEFINED_MATERIALS: Record<string, MaterialConfig> = {
  'DefaultMaterial': {
    type: 'standard',
    color: '#4CAF50',
    metalness: 0.2,
    roughness: 0.8
  },
  'MetalMaterial': {
    type: 'standard',
    color: '#9E9E9E',
    metalness: 0.9,
    roughness: 0.1
  },
  'PlasticMaterial': {
    type: 'standard',
    color: '#2196F3',
    metalness: 0.0,
    roughness: 0.9
  },
  'GlassMaterial': {
    type: 'physical',
    color: '#E3F2FD',
    metalness: 0.0,
    roughness: 0.0,
    transparent: true,
    opacity: 0.3
  },
  'EnemyMaterial': {
    type: 'standard',
    color: '#F44336',
    metalness: 0.3,
    roughness: 0.7
  },
  'GroundMaterial': {
    type: 'standard',
    color: '#795548',
    metalness: 0.1,
    roughness: 0.9
  },
  'WireframeMaterial': {
    type: 'wireframe',
    color: '#FFC107',
    wireframe: true
  },
  'EmissiveMaterial': {
    type: 'standard',
    color: '#000000',
    emissive: '#FF5722',
    emissiveIntensity: 0.5,
    metalness: 0.0,
    roughness: 1.0
  }
};

/**
 * Create Three.js material from configuration
 * 从配置创建Three.js材质
 */
export function createMaterial(config: MaterialConfig): THREE.Material {
  const baseProps = {
    color: new THREE.Color(config.color),
    transparent: config.transparent || false,
    opacity: config.opacity || 1.0,
    wireframe: config.wireframe || false
  };

  switch (config.type) {
    case 'standard':
      return new THREE.MeshStandardMaterial({
        ...baseProps,
        metalness: config.metalness || 0.0,
        roughness: config.roughness || 1.0,
        emissive: config.emissive ? new THREE.Color(config.emissive) : new THREE.Color(0x000000),
        emissiveIntensity: config.emissiveIntensity || 0.0
      });

    case 'phong':
      return new THREE.MeshPhongMaterial({
        ...baseProps,
        shininess: (1.0 - (config.roughness || 1.0)) * 100
      });

    case 'lambert':
      return new THREE.MeshLambertMaterial(baseProps);

    case 'basic':
      return new THREE.MeshBasicMaterial(baseProps);

    case 'physical':
      return new THREE.MeshPhysicalMaterial({
        ...baseProps,
        metalness: config.metalness || 0.0,
        roughness: config.roughness || 1.0,
        emissive: config.emissive ? new THREE.Color(config.emissive) : new THREE.Color(0x000000),
        emissiveIntensity: config.emissiveIntensity || 0.0
      });

    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        ...baseProps,
        wireframe: true
      });

    default:
      return new THREE.MeshStandardMaterial(baseProps);
  }
}

/**
 * Material component that wraps Three.js materials
 * 包装Three.js材质的材质组件
 */
interface MaterialComponentProps {
  materialName: string;
  isSelected?: boolean;
  children: React.ReactNode;
}

export const MaterialComponent: React.FC<MaterialComponentProps> = ({
  materialName,
  isSelected = false,
  children
}) => {
  const config = PREDEFINED_MATERIALS[materialName] || PREDEFINED_MATERIALS['DefaultMaterial'];
  
  // Create selection overlay material
  const selectionConfig: MaterialConfig = {
    ...config,
    transparent: true,
    opacity: isSelected ? 0.8 : 1.0,
    emissive: isSelected ? '#1890FF' : (config.emissive || '#000000'),
    emissiveIntensity: isSelected ? 0.3 : (config.emissiveIntensity || 0.0)
  };

  const material = React.useMemo(() => createMaterial(selectionConfig), [selectionConfig]);

  return (
    <>
      {React.cloneElement(children as React.ReactElement, { material })}
    </>
  );
};

/**
 * Get material configuration by name
 * 根据名称获取材质配置
 */
export function getMaterialConfig(materialName: string): MaterialConfig {
  return PREDEFINED_MATERIALS[materialName] || PREDEFINED_MATERIALS['DefaultMaterial'];
}

/**
 * Get all available material names
 * 获取所有可用的材质名称
 */
export function getAvailableMaterials(): string[] {
  return Object.keys(PREDEFINED_MATERIALS);
}