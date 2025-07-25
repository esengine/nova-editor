/**
 * Component Selector with modern dropdown design
 * 现代下拉式组件选择器
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Button, 
  Input,
  Tag,
  Dropdown
} from 'antd';
import {
  PlusOutlined
} from '@ant-design/icons';
import { componentRegistry, ComponentCategory, type ComponentMetadata } from '../../../core/ComponentRegistry';

const { Search } = Input;

interface ComponentSelectorProps {
  onAddComponent: (componentName: string) => void;
  existingComponents: string[];
  style?: React.CSSProperties;
}

/**
 * Quick component item for dropdown menu
 * 下拉菜单的快速组件项
 */
const QuickComponentItem: React.FC<{
  component: ComponentMetadata;
  onAdd: (name: string) => void;
  canAdd: boolean;
  reason?: string | undefined;
}> = ({ component, onAdd, canAdd, reason }) => {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        cursor: canAdd ? 'pointer' : 'not-allowed',
        opacity: canAdd ? 1 : 0.5,
        minWidth: '200px'
      }}
      onClick={canAdd ? () => onAdd(component.name) : undefined}
    >
      <span style={{ fontSize: '14px', marginRight: '8px' }}>{component.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 500,
          color: canAdd ? '#ffffff' : '#999'
        }}>
          {component.displayName}
        </div>
        {!canAdd && reason && (
          <div style={{ fontSize: '11px', color: '#ff4d4f' }}>
            {reason}
          </div>
        )}
      </div>
      {component.isCore && (
        <Tag color="blue" style={{ fontSize: '10px' }}>CORE</Tag>
      )}
    </div>
  );
};


/**
 * Main Component Selector - Compact dropdown design
 * 紧凑的下拉式组件选择器
 */
export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  onAddComponent,
  existingComponents,
  style
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filteredComponents, setFilteredComponents] = useState<ComponentMetadata[]>([]);

  // Get all available components
  const allComponents = useMemo(() => {
    return componentRegistry.getAll();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let filtered = allComponents;
    
    if (searchTerm.trim()) {
      filtered = allComponents.filter(comp =>
        comp.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by category, then by name
    filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.displayName.localeCompare(b.displayName);
    });
    
    setFilteredComponents(filtered);
  }, [searchTerm, allComponents]);

  // Group components by category for dropdown
  const groupedComponents = useMemo(() => {
    const groups = new Map<ComponentCategory, ComponentMetadata[]>();
    
    filteredComponents.forEach(comp => {
      if (!groups.has(comp.category)) {
        groups.set(comp.category, []);
      }
      groups.get(comp.category)!.push(comp);
    });
    
    return groups;
  }, [filteredComponents]);

  // Create dropdown menu items
  const menuItems = useMemo(() => {
    const items: any[] = [];
    
    if (searchTerm.trim()) {
      // Show flat list when searching
      filteredComponents.forEach(component => {
        const canAddResult = componentRegistry.canAddComponent(component.name, existingComponents);
        items.push({
          key: component.name,
          label: (
            <QuickComponentItem
              component={component}
              onAdd={onAddComponent}
              canAdd={canAddResult.canAdd}
              reason={canAddResult.reason}
            />
          ),
          disabled: !canAddResult.canAdd
        });
      });
    } else {
      // Show categorized list
      Array.from(groupedComponents.entries()).forEach(([category, components]) => {
        const categoryIcon = getCategoryIcon(category);
        
        // Add category header
        items.push({
          key: `category-${category}`,
          label: (
            <div style={{ 
              padding: '4px 0', 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: '#888',
              borderBottom: '1px solid #333'
            }}>
              {categoryIcon} {category}
            </div>
          ),
          disabled: true
        });
        
        // Add components in this category
        components.forEach(component => {
          const canAddResult = componentRegistry.canAddComponent(component.name, existingComponents);
          items.push({
            key: component.name,
            label: (
              <QuickComponentItem
                component={component}
                onAdd={onAddComponent}
                canAdd={canAddResult.canAdd}
                reason={canAddResult.reason}
              />
            ),
            disabled: !canAddResult.canAdd
          });
        });
      });
    }
    
    return items;
  }, [groupedComponents, searchTerm, existingComponents, onAddComponent]);

  const handleMenuClick = () => {
    setDropdownOpen(false);
  };

  return (
    <div style={style}>
      <Dropdown
        menu={{ 
          items: menuItems,
          onClick: handleMenuClick,
          style: { 
            maxHeight: '400px', 
            overflowY: 'auto',
            backgroundColor: '#1a1a1a',
            border: '1px solid #434343'
          }
        }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        placement="bottomLeft"
        popupRender={(menu) => (
          <div style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #434343' }}>
            <div style={{ padding: '8px' }}>
              <Search
                placeholder="Search components..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '280px' }}
                allowClear
              />
            </div>
            {menu}
          </div>
        )}
      >
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          style={{ 
            width: '100%',
            height: '32px',
            borderColor: '#434343',
            color: '#fff'
          }}
        >
          Add Component
        </Button>
      </Dropdown>
    </div>
  );
};

// Helper function to get category icon
function getCategoryIcon(category: ComponentCategory): string {
  switch (category) {
    case ComponentCategory.CORE: return '⚙️';
    case ComponentCategory.TRANSFORM: return '🔧';
    case ComponentCategory.RENDERING: return '🎨';
    case ComponentCategory.MESH: return '📐';
    case ComponentCategory.MATERIALS: return '🎭';
    case ComponentCategory.LIGHTING: return '💡';
    case ComponentCategory.CAMERA: return '📷';
    case ComponentCategory.PHYSICS: return '🏃';
    case ComponentCategory.COLLISION: return '📦';
    case ComponentCategory.AUDIO: return '🔊';
    case ComponentCategory.ANIMATION: return '🎬';
    case ComponentCategory.UI: return '🖼️';
    case ComponentCategory.SCRIPTING: return '📜';
    case ComponentCategory.UTILITIES: return '🔧';
    case ComponentCategory.DEBUG: return '🐛';
    default: return '📁';
  }
}