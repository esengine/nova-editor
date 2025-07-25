/**
 * Console service for managing logs, commands, and performance metrics
 * 控制台服务，用于管理日志、命令和性能指标
 */

import type { LogEntry, ConsoleCommand, PerformanceMetrics, LogLevel } from '../types/ConsoleTypes';

export class ConsoleService {
  private static instance: ConsoleService;
  
  private logs: LogEntry[] = [];
  private commands: Map<string, ConsoleCommand> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    entityCount: 0,
    systemCount: 0,
    componentCount: 0,
    renderCalls: 0
  };
  
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private metricsListeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private maxLogs = 1000;
  
  // Store original console methods
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  private constructor() {
    this.hijackConsole();
    this.startPerformanceMonitoring();
  }

  static getInstance(): ConsoleService {
    if (!ConsoleService.instance) {
      ConsoleService.instance = new ConsoleService();
    }
    return ConsoleService.instance;
  }

  /**
   * Hijack console methods to capture logs
   * 劫持控制台方法以捕获日志
   */
  private hijackConsole() {
    console.log = (...args: any[]) => {
      this.addLog('info', this.formatArgs(args));
      this.originalConsole.log(...args);
    };

    console.info = (...args: any[]) => {
      this.addLog('info', this.formatArgs(args));
      this.originalConsole.info(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warning', this.formatArgs(args));
      this.originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      this.addLog('error', this.formatArgs(args), this.extractStackTrace());
      this.originalConsole.error(...args);
    };

    console.debug = (...args: any[]) => {
      this.addLog('debug', this.formatArgs(args));
      this.originalConsole.debug(...args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.addLog('error', `Unhandled error: ${event.message}`, event.error?.stack);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', `Unhandled promise rejection: ${event.reason}`, event.reason?.stack);
    });
  }

  /**
   * Format console arguments
   * 格式化控制台参数
   */
  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Extract stack trace
   * 提取堆栈跟踪
   */
  private extractStackTrace(): string | undefined {
    const error = new Error();
    const stack = error.stack?.split('\n').slice(3).join('\n');
    return stack;
  }

  /**
   * Add log entry
   * 添加日志条目
   */
  addLog(level: LogLevel, message: string, stackTrace?: string, data?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      ...(stackTrace !== undefined && { stackTrace }),
      ...(data !== undefined && { data })
    };

    this.logs.push(entry);
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Clear all logs
   * 清除所有日志
   */
  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Get all logs
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Filter logs by level
   * 按级别过滤日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Search logs
   * 搜索日志
   */
  searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      log.stackTrace?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Register command
   * 注册命令
   */
  registerCommand(command: ConsoleCommand) {
    this.commands.set(command.name, command);
  }

  /**
   * Execute command
   * 执行命令
   */
  async executeCommand(commandLine: string): Promise<any> {
    const [commandName, ...args] = commandLine.trim().split(' ');
    
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    try {
      const result = await command.execute(args);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Command failed: ${message}`);
    }
  }

  /**
   * Get all registered commands
   * 获取所有注册的命令
   */
  getCommands(): ConsoleCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Update performance metrics
   * 更新性能指标
   */
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>) {
    // Check if any metrics actually changed to avoid unnecessary updates
    let hasChanges = false;
    for (const [key, value] of Object.entries(metrics)) {
      if (this.performanceMetrics[key as keyof PerformanceMetrics] !== value) {
        hasChanges = true;
        break;
      }
    }
    
    if (hasChanges) {
      this.performanceMetrics = {
        ...this.performanceMetrics,
        ...metrics
      };
      this.notifyMetricsListeners();
    }
  }

  /**
   * Get performance metrics
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Start performance monitoring
   * 开始性能监控
   */
  private startPerformanceMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    let frameTimes: number[] = [];
    let lastMemoryUpdate = 0;

    const monitor = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      frameTimes.push(deltaTime);
      frameCount++;

      // Update FPS metrics every second (60 frames)
      if (frameTimes.length >= 60) {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = Math.round(1000 / avgFrameTime);
        const roundedFrameTime = Math.round(avgFrameTime * 100) / 100;

        this.updatePerformanceMetrics({
          fps,
          frameTime: roundedFrameTime
        });

        frameTimes = [];
      }

      // Update memory usage less frequently (every 2 seconds)
      if ('memory' in performance && currentTime - lastMemoryUpdate > 2000) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
        
        this.updatePerformanceMetrics({
          memoryUsage
        });
        
        lastMemoryUpdate = currentTime;
      }

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  /**
   * Subscribe to log updates
   * 订阅日志更新
   */
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.logs); // Send initial data
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to metrics updates
   * 订阅指标更新
   */
  subscribeToMetrics(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.metricsListeners.add(listener);
    listener(this.performanceMetrics); // Send initial data
    
    return () => {
      this.metricsListeners.delete(listener);
    };
  }

  /**
   * Notify listeners
   * 通知监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  /**
   * Notify metrics listeners
   * 通知指标监听器
   */
  private notifyMetricsListeners() {
    this.metricsListeners.forEach(listener => listener(this.performanceMetrics));
  }

  /**
   * Export logs
   * 导出日志
   */
  exportLogs(): string {
    return this.logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = log.level.toUpperCase().padEnd(7);
      let output = `[${timestamp}] ${level} ${log.message}`;
      
      if (log.stackTrace) {
        output += `\n${log.stackTrace}`;
      }
      
      return output;
    }).join('\n');
  }

  /**
   * Import logs
   * 导入日志
   */
  importLogs(data: string) {
    // Parse imported log format
    const lines = data.split('\n');
    const importedLogs: LogEntry[] = [];
    
    lines.forEach(line => {
      const match = line.match(/\[(.*?)\]\s+(\w+)\s+(.*)/);
      if (match) {
        const [, timestamp, level, message] = match;
        importedLogs.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(timestamp).getTime(),
          level: level.toLowerCase() as LogLevel,
          message
        });
      }
    });
    
    this.logs = [...this.logs, ...importedLogs];
    this.notifyListeners();
  }
}

/**
 * Command history manager
 * 命令历史管理器
 */
export class CommandHistory {
  private history: string[] = [];
  private currentIndex = -1;
  private maxHistory = 50;

  /**
   * Add command to history
   */
  add(command: string) {
    // Remove if already exists
    const existingIndex = this.history.indexOf(command);
    if (existingIndex !== -1) {
      this.history.splice(existingIndex, 1);
    }

    // Add to end
    this.history.push(command);

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Reset index
    this.currentIndex = this.history.length;
  }

  /**
   * Get previous command
   */
  getPrevious(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Get next command
   */
  getNext(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    } else if (this.currentIndex === this.history.length - 1) {
      this.currentIndex++;
      return '';
    }
    return null;
  }

  /**
   * Get all history
   */
  getAll(): string[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

/**
 * Get command suggestions based on input
 * 根据输入获取命令建议
 */
export function getCommandSuggestions(input: string): string[] {
  const service = ConsoleService.getInstance();
  const commands = service.getCommands();
  
  if (!input) {
    return commands.map(cmd => cmd.name);
  }

  const filtered = commands
    .filter(cmd => 
      cmd.name.toLowerCase().includes(input.toLowerCase()) ||
      cmd.description.toLowerCase().includes(input.toLowerCase())
    )
    .map(cmd => cmd.name);

  return filtered.slice(0, 10); // Limit to 10 suggestions
}

// Export singleton instance
export const consoleService = ConsoleService.getInstance();