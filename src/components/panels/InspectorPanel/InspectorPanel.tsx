/**
 * Inspector Panel - Uses nova-ecs-editor package for component metadata
 * 检查器面板 - 使用nova-ecs-editor包获取组件元数据
 * 
 * This inspector uses the nova-ecs-editor package for clean separation between runtime and editor code.
 * 该检查器使用nova-ecs-editor包在运行时和编辑器代码之间进行清晰分离。
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  InputNumber, 
  Switch, 
  Select, 
  Tooltip,
  Empty,
  Tag,
  Slider,
  ColorPicker,
  Divider,
  Collapse
} from 'antd';
import {
  DeleteOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import {
  canRemoveComponent,
  getEditorComponentRegistry,
  type ComponentRegistration,
  type PropertyMetadata
} from '@esengine/nova-ecs-editor';
import { PhysicsTransformComponent } from '@esengine/nova-ecs-physics-core';
import type { EntityId, ComponentType } from '@esengine/nova-ecs';
import { ComponentSelector } from './ComponentSelector';

const { Option } = Select;

/**
 * Property editor based on metadata from nova-ecs-editor
 * 基于nova-ecs-editor元数据的属性编辑器
 */
const PropertyEditor: React.FC<{
  property: string;
  value: any;
  metadata: PropertyMetadata;
  onChange: (value: any) => void;
}> = ({ property, value, metadata, onChange }) => {
  const displayName = metadata.displayName || property;
  
  // Use local state for input values to prevent conflicts with ECS updates
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  
  // Update local value when prop value changes (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);
  
  // Handle committing changes
  const commitChange = useCallback((newValue: any) => {
    onChange(newValue);
    setLocalValue(newValue);
    setIsEditing(false);
  }, [onChange]);
  
  // Handle starting edit
  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Vector3 properties - handle objects with x, y, z properties
  // Vector3属性 - 处理具有x、y、z属性的对象
  if (metadata.type === 'vector3' && typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {displayName}
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            size="small"
            placeholder="X"
            value={localValue.x}
            onChange={(x) => {
              const newValue = { ...localValue, x: x || 0 };
              setLocalValue(newValue);
              setIsEditing(true);
            }}
            onBlur={() => commitChange(localValue)}
            onPressEnter={() => commitChange(localValue)}
            onFocus={startEdit}
            step={0.1}
            precision={2}
            style={{ width: '33.33%' }}
            disabled={metadata.readonly || false}
          />
          <InputNumber
            size="small"
            placeholder="Y"
            value={localValue.y}
            onChange={(y) => {
              const newValue = { ...localValue, y: y || 0 };
              setLocalValue(newValue);
              setIsEditing(true);
            }}
            onBlur={() => commitChange(localValue)}
            onPressEnter={() => commitChange(localValue)}
            onFocus={startEdit}
            step={0.1}
            precision={2}
            style={{ width: '33.33%' }}
            disabled={metadata.readonly || false}
          />
          <InputNumber
            size="small"
            placeholder="Z"
            value={localValue.z}
            onChange={(z) => {
              const newValue = { ...localValue, z: z || 0 };
              setLocalValue(newValue);
              setIsEditing(true);
            }}
            onBlur={() => commitChange(localValue)}
            onPressEnter={() => commitChange(localValue)}
            onFocus={startEdit}
            step={0.1}
            precision={2}
            style={{ width: '33.33%' }}
            disabled={metadata.readonly || false}
          />
        </Space.Compact>
        {metadata.description && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {metadata.description}
          </div>
        )}
      </div>
    );
  }
  
  // Boolean properties - render as switch
  // 布尔属性 - 渲染为开关
  if (metadata.type === 'boolean') {
    return (
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{displayName}</span>
          {metadata.description && (
            <div style={{ fontSize: '11px', color: '#666' }}>{metadata.description}</div>
          )}
        </div>
        <Switch 
          size="small" 
          checked={value} 
          onChange={onChange}
          disabled={metadata.readonly || false}
        />
      </div>
    );
  }

  // Range properties - render as slider
  // 范围属性 - 渲染为滑块
  if (metadata.type === 'range') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {displayName}
        </div>
        <Slider
          min={metadata.min || 0}
          max={metadata.max || 100}
          step={metadata.step || 1}
          value={value}
          onChange={onChange}
          disabled={metadata.readonly || false}
          tooltip={{ formatter: (val) => `${val}` }}
        />
        {metadata.description && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {metadata.description}
          </div>
        )}
      </div>
    );
  }

  // Enum properties - render as select dropdown
  // 枚举属性 - 渲染为选择下拉框
  if (metadata.type === 'enum' && metadata.options) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {displayName}
        </div>
        <Select
          size="small"
          value={value}
          onChange={onChange}
          style={{ width: '100%' }}
          disabled={metadata.readonly || false}
        >
          {metadata.options.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
        {metadata.description && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {metadata.description}
          </div>
        )}
      </div>
    );
  }

  // Color properties - render with color picker
  // 颜色属性 - 使用颜色选择器渲染
  if (metadata.type === 'color') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ColorPicker
            value={value}
            onChange={(color) => onChange(color.toHexString())}
            disabled={metadata.readonly || false}
          />
          <Input
            size="small"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1 }}
            disabled={metadata.readonly || false}
          />
        </div>
        {metadata.description && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {metadata.description}
          </div>
        )}
      </div>
    );
  }
  
  // Number properties - render as input number
  // 数字属性 - 渲染为数字输入框
  if (metadata.type === 'number') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {displayName}
        </div>
        <InputNumber
          size="small"
          value={localValue}
          onChange={(newValue) => {
            setLocalValue(newValue);
            setIsEditing(true);
          }}
          onBlur={() => commitChange(localValue)}
          onPressEnter={() => commitChange(localValue)}
          onFocus={startEdit}
          min={metadata.min}
          max={metadata.max}
          step={metadata.step || 0.1}
          precision={2}
          style={{ width: '100%' }}
          disabled={metadata.readonly || false}
        />
        {metadata.description && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {metadata.description}
          </div>
        )}
      </div>
    );
  }
  
  // String properties (default) - render as text input
  // 字符串属性（默认） - 渲染为文本输入框
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
        {displayName}
      </div>
      <Input
        size="small"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          setIsEditing(true);
        }}
        onBlur={() => commitChange(localValue)}
        onPressEnter={() => commitChange(localValue)}
        onFocus={startEdit}
        disabled={metadata.readonly || false}
      />
      {metadata.description && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          {metadata.description}
        </div>
      )}
    </div>
  );
};

/**
 * Component editor using nova-ecs-editor metadata
 * 使用nova-ecs-editor元数据的组件编辑器
 */
const ComponentEditor: React.FC<{
  componentType: ComponentType;
  componentInstance: any;
  registration: ComponentRegistration;
  onToggle: () => void;
  onRemove: () => void;
  onPropertyChange: (property: string, value: any) => void;
}> = ({ componentType, componentInstance, registration, onToggle, onRemove, onPropertyChange }) => {
  const [enabled, setEnabled] = useState(componentInstance?.enabled ?? true);
  const [collapsed, setCollapsed] = useState(false);
  
  const { metadata, properties } = registration;

  const collapseItems = [
    {
      key: 'properties',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{metadata.icon || '📦'}</span>
            <span style={{ color: enabled ? '#ffffff' : '#666666' }}>
              {metadata.displayName}
            </span>
            <Tag color={enabled ? 'green' : 'default'} style={{ fontSize: '11px' }}>
              {componentType.name}
            </Tag>
            {metadata.category && (
              <Tag color="blue" style={{ fontSize: '10px' }}>
                {metadata.category}
              </Tag>
            )}
          </div>
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Tooltip title={enabled ? 'Disable Component 禁用组件' : 'Enable Component 启用组件'}>
              <Button
                type="text"
                size="small"
                icon={enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={() => {
                  setEnabled(!enabled);
                  onToggle();
                }}
              />
            </Tooltip>
            <Tooltip title="Component Settings 组件设置">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
              />
            </Tooltip>
            <Tooltip title="Remove Component 移除组件">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={onRemove}
                disabled={metadata.removable === false}
              />
            </Tooltip>
          </Space>
        </div>
      ),
      children: enabled && (
        <div style={{ padding: '8px 0' }}>
          {metadata.description && (
            <>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
                {metadata.description}
              </div>
              <Divider style={{ margin: '8px 0' }} />
            </>
          )}
          {Array.from(properties.entries()).map(([propertyName, propertyMetadata]) => {
            const value = componentInstance[propertyName];
            return (
              <PropertyEditor
                key={propertyName}
                property={propertyName}
                value={value}
                metadata={propertyMetadata}
                onChange={(newValue) => onPropertyChange(propertyName, newValue)}
              />
            );
          })}
        </div>
      ),
      style: {
        backgroundColor: 'transparent',
        borderColor: 'transparent'
      }
    }
  ];

  return (
    <div style={{ marginBottom: '8px' }}>
      <Collapse
        size="small"
        ghost
        activeKey={collapsed ? [] : ['properties']}
        onChange={(keys) => setCollapsed(keys.length === 0)}
        style={{
          backgroundColor: enabled ? '#1f1f1f' : '#2a2a2a',
          border: `1px solid ${enabled ? '#303030' : '#404040'}`,
          borderRadius: '6px'
        }}
        items={collapseItems}
      />
    </div>
  );
};

/**
 * Main Inspector Panel component
 * 主检查器面板组件
 */
export interface InspectorPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  style,
  className
}) => {
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const primarySelection = useEditorStore(state => state.selection.primarySelection);
  // Only subscribe to world instance, not the entire world state object to reduce re-renders
  const world = useEditorStore(state => state.world.instance);
  const setEntityName = useEditorStore(state => state.setEntityName);
  const setEntityActive = useEditorStore(state => state.setEntityActive);
  const addComponent = useEditorStore(state => state.addComponent);
  const removeComponent = useEditorStore(state => state.removeComponent);
  const updateComponentProperty = useEditorStore(state => state.updateComponentProperty);
  
  // Force update counter to trigger re-renders when component properties change
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  // Use stable references to avoid unnecessary re-renders
  const storeActions = useMemo(() => ({
    setEntityName,
    setEntityActive,
    addComponent,
    removeComponent,
    updateComponentProperty
  }), [setEntityName, setEntityActive, addComponent, removeComponent, updateComponentProperty]);

  // Get the primary selected entity
  // 获取主选中实体
  const selectedEntity = primarySelection && typeof primarySelection === 'number' && world
    ? world.getEntity(primarySelection as EntityId)
    : null;

  // Memoize entity components calculation to prevent unnecessary recalculations
  // 记忆化实体组件计算以防止不必要的重新计算
  const entityComponents = useMemo(() => {
    if (!selectedEntity) return [];
    
    const registry = getEditorComponentRegistry();
    const allComponents = selectedEntity.getComponents();
    
    const components = allComponents
      .map((component: any) => {
        const componentType = component.constructor as ComponentType;
        // Match by component name to handle multiple import paths
        const matchingRegistration = registry.getAll().find(reg => reg.componentType.name === componentType.name);
        
        return matchingRegistration ? {
          componentType,
          componentInstance: component,
          registration: matchingRegistration
        } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort by metadata order, then by name
        // 按元数据顺序排序，然后按名称排序
        const aOrder = a!.registration.metadata.order ?? 999;
        const bOrder = b!.registration.metadata.order ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a!.componentType.name.localeCompare(b!.componentType.name);
      }) as Array<{ componentType: ComponentType; componentInstance: any; registration: ComponentRegistration }>;
    
    return components;
  }, [selectedEntity, forceUpdateCounter]);
  
  // Listen for component and property changes to trigger re-render
  useEffect(() => {
    if (!world) return;
    
    const unsubscribeProperty = world.editorEvents.on('propertyChanged', () => {
      setForceUpdateCounter(prev => prev + 1);
    });
    
    const unsubscribeComponentAdded = world.editorEvents.on('componentAdded', () => {
      setForceUpdateCounter(prev => prev + 1);
    });
    
    const unsubscribeComponentRemoved = world.editorEvents.on('componentRemoved', () => {
      setForceUpdateCounter(prev => prev + 1);
    });
    
    return () => {
      unsubscribeProperty();
      unsubscribeComponentAdded();
      unsubscribeComponentRemoved();
    };
  }, [world]);

  // Memoize components without metadata calculation
  // 记忆化没有元数据的组件计算
  const componentsWithoutMetadata = useMemo(() => {
    if (!selectedEntity) return [];
    
    const registry = getEditorComponentRegistry();
    return selectedEntity.getComponents()
      .filter((component: any) => {
        const componentType = component.constructor as ComponentType;
        const matchingRegistration = registry.getAll().find(reg => reg.componentType.name === componentType.name);
        return !matchingRegistration;
      })
      .map((component: any) => ({
        componentType: component.constructor as ComponentType,
        componentInstance: component
      }));
  }, [selectedEntity]);

  // Memoize event handlers to prevent unnecessary re-renders
  // 记忆化事件处理程序以防止不必要的重新渲染
  const handleEntityNameChange = useMemo(() => (name: string) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      storeActions.setEntityName(primarySelection, name);
    }
  }, [selectedEntity, primarySelection, storeActions]);

  const handleEntityActiveToggle = useMemo(() => () => {
    if (selectedEntity && typeof primarySelection === 'number') {
      storeActions.setEntityActive(primarySelection, !selectedEntity.active);
    }
  }, [selectedEntity, primarySelection, storeActions]);

  const handleComponentToggle = useMemo(() => (_componentType: ComponentType) => {
    // Component toggle not yet implemented
  }, []);

  const handleComponentRemove = useMemo(() => (componentType: ComponentType) => {
    if (selectedEntity && typeof primarySelection === 'number' && canRemoveComponent(componentType)) {
      storeActions.removeComponent(primarySelection, componentType.name);
    }
  }, [selectedEntity, primarySelection, storeActions]);

  const handlePropertyChange = useMemo(() => (componentType: ComponentType, property: string, value: any) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      const component = selectedEntity.getComponent(componentType);
      if (component && property in component) {
        const oldValue = (component as any)[property];
        (component as any)[property] = value;
        
        // For TransformComponent, also update PhysicsTransformComponent if it exists
        if (componentType.name === 'TransformComponent') {
          const physicsTransform = selectedEntity.getComponent(PhysicsTransformComponent);
          if (physicsTransform && property in physicsTransform) {
            if (property === 'position' && value && typeof value === 'object') {
              (physicsTransform as any)[property] = {
                x: value.x || 0,
                y: value.y || 0
              };
            } else {
              (physicsTransform as any)[property] = value;
            }
          }
        }
        
        // Emit the event directly
        world?.editorEvents.emit('propertyChanged', {
          entityId: primarySelection,
          componentType: componentType.name,
          property,
          oldValue,
          newValue: value
        });
      }
    }
  }, [selectedEntity, primarySelection, world]);

  const handleAddComponent = useMemo(() => (componentTypeName: string) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      storeActions.addComponent(primarySelection, componentTypeName);
    }
  }, [selectedEntity, primarySelection, storeActions]);

  // Get entity name (for now, use a simple pattern)
  // 获取实体名称（目前使用简单模式）
  const entityName = `Entity_${selectedEntity?.id || 'Unknown'}`;

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
      {!selectedEntity ? (
        <Empty
          description="Select an entity to inspect 选择一个实体进行检查"
          style={{ 
            marginTop: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      ) : (
        <>
          {/* Entity Header - 实体头部 */}
          <Card
            size="small"
            style={{
              marginBottom: '16px',
              backgroundColor: '#1a1a1a',
              borderColor: '#303030'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Switch
                size="small"
                checked={selectedEntity.active}
                onChange={handleEntityActiveToggle}
              />
              <Input
                value={entityName}
                onChange={(e) => handleEntityNameChange(e.target.value)}
                style={{ flex: 1 }}
                size="small"
              />
              <Tag color={selectedEntity.active ? 'green' : 'red'}>
                {selectedEntity.active ? 'Active 激活' : 'Inactive 非激活'}
              </Tag>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {selectedEntity.id} | Components 组件: {entityComponents.length + componentsWithoutMetadata.length}
            </div>
          </Card>

          {/* Add Component - 添加组件 */}
          <ComponentSelector
            onAddComponent={handleAddComponent}
            existingComponents={entityComponents.map(comp => comp.componentType.name)}
            style={{ marginBottom: '16px' }}
          />

          {/* Components with Metadata - 有元数据的组件 */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              color: '#ffffff', 
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Components 组件 ({entityComponents.length + componentsWithoutMetadata.length})
            </h4>
            
            {entityComponents.map(({ componentType, componentInstance, registration }) => (
              <ComponentEditor
                key={componentType.name}
                componentType={componentType}
                componentInstance={componentInstance}
                registration={registration}
                onToggle={() => handleComponentToggle(componentType)}
                onRemove={() => handleComponentRemove(componentType)}
                onPropertyChange={(property, value) => 
                  handlePropertyChange(componentType, property, value)
                }
              />
            ))}

            {/* Components without metadata (fallback) - 没有元数据的组件（后备） */}
            {componentsWithoutMetadata.map(({ componentType }: any) => (
              <Card
                key={componentType.name}
                size="small"
                style={{
                  marginBottom: '8px',
                  backgroundColor: '#1f1f1f',
                  borderColor: '#303030'
                }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📦</span>
                    <span style={{ color: '#ffffff' }}>
                      {componentType.name}
                    </span>
                    <Tag color="orange" style={{ fontSize: '11px' }}>
                      No Metadata
                    </Tag>
                  </div>
                }
                extra={
                  <Space size="small">
                    <Tooltip title="Remove Component">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleComponentRemove(componentType)}
                      />
                    </Tooltip>
                  </Space>
                }
              >
                <div style={{ color: '#a0a0a0', fontSize: '12px' }}>
                  Component has no editor metadata registered 组件没有注册编辑器元数据
                </div>
              </Card>
            ))}
          </div>

          {/* Multi-selection info - 多选信息 */}
          {selectedEntities.length > 1 && (
            <Card
              size="small"
              style={{
                marginTop: '16px',
                backgroundColor: '#2a2a2a',
                borderColor: '#404040'
              }}
            >
              <div style={{ textAlign: 'center', color: '#a0a0a0' }}>
                {selectedEntities.length} entities selected 已选中{selectedEntities.length}个实体
                <br />
                <small>Showing primary selection 显示主选中: {entityName}</small>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};