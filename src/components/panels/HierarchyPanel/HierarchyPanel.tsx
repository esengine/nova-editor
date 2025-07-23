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
  App,
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
import styles from './HierarchyPanel.module.css';

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
  const { message, modal } = App.useApp();
  
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

  // Local state | 本地状态
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['root']);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);

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
  const handleCreateEntity = async (): Promise<void> => {
    if (newEntityName.trim() && !isCreatingEntity) {
      setIsCreatingEntity(true);
      try {
        await createEntity(newEntityName);
        message.success(`Created entity: ${newEntityName}`);
        setNewEntityName('');
        setIsCreateModalVisible(false);
        
        dispatchEvent(EditorEventType.SceneChanged, { 
          action: 'create', 
          entityName: newEntityName 
        });
      } catch (error) {
        console.error('Failed to create entity:', error);
        message.error('Failed to create entity');
      } finally {
        setIsCreatingEntity(false);
      }
    }
  };

  // Handle entity deletion | 处理实体删除
  const handleDeleteEntity = (): void => {
    if (selectedEntities.length > 0) {
      modal.confirm({
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
    
    return (
      <div className={styles.entityTitle}>
        <span className={styles.entityName}>{node.title}</span>
        <div className={styles.entityActions}>
          <Tooltip title={node.isVisible ? 'Hide' : 'Show'}>
            <Button
              type="text"
              size="small"
              icon={node.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              className={styles.visibilityButton}
              onClick={(e) => {
                e.stopPropagation();
                if (!isNaN(entityId)) {
                  handleToggleVisibility(entityId, !node.isVisible);
                  message.info(`${node.isVisible ? 'Hidden' : 'Shown'} ${node.title}`);
                }
              }}
            />
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`${styles.hierarchyPanel} ${className || ''}`}
      style={style}
    >
      {/* Header with controls | 带控件的头部 */}
      <div className={styles.header}>
        <div className={styles.controls}>
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
          className={styles.searchBox}
          allowClear
        />
      </div>

      {/* Entity tree | 实体树 */}
      <div className={styles.treeContainer} data-scrollable="hierarchy">
        <Tree
          treeData={filteredEntities}
          selectedKeys={selectedEntities.map(id => id.toString())}
          expandedKeys={expandedKeys}
          onSelect={handleSelect}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          titleRender={renderTitle}
          showLine={{ showLeafIcon: false }}
          blockNode
          className={styles.entityTree}
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
        confirmLoading={isCreatingEntity}
        okButtonProps={{ disabled: !newEntityName.trim() || isCreatingEntity }}
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
