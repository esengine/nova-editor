/**
 * Main Editor Toolbar with undo/redo and other global actions
 * 主编辑器工具栏，包含撤销/重做和其他全局操作
 */

import React from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileAddOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { FileSystemService } from '../../services/FileSystemService';

export interface EditorToolbarProps {
  style?: React.CSSProperties;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  style,
  className
}) => {
  const canUndo = useEditorStore(state => state.canUndo);
  const canRedo = useEditorStore(state => state.canRedo);
  const commandManager = useEditorStore(state => state.commandManager);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const createEntity = useEditorStore(state => state.createEntity);
  const selectedEntities = useEditorStore(state => state.selection.selectedEntities);
  const removeEntity = useEditorStore(state => state.removeEntity);
  const theme = useEditorStore(state => state.theme);
  
  const fileSystemService = FileSystemService.getInstance();

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleCreateEntity = () => {
    createEntity();
  };

  const handleDeleteSelected = () => {
    selectedEntities.forEach(entityId => {
      removeEntity(entityId);
    });
  };

  const handleNewProject = async () => {
    try {
      const projectName = prompt('Enter project name:') || 'New Project';
      const project = await fileSystemService.createNewProject(projectName);
      console.log('Created new project:', project);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleOpenProject = async () => {
    try {
      const project = await fileSystemService.openProject();
      console.log('Opened project:', project);
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const handleSaveProject = async () => {
    try {
      await fileSystemService.saveAllFiles();
      console.log('Saved all files');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
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
        gap: '8px',
        ...style
      }}
      className={className}
    >
      {/* File Operations */}
      <Space size="small">
        <Tooltip title="New Project">
          <Button
            icon={<FileAddOutlined />}
            size="small"
            onClick={handleNewProject}
          />
        </Tooltip>
        
        <Tooltip title="Open Project">
          <Button
            icon={<FolderOpenOutlined />}
            size="small"
            onClick={handleOpenProject}
          />
        </Tooltip>
        
        <Tooltip title="Save Project">
          <Button
            icon={<SaveOutlined />}
            size="small"
            onClick={handleSaveProject}
          />
        </Tooltip>
      </Space>

      <Divider type="vertical" />

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

      <Divider type="vertical" />

      {/* Playback Controls */}
      <Space size="small">
        <Tooltip title="Play">
          <Button
            icon={<PlayCircleOutlined />}
            size="small"
            type="primary"
          />
        </Tooltip>
        
        <Tooltip title="Pause">
          <Button
            icon={<PauseCircleOutlined />}
            size="small"
          />
        </Tooltip>
      </Space>

      {/* Command History Info */}
      <div style={{ marginLeft: 'auto', fontSize: '12px', color: theme.colors.textSecondary }}>
        History: {commandManager.getHistoryInfo().totalCommands} commands
      </div>
    </div>
  );
};