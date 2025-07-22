/**
 * Command Manager for handling undo/redo operations
 * 处理撤销/重做操作的命令管理器
 */

import type { Command, CommandResult } from './Command';

/**
 * Command manager configuration
 * 命令管理器配置
 */
export interface CommandManagerConfig {
  /** Maximum number of commands to keep in history */
  maxHistorySize: number;
  /** Whether to automatically merge similar commands */
  autoMerge: boolean;
  /** Time window for auto-merging commands (ms) */
  mergeTimeWindow: number;
}

/**
 * Command manager events
 * 命令管理器事件
 */
export interface CommandManagerEvents {
  commandExecuted: (command: Command) => void;
  commandUndone: (command: Command) => void;
  commandRedone: (command: Command) => void;
  historyChanged: (canUndo: boolean, canRedo: boolean) => void;
  error: (error: Error) => void;
}

/**
 * Command Manager class
 * 命令管理器类
 */
export class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private config: CommandManagerConfig;
  private listeners: Partial<CommandManagerEvents> = {};

  constructor(config: Partial<CommandManagerConfig> = {}) {
    this.config = {
      maxHistorySize: 50,
      autoMerge: true,
      mergeTimeWindow: 1000,
      ...config
    };
  }

  /**
   * Execute a command and add it to history
   * 执行命令并添加到历史记录
   */
  async executeCommand(command: Command): Promise<CommandResult> {
    try {
      // Execute the command
      await command.execute();

      // Try to merge with the last command if auto-merge is enabled
      if (this.config.autoMerge && this.canMergeWithLast(command)) {
        const lastCommand = this.history[this.currentIndex];
        const mergedCommand = lastCommand.merge!(command);
        this.history[this.currentIndex] = mergedCommand;
      } else {
        // Remove any commands after current index (when redoing after undo)
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Add new command to history
        this.history.push(command);
        this.currentIndex++;
        
        // Limit history size
        if (this.history.length > this.config.maxHistorySize) {
          this.history.shift();
          this.currentIndex--;
        }
      }

      this.listeners.commandExecuted?.(command);
      this.notifyHistoryChanged();

      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.listeners.error?.(err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Undo the last command
   * 撤销上一个命令
   */
  async undo(): Promise<CommandResult> {
    if (!this.canUndo()) {
      return { success: false, error: 'Nothing to undo' };
    }

    try {
      const command = this.history[this.currentIndex];
      await command.undo();
      this.currentIndex--;

      this.listeners.commandUndone?.(command);
      this.notifyHistoryChanged();

      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.listeners.error?.(err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Redo the next command
   * 重做下一个命令
   */
  async redo(): Promise<CommandResult> {
    if (!this.canRedo()) {
      return { success: false, error: 'Nothing to redo' };
    }

    try {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      await command.execute();

      this.listeners.commandRedone?.(command);
      this.notifyHistoryChanged();

      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.listeners.error?.(err);
      
      // Revert index on error
      this.currentIndex--;
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if undo is possible
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the command that would be undone
   * 获取将被撤销的命令
   */
  getUndoCommand(): Command | null {
    return this.canUndo() ? this.history[this.currentIndex] : null;
  }

  /**
   * Get the command that would be redone
   * 获取将被重做的命令
   */
  getRedoCommand(): Command | null {
    return this.canRedo() ? this.history[this.currentIndex + 1] : null;
  }

  /**
   * Clear command history
   * 清空命令历史
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyHistoryChanged();
  }

  /**
   * Get command history info
   * 获取命令历史信息
   */
  getHistoryInfo() {
    return {
      totalCommands: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCommand: this.getUndoCommand()?.name,
      redoCommand: this.getRedoCommand()?.name
    };
  }

  /**
   * Add event listener
   * 添加事件监听器
   */
  on<K extends keyof CommandManagerEvents>(
    event: K, 
    listener: CommandManagerEvents[K]
  ): void {
    this.listeners[event] = listener;
  }

  /**
   * Remove event listener
   * 移除事件监听器
   */
  off<K extends keyof CommandManagerEvents>(event: K): void {
    delete this.listeners[event];
  }

  private canMergeWithLast(command: Command): boolean {
    if (this.currentIndex < 0) return false;
    
    const lastCommand = this.history[this.currentIndex];
    if (!lastCommand.canMerge(command)) return false;
    
    const timeDiff = command.timestamp - lastCommand.timestamp;
    return timeDiff <= this.config.mergeTimeWindow;
  }

  private notifyHistoryChanged(): void {
    this.listeners.historyChanged?.(this.canUndo(), this.canRedo());
  }
}