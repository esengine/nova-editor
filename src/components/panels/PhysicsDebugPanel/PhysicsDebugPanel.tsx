/**
 * Physics Debug Panel - Shows physics simulation information and controls
 * 物理调试面板 - 显示物理模拟信息和控制
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Switch, 
  Slider, 
  Statistic, 
  Row, 
  Col, 
  Divider,
  Space,
  Tag,
  Collapse
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { FixedVector2 } from '@esengine/nova-ecs-math';
import { physicsService } from '../../../services/PhysicsService';
import { useEditorStore } from '../../../stores/editorStore';

const { Panel } = Collapse;

export interface PhysicsDebugPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export const PhysicsDebugPanel: React.FC<PhysicsDebugPanelProps> = ({
  style,
  className
}) => {
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const [debugDrawEnabled, setDebugDrawEnabled] = useState(false);
  const [gravity, setGravity] = useState(9.81);
  const [timeStep, setTimeStep] = useState(1/60);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  
  const world = useEditorStore(state => state.world.instance);

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (physicsService.isPhysicsInitialized()) {
        const info = physicsService.getPhysicsDebugInfo();
        setDebugInfo(info);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, []);

  // Get physics statistics
  const getPhysicsStats = () => {
    if (!world || !physicsService.isPhysicsInitialized()) {
      return {
        rigidBodies: 0,
        colliders: 0,
        joints: 0,
        contacts: 0
      };
    }

    // Count physics components in the world
    const entities = world.entities;
    let rigidBodies = 0;
    let colliders = 0;
    let joints = 0;

    entities.forEach((entity: any) => {
      const components = entity.getComponents();
      components.forEach((component: any) => {
        const componentName = component.constructor.name;
        if (componentName.includes('RigidBody')) rigidBodies++;
        if (componentName.includes('Collider')) colliders++;
        if (componentName.includes('Joint')) joints++;
      });
    });

    return {
      rigidBodies,
      colliders,
      joints,
      contacts: (debugInfo as any)?.contacts || 0
    };
  };

  const stats = getPhysicsStats();

  const handleTogglePhysics = () => {
    const newState = !isPhysicsEnabled;
    setIsPhysicsEnabled(newState);
    physicsService.togglePhysicsSimulation(newState);
  };

  const handleResetPhysics = () => {
    // Reset all physics bodies to their initial state
    console.log('Physics reset requested');
  };

  const handleGravityChange = (value: number) => {
    setGravity(value);
    physicsService.updatePhysicsSettings({
      worldConfig: {
        gravity: new FixedVector2(0, -value)
      }
    });
  };

  const handleTimeStepChange = (value: number) => {
    setTimeStep(value);
    physicsService.updatePhysicsSettings({
      fixedTimeStep: value
    });
  };

  const isInitialized = physicsService.isPhysicsInitialized();

  return (
    <div
      style={{
        height: '100%',
        padding: '16px',
        backgroundColor: '#1f1f1f',
        border: '1px solid #303030',
        borderRadius: '6px',
        overflow: 'auto',
        ...style
      }}
      className={className}
    >
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span>
            <span>物理调试</span>
            <Tag color={isInitialized ? 'green' : 'red'}>
              {isInitialized ? '已初始化' : '未初始化'}
            </Tag>
          </div>
        }
        style={{ marginBottom: '16px' }}
      >
        {!isInitialized ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            物理系统未初始化
          </div>
        ) : (
          <>
            {/* Physics Controls */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>物理模拟</span>
                <Switch
                  checked={isPhysicsEnabled}
                  onChange={handleTogglePhysics}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>调试绘制</span>
                <Switch
                  checked={debugDrawEnabled}
                  onChange={setDebugDrawEnabled}
                  checkedChildren={<EyeOutlined />}
                  unCheckedChildren={<EyeInvisibleOutlined />}
                />
              </div>

              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleResetPhysics}
                style={{ width: '100%' }}
              >
                重置物理状态
              </Button>
            </Space>

            <Divider />

            {/* Physics Statistics */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="刚体"
                  value={stats.rigidBodies}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="碰撞器"
                  value={stats.colliders}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="关节"
                  value={stats.joints}
                  valueStyle={{ color: '#faad14', fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="接触点"
                  value={stats.contacts}
                  valueStyle={{ color: '#f5222d', fontSize: '20px' }}
                />
              </Col>
            </Row>

            <Divider />

            {/* Physics Settings */}
            <Collapse ghost>
              <Panel 
                header="物理设置" 
                key="settings"
                extra={<SettingOutlined />}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    重力: {gravity.toFixed(2)} m/s²
                  </div>
                  <Slider
                    min={0}
                    max={20}
                    step={0.1}
                    value={gravity}
                    onChange={handleGravityChange}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    时间步长: {(timeStep * 1000).toFixed(1)} ms
                  </div>
                  <Slider
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    value={timeStep}
                    onChange={handleTimeStepChange}
                  />
                </div>
              </Panel>

              <Panel 
                header="调试信息" 
                key="debug"
              >
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </Panel>
            </Collapse>
          </>
        )}
      </Card>
    </div>
  );
};