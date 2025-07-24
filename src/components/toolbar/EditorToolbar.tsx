/**
 * Main Editor Toolbar with undo/redo and other global actions
 * 主编辑器工具栏，包含撤销/重做和其他全局操作
 */

import React, { useState } from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileAddOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';

export interface EditorToolbarProps {
  style?: React.CSSProperties;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  style,
  className
}) => {
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);
  const canUndo = useEditorStore(state => state.canUndo);
  const canRedo = useEditorStore(state => state.canRedo);
  const commandManager = useEditorStore(state => state.commandManager);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const createEntity = useEditorStore(state => state.createEntity);
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const removeEntity = useEditorStore(state => state.removeEntity);
  const theme = useEditorStore(state => state.theme);

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleCreateEntity = async () => {
    if (!isCreatingEntity) {
      setIsCreatingEntity(true);
      try {
        await createEntity();
      } catch (error) {
        console.error('Failed to create entity:', error);
      } finally {
        setIsCreatingEntity(false);
      }
    }
  };

  const handleDeleteSelected = () => {
    selectedEntities.forEach(entityId => {
      removeEntity(entityId);
    });
  };


  const getUndoTooltip = () => {
    const undoCommand = commandManager.getUndoCommand();
    return undoCommand ? `Undo ${undoCommand.name}` : 'Nothing to undo';
  };

  const getRedoTooltip = () => {
    const redoCommand = commandManager.getRedoCommand();
    return redoCommand ? `Redo ${redoCommand.name}` : 'Nothing to redo';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        height: '44px',
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        ...style
      }}
      className={className}
    >
      {/* Left Side: Undo/Redo and Entity Operations */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Undo/Redo */}
        <Space size="small">
          <Tooltip title={getUndoTooltip()}>
            <Button
              icon={<UndoOutlined />}
              size="small"
              disabled={!canUndo}
              onClick={handleUndo}
            />
          </Tooltip>
          
          <Tooltip title={getRedoTooltip()}>
            <Button
              icon={<RedoOutlined />}
              size="small"
              disabled={!canRedo}
              onClick={handleRedo}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        {/* Entity Operations */}
        <Space size="small">
          <Tooltip title="Create Entity">
            <Button
              icon={<FileAddOutlined />}
              size="small"
              onClick={handleCreateEntity}
              disabled={isCreatingEntity}
              loading={isCreatingEntity}
            />
          </Tooltip>
          
          <Tooltip title={`Delete Selected (${selectedEntities.length} selected)`}>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              disabled={selectedEntities.length === 0}
              onClick={handleDeleteSelected}
              danger={selectedEntities.length > 0}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Center: Playback Controls - Most Important */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flex: 1,
        gap: '4px'
      }}>
        <Tooltip title="Play Game">
          <Button
            icon={<PlayCircleOutlined />}
            size="large"
            type="primary"
            style={{ 
              minWidth: '60px',
              height: '32px',
              fontSize: '16px'
            }}
          />
        </Tooltip>
        
        <Tooltip title="Pause Game">
          <Button
            icon={<PauseCircleOutlined />}
            size="large"
            style={{ 
              minWidth: '60px',
              height: '32px',
              fontSize: '16px'
            }}
          />
        </Tooltip>
      </div>

      {/* Right Side: Command History Info */}
      <div style={{ 
        fontSize: '12px', 
        color: theme.colors.textSecondary,
        minWidth: '140px',
        textAlign: 'right'
      }}>
        History: {commandManager.getHistoryInfo().totalCommands} commands
      </div>
    </div>
  );
};