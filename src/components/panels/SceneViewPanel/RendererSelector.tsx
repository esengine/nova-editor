/**
 * Renderer Selector Component
 * 渲染器选择组件 - 允许在React Three Fiber和Nova Three.js之间切换
 */

import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons';
// import { useEditorStore } from '../../../stores/editorStore'; // Unused for now

export type RendererType = 'react-three-fiber' | 'nova-three';

export interface RendererSelectorProps {
  currentRenderer: RendererType;
  onRendererChange: (renderer: RendererType) => void;
}

export const RendererSelector: React.FC<RendererSelectorProps> = ({
  currentRenderer,
  onRendererChange
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '6px',
      padding: '4px'
    }}>
      <Space.Compact>
        <Tooltip title="React Three Fiber (R3F) - React集成渲染器">
          <Button
            type={currentRenderer === 'react-three-fiber' ? 'primary' : 'default'}
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => onRendererChange('react-three-fiber')}
          >
            R3F
          </Button>
        </Tooltip>
        <Tooltip title="Nova Three.js - 原生Three.js ECS渲染器">
          <Button
            type={currentRenderer === 'nova-three' ? 'primary' : 'default'}
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => onRendererChange('nova-three')}
          >
            Nova
          </Button>
        </Tooltip>
      </Space.Compact>
    </div>
  );
};