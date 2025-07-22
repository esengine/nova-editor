/**
 * Inspector Panel - Entity and component property editor
 * 检查器面板 - 实体和组件属性编辑器
 */

import React, { useState, useEffect } from 'react';
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
  Tag
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { 
  EditorMetadataComponent, 
  TransformComponent, 
  MeshRendererComponent, 
  BoxColliderComponent,
  SphereColliderComponent,
  RigidBodyComponent
} from '../../../ecs';
import type { EntityId } from '@esengine/nova-ecs';

const { Option } = Select;

/**
 * Mock entity data structure
 * 模拟实体数据结构
 */
interface MockEntity {
  id: string;
  name: string;
  active: boolean;
  components: MockComponent[];
}

interface MockComponent {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  properties: Record<string, any>;
}

/**
 * Mock entity database
 * 模拟实体数据库
 */
// Mock data removed - now using real NovaECS entities

/**
 * Property editor components
 * 属性编辑器组件
 */
const Vector3Editor: React.FC<{
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (value: { x: number; y: number; z: number }) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
      {label}
    </div>
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        size="small"
        placeholder="X"
        value={value.x}
        onChange={(x) => onChange({ ...value, x: x || 0 })}
        step={0.1}
        precision={2}
        style={{ width: '33.33%' }}
      />
      <InputNumber
        size="small"
        placeholder="Y"
        value={value.y}
        onChange={(y) => onChange({ ...value, y: y || 0 })}
        step={0.1}
        precision={2}
        style={{ width: '33.33%' }}
      />
      <InputNumber
        size="small"
        placeholder="Z"
        value={value.z}
        onChange={(z) => onChange({ ...value, z: z || 0 })}
        step={0.1}
        precision={2}
        style={{ width: '33.33%' }}
      />
    </Space.Compact>
  </div>
);

const PropertyEditor: React.FC<{
  property: string;
  value: any;
  onChange: (value: any) => void;
}> = ({ property, value, onChange }) => {
  // Vector3 properties
  if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value) {
    return (
      <Vector3Editor
        label={property}
        value={value}
        onChange={onChange}
      />
    );
  }
  
  // Boolean properties
  if (typeof value === 'boolean') {
    return (
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{property}</span>
        <Switch size="small" checked={value} onChange={onChange} />
      </div>
    );
  }
  
  // Number properties
  if (typeof value === 'number') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
          {property}
        </div>
        <InputNumber
          size="small"
          value={value}
          onChange={onChange}
          step={0.1}
          precision={2}
          style={{ width: '100%' }}
        />
      </div>
    );
  }
  
  // String properties
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#a0a0a0' }}>
        {property}
      </div>
      <Input
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

/**
 * Component editor
 * 组件编辑器
 */
const ComponentEditor: React.FC<{
  component: MockComponent;
  onToggle: () => void;
  onRemove: () => void;
  onPropertyChange: (property: string, value: any) => void;
}> = ({ component, onToggle, onRemove, onPropertyChange }) => {
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'Transform': return '🔧';
      case 'MeshRenderer': return '🎨';
      case 'BoxCollider': return '📦';
      case 'AIController': return '🤖';
      default: return '⚙️';
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: '8px',
        backgroundColor: component.enabled ? '#1f1f1f' : '#2a2a2a',
        borderColor: component.enabled ? '#303030' : '#404040'
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{getComponentIcon(component.type)}</span>
          <span style={{ color: component.enabled ? '#ffffff' : '#666666' }}>
            {component.name}
          </span>
          <Tag color={component.enabled ? 'green' : 'default'} style={{ fontSize: '11px' }}>
            {component.type}
          </Tag>
        </div>
      }
      extra={
        <Space size="small">
          <Tooltip title={component.enabled ? 'Disable' : 'Enable'}>
            <Button
              type="text"
              size="small"
              icon={component.enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={onToggle}
            />
          </Tooltip>
          <Tooltip title="Component Settings">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
            />
          </Tooltip>
          <Tooltip title="Remove Component">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={onRemove}
              disabled={component.type === 'Transform'} // Can't remove Transform
            />
          </Tooltip>
        </Space>
      }
    >
      {component.enabled && (
        <div style={{ padding: '8px 0' }}>
          {Object.entries(component.properties).map(([property, value]) => (
            <PropertyEditor
              key={property}
              property={property}
              value={value}
              onChange={(newValue) => onPropertyChange(property, newValue)}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

/**
 * Entity header component
 * 实体标题组件
 */
const EntityHeader: React.FC<{
  entity: MockEntity;
  onNameChange: (name: string) => void;
  onActiveToggle: () => void;
}> = ({ entity, onNameChange, onActiveToggle }) => (
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
        checked={entity.active}
        onChange={onActiveToggle}
      />
      <Input
        value={entity.name}
        onChange={(e) => onNameChange(e.target.value)}
        style={{ flex: 1 }}
        size="small"
      />
      <Tag color={entity.active ? 'green' : 'red'}>
        {entity.active ? 'Active' : 'Inactive'}
      </Tag>
    </div>
    
    <div style={{ fontSize: '12px', color: '#666' }}>
      ID: {entity.id} | Components: {entity.components.length}
    </div>
  </Card>
);

/**
 * Add component selector
 * 添加组件选择器
 */
const AddComponentSelector: React.FC<{
  onAddComponent: (componentType: string) => void;
}> = ({ onAddComponent }) => {
  const [selectedType, setSelectedType] = useState<string>('');
  
  const availableComponents = [
    'MeshRenderer',
    'BoxCollider',
    'SphereCollider',
    'RigidBody',
    'AIController',
    'AudioSource',
    'Light',
    'Camera'
  ];

  return (
    <Card
      size="small"
      style={{
        marginBottom: '16px',
        backgroundColor: '#1a1a1a',
        borderColor: '#303030'
      }}
      title="Add Component"
    >
      <Space.Compact style={{ width: '100%' }}>
        <Select
          placeholder="Select component type"
          value={selectedType}
          onChange={setSelectedType}
          style={{ flex: 1 }}
          size="small"
        >
          {availableComponents.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          disabled={!selectedType}
          onClick={() => {
            if (selectedType) {
              onAddComponent(selectedType);
              setSelectedType('');
            }
          }}
        >
          Add
        </Button>
      </Space.Compact>
    </Card>
  );
};

/**
 * Main InspectorPanel component
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
  const world = useEditorStore(state => state.world.instance);
  const setEntityName = useEditorStore(state => state.setEntityName);
  const setEntityActive = useEditorStore(state => state.setEntityActive);
  const addComponent = useEditorStore(state => state.addComponent);
  const removeComponent = useEditorStore(state => state.removeComponent);
  const updateComponentProperty = useEditorStore(state => state.updateComponentProperty);
  // Subscribe to force update trigger to refresh when components change
  const forceUpdateTrigger = useEditorStore(state => state.forceUpdateTrigger);

  // Force re-render when components change
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [forceUpdateTrigger]);

  // Get the primary selected entity from NovaECS world
  const selectedEntity = primarySelection && typeof primarySelection === 'number' && world
    ? world.getEntity(primarySelection as EntityId)
    : null;
    
  // Get entity metadata for display
  const entityMetadata = selectedEntity ? selectedEntity.getComponent(EditorMetadataComponent) : null;
  const entityTransform = selectedEntity ? selectedEntity.getComponent(TransformComponent) : null;
  
  // Create mock entity structure for UI compatibility
  const mockEntity = selectedEntity ? {
    id: selectedEntity.id.toString(),
    name: entityMetadata?.name || `Entity_${selectedEntity.id}`,
    active: selectedEntity.active,
    components: [
      {
        id: 'transform',
        type: 'Transform',
        name: 'Transform',
        enabled: true,
        properties: entityTransform ? {
          position: entityTransform.position,
          rotation: entityTransform.rotation,
          scale: entityTransform.scale
        } : { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
      },
      // Add other components as needed
      ...(selectedEntity.getComponent(MeshRendererComponent) ? [{
        id: 'renderer',
        type: 'MeshRenderer',
        name: 'Mesh Renderer',
        enabled: true,
        properties: {
          material: selectedEntity.getComponent(MeshRendererComponent)!.material,
          castShadows: selectedEntity.getComponent(MeshRendererComponent)!.castShadows,
          receiveShadows: selectedEntity.getComponent(MeshRendererComponent)!.receiveShadows
        }
      }] : []),
      ...(selectedEntity.getComponent(BoxColliderComponent) ? [{
        id: 'collider',
        type: 'BoxCollider',
        name: 'Box Collider',
        enabled: true,
        properties: {
          size: selectedEntity.getComponent(BoxColliderComponent)!.size,
          center: selectedEntity.getComponent(BoxColliderComponent)!.center,
          isTrigger: selectedEntity.getComponent(BoxColliderComponent)!.isTrigger
        }
      }] : []),
      // Add other component types
      ...(selectedEntity.getComponent(SphereColliderComponent) ? [{
        id: 'spherecollider',
        type: 'SphereCollider',
        name: 'Sphere Collider',
        enabled: true,
        properties: {
          radius: selectedEntity.getComponent(SphereColliderComponent)!.radius,
          center: selectedEntity.getComponent(SphereColliderComponent)!.center,
          isTrigger: selectedEntity.getComponent(SphereColliderComponent)!.isTrigger
        }
      }] : []),
      ...(selectedEntity.getComponent(RigidBodyComponent) ? [{
        id: 'rigidbody',
        type: 'RigidBody',
        name: 'Rigid Body',
        enabled: true,
        properties: {
          mass: selectedEntity.getComponent(RigidBodyComponent)!.mass,
          drag: selectedEntity.getComponent(RigidBodyComponent)!.drag,
          angularDrag: selectedEntity.getComponent(RigidBodyComponent)!.angularDrag,
          useGravity: selectedEntity.getComponent(RigidBodyComponent)!.useGravity
        }
      }] : [])
    ]
  } : null;

  // Real update handlers that work with NovaECS world
  const handleEntityNameChange = (name: string) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      setEntityName(primarySelection, name);
    }
  };

  const handleEntityActiveToggle = () => {
    if (selectedEntity && typeof primarySelection === 'number') {
      setEntityActive(primarySelection, !selectedEntity.active);
    }
  };

  const handleComponentToggle = (componentId: string) => {
    // Component enable/disable would need to be implemented in the ECS integration
    // For now, we'll just show a message
    console.log('Component toggle not yet implemented:', componentId);
  };

  const handleComponentRemove = (componentId: string) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      // Map component ID to type
      const componentTypeMap: Record<string, string> = {
        'renderer': 'MeshRenderer',
        'collider': 'BoxCollider',
        'transform': 'Transform' // Transform cannot be removed
      };
      
      const componentType = componentTypeMap[componentId];
      if (componentType && componentType !== 'Transform') {
        removeComponent(primarySelection, componentType);
      }
    }
  };

  const handlePropertyChange = (componentId: string, property: string, value: any) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      // Map component ID to type
      const componentTypeMap: Record<string, string> = {
        'transform': 'Transform',
        'renderer': 'MeshRenderer',
        'collider': 'BoxCollider'
      };
      
      const componentType = componentTypeMap[componentId];
      if (componentType) {
        updateComponentProperty(primarySelection, componentType, property, value);
      }
    }
  };

  const handleAddComponent = (componentType: string) => {
    if (selectedEntity && typeof primarySelection === 'number') {
      addComponent(primarySelection, componentType);
    }
  };

  // Get default properties for component types
  // Default properties now handled by component constructors

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
      {!mockEntity ? (
        <Empty
          description="Select an entity to inspect"
          style={{ 
            marginTop: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      ) : (
        <>
          {/* Entity Header */}
          <EntityHeader
            entity={mockEntity}
            onNameChange={handleEntityNameChange}
            onActiveToggle={handleEntityActiveToggle}
          />

          {/* Add Component */}
          <AddComponentSelector onAddComponent={handleAddComponent} />

          {/* Components */}
          <div>
            <h4 style={{ 
              color: '#ffffff', 
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Components ({mockEntity.components.length})
            </h4>
            
            {mockEntity.components.map((component) => (
              <ComponentEditor
                key={component.id}
                component={component}
                onToggle={() => handleComponentToggle(component.id)}
                onRemove={() => handleComponentRemove(component.id)}
                onPropertyChange={(property, value) => 
                  handlePropertyChange(component.id, property, value)
                }
              />
            ))}
          </div>

          {/* Multi-selection info */}
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
                {selectedEntities.length} entities selected
                <br />
                <small>Showing primary selection: {mockEntity.name}</small>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};