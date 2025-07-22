/**
 * Hierarchy Panel Component
 * 层级面板组件 - 显示场景实体的树形结构
 */

import React, { useState, useMemo } from 'react';
import { 
  Tree, 
  Button, 
  Space, 
  Input, 
  Dropdown, 
  Modal,
  message,
  Tooltip
} from 'antd';

import {
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { EditorEventType } from '../../../types';
import type { EntityHierarchyNode } from '../../../ecs';
import './HierarchyPanel.module.css';

const { Search } = Input;

/**
 * Entity tree node interface
 * 实体树节点接口
 */
interface EntityTreeNode {
  key: string;
  title: string;
  children: EntityTreeNode[] | undefined;
  isVisible?: boolean;
  entityType?: string;
  icon?: React.ReactNode;
}

/**
 * HierarchyPanel component props
 * 层级面板组件属性
 */
export interface HierarchyPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HierarchyPanel component
 * 层级面板组件
 */
export const HierarchyPanel: React.FC<HierarchyPanelProps> = ({ 
  className, 
  style 
}) => {
  // State management | 状态管理
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const selectEntity = useEditorStore(state => state.selectEntity);
  const deselectEntity = useEditorStore(state => state.deselectEntity);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const createEntity = useEditorStore(state => state.createEntity);
  const removeEntity = useEditorStore(state => state.removeEntity);
  const setEntityActive = useEditorStore(state => state.setEntityActive);
  const entityHierarchy = useEditorStore(state => state.world.entityHierarchy);
  const dispatchEvent = useEditorStore(state => state.dispatchEvent);
  const theme = useEditorStore(state => state.theme);

  // Local state | 本地状态
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['root']);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');

  // Convert NovaECS entity hierarchy to tree nodes
  const entityTreeNodes: EntityTreeNode[] = useMemo(() => {
    const convertHierarchyToTreeNode = (node: EntityHierarchyNode): EntityTreeNode => {
      return {
        key: node.id.toString(),
        title: node.name,
        isVisible: node.active,
        entityType: 'entity',
        children: node.children.length > 0 
          ? node.children.map(convertHierarchyToTreeNode)
          : undefined
      };
    };

    if (entityHierarchy.length === 0) {
      return [{
        key: 'empty',
        title: 'No entities in scene',
        isVisible: true,
        entityType: 'placeholder',
        children: undefined
      }];
    }

    return entityHierarchy.map(convertHierarchyToTreeNode);
  }, [entityHierarchy]);

  // Filter entities based on search | 根据搜索过滤实体
  const filteredEntities = useMemo(() => {
    if (!searchValue) return entityTreeNodes;

    const filterNodes = (nodes: EntityTreeNode[]): EntityTreeNode[] => {
      return nodes.reduce((filtered: EntityTreeNode[], node) => {
        const matchesSearch = node.title.toLowerCase().includes(searchValue.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : (node.children || undefined)
          });
        }
        
        return filtered;
      }, []);
    };

    return filterNodes(entityTreeNodes);
  }, [entityTreeNodes, searchValue]);

  // Handle entity selection | 处理实体选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const key = selectedKeys[0] as string;
    const entityId = parseInt(key, 10);
    
    if (key && !isNaN(entityId) && entityId > 0) {
      if (info.nativeEvent?.ctrlKey || info.nativeEvent?.metaKey) {
        // Multi-select with Ctrl/Cmd | 使用Ctrl/Cmd多选
        if (selectedEntities.includes(entityId)) {
          deselectEntity(entityId);
        } else {
          selectEntity(entityId, true);
        }
      } else {
        // Single select | 单选
        selectEntity(entityId);
      }
      
      dispatchEvent(EditorEventType.EntitySelected, { entityId: entityId });
    }
  };

  // Handle entity creation | 处理实体创建
  const handleCreateEntity = (): void => {
    if (newEntityName.trim()) {
      createEntity(newEntityName);
      message.success(`Created entity: ${newEntityName}`);
      setNewEntityName('');
      setIsCreateModalVisible(false);
      
      dispatchEvent(EditorEventType.SceneChanged, { 
        action: 'create', 
        entityName: newEntityName 
      });
    }
  };

  // Handle entity deletion | 处理实体删除
  const handleDeleteEntity = (): void => {
    if (selectedEntities.length > 0) {
      Modal.confirm({
        title: 'Delete Entities',
        content: `Are you sure you want to delete ${selectedEntities.length} entity(ies)?`,
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: () => {
          // Delete entities from NovaECS world
          selectedEntities.forEach(entityId => {
            removeEntity(entityId);
          });
          
          message.success(`Deleted ${selectedEntities.length} entity(ies)`);
          clearSelection();
          
          dispatchEvent(EditorEventType.SceneChanged, { 
            action: 'delete', 
            entityIds: selectedEntities 
          });
        }
      });
    }
  };

  // Context menu items | 右键菜单项
  const contextMenuItems = [
    {
      key: 'create',
      label: 'Create Entity',
      icon: <PlusOutlined />,
      onClick: () => setIsCreateModalVisible(true)
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: <EditOutlined />,
      disabled: selectedEntities.length === 0
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: selectedEntities.length === 0,
      onClick: handleDeleteEntity
    }
  ];

  // Handle entity visibility toggle | 处理实体可见性切换
  const handleToggleVisibility = (entityId: number, visible: boolean): void => {
    setEntityActive(entityId, visible);
  };

  // Custom title renderer | 自定义标题渲染器
  const renderTitle = (node: EntityTreeNode): React.ReactNode => {
    const entityId = parseInt(node.key, 10);
    const isSelected = !isNaN(entityId) && selectedEntities.includes(entityId);
    
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: isSelected ? theme.colors.primary : theme.colors.text
        }}
      >
        <span>{node.title}</span>
        <Space size="small">
          <Tooltip title={node.isVisible ? 'Hide' : 'Show'}>
            <Button
              type="text"
              size="small"
              icon={node.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              style={{ 
                color: node.isVisible ? theme.colors.text : theme.colors.textSecondary 
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isNaN(entityId)) {
                  handleToggleVisibility(entityId, !node.isVisible);
                  message.info(`${node.isVisible ? 'Hidden' : 'Shown'} ${node.title}`);
                }
              }}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };

  return (
    <div 
      className={className}
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        ...style 
      }}
    >
      {/* Header with controls | 带控件的头部 */}
      <div 
        style={{ 
          padding: '8px 12px', 
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.background
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <Space>
            <Tooltip title="Create Entity">
              <Button 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Create
              </Button>
            </Tooltip>
            <Tooltip title="Delete Selected">
              <Button 
                size="small" 
                icon={<DeleteOutlined />}
                disabled={selectedEntities.length === 0}
                onClick={handleDeleteEntity}
              >
                Delete
              </Button>
            </Tooltip>
            <Dropdown menu={{ items: contextMenuItems }} trigger={['click']}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>
        
        <Search
          placeholder="Search entities..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: '100%' }}
          allowClear
        />
      </div>

      {/* Entity tree | 实体树 */}
      <div 
        style={{ 
          flex: 1, 
          padding: '8px',
          overflow: 'auto',
          background: theme.colors.surface
        }}
      >
        <Tree
          treeData={filteredEntities}
          selectedKeys={selectedEntities.map(id => id.toString())}
          expandedKeys={expandedKeys}
          onSelect={handleSelect}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          titleRender={renderTitle}
          showLine={{ showLeafIcon: false }}
          blockNode
          style={{ 
            background: 'transparent',
            color: theme.colors.text
          }}
        />
      </div>

      {/* Create Entity Modal | 创建实体模态框 */}
      <Modal
        title="Create New Entity"
        open={isCreateModalVisible}
        onOk={handleCreateEntity}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setNewEntityName('');
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter entity name..."
          value={newEntityName}
          onChange={(e) => setNewEntityName(e.target.value)}
          onPressEnter={handleCreateEntity}
          autoFocus
        />
      </Modal>
    </div>
  );
};
