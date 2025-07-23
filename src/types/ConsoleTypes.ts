/**
 * Console-related type definitions
 * 控制台相关类型定义
 */

/**
 * Log level enumeration
 * 日志级别枚举
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'success';

/**
 * Log level colors for UI
 * UI的日志级别颜色
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#888888',
  info: '#2196F3',
  warning: '#FF9800',
  error: '#F44336',
  success: '#4CAF50'
};

/**
 * Log level icons
 * 日志级别图标
 */
export const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🐛',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅'
};

/**
 * Log entry interface
 * 日志条目接口
 */
export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  data?: any;
  source?: string;
  count?: number;
}

/**
 * Console command interface
 * 控制台命令接口
 */
export interface ConsoleCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<any>;
  validate?: (args: string[]) => boolean;
  autocomplete?: (partial: string) => string[];
}

/**
 * Performance metrics interface
 * 性能指标接口
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  entityCount: number;
  systemCount: number;
  componentCount: number;
  renderCalls: number;
}

/**
 * Console filter options
 * 控制台过滤选项
 */
export interface ConsoleFilterOptions {
  levels: LogLevel[];
  searchQuery: string;
  showStackTraces: boolean;
  showTimestamps: boolean;
}

/**
 * Console theme configuration
 * 控制台主题配置
 */
export interface ConsoleTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  scrollbarColor: string;
}

/**
 * Command history entry
 * 命令历史条目
 */
export interface CommandHistoryEntry {
  command: string;
  timestamp: number;
  result?: any;
  error?: string;
}

/**
 * Console state interface
 * 控制台状态接口
 */
export interface ConsoleState {
  logs: LogEntry[];
  commandHistory: CommandHistoryEntry[];
  filters: ConsoleFilterOptions;
  isMinimized: boolean;
  height: number;
}

/**
 * Console preferences
 * 控制台偏好设置
 */
export interface ConsolePreferences {
  maxLogs: number;
  maxHistorySize: number;
  fontSize: number;
  fontFamily: string;
  enableAutocomplete: boolean;
  enableSyntaxHighlighting: boolean;
  preserveLogOnReload: boolean;
}