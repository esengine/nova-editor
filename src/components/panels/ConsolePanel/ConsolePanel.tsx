/**
 * Console panel with command execution and filtering
 * 控制台面板，支持命令执行和过滤
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Space, Select, Badge, Tabs, Tooltip, AutoComplete } from 'antd';
import {
  ClearOutlined,
  DownloadOutlined,
  UpOutlined,
  DownOutlined,
  CodeOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { consoleService, CommandHistory, getCommandSuggestions } from '../../../services/ConsoleService';
import { registerBuiltInCommands } from '../../../services/ConsoleCommands';
import type { LogEntry, LogLevel, PerformanceMetrics } from '../../../types/ConsoleTypes';
import { LOG_LEVEL_COLORS, LOG_LEVEL_ICONS } from '../../../types/ConsoleTypes';
import styles from './ConsolePanel.module.css';


/**
 * Console panel props
 */
export interface ConsolePanelProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Log entry component
 */
const LogEntryComponent: React.FC<{
  entry: LogEntry;
  showTimestamp: boolean;
  showStackTrace: boolean;
}> = ({ entry, showTimestamp, showStackTrace }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={styles.logEntry} data-level={entry.level}>
      <div className={styles.logHeader}>
        {showTimestamp && (
          <span className={styles.timestamp}>
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
        )}
        <span className={styles.levelIcon}>
          {LOG_LEVEL_ICONS[entry.level]}
        </span>
        <span 
          className={styles.message}
          style={{ color: LOG_LEVEL_COLORS[entry.level] }}
        >
          {entry.message}
        </span>
        {entry.count && entry.count > 1 && (
          <Badge count={entry.count} style={{ marginLeft: '8px' }} />
        )}
      </div>
      
      {entry.stackTrace && showStackTrace && (
        <div className={styles.stackTrace}>
          <Button
            size="small"
            type="text"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setExpanded(!expanded)}
          >
            Stack Trace
          </Button>
          {expanded && (
            <pre className={styles.stackTraceContent}>
              {entry.stackTrace}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Performance metrics display
 */
const PerformanceDisplay: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  return (
    <div className={styles.performanceMetrics}>
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>FPS</span>
          <span className={styles.metricValue} style={{
            color: metrics.fps < 30 ? '#f44336' : metrics.fps < 60 ? '#ff9800' : '#4caf50'
          }}>
            {metrics.fps}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Frame Time</span>
          <span className={styles.metricValue}>{metrics.frameTime.toFixed(2)}ms</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Memory</span>
          <span className={styles.metricValue}>{metrics.memoryUsage}MB</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Draw Calls</span>
          <span className={styles.metricValue}>{metrics.drawCalls}</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Triangles</span>
          <span className={styles.metricValue}>{metrics.triangles.toLocaleString()}</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Entities</span>
          <span className={styles.metricValue}>{metrics.entityCount}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Console panel component
 */
export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  style,
  className
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    entityCount: 0,
    systemCount: 0,
    componentCount: 0,
    renderCalls: 0
  });
  
  const [commandInput, setCommandInput] = useState('');
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showStackTraces, setShowStackTraces] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const commandHistory = useRef(new CommandHistory());
  
  // Initialize console service
  useEffect(() => {
    registerBuiltInCommands();
    
    // Subscribe to logs
    const unsubscribeLogs = consoleService.subscribe(setLogs);
    const unsubscribeMetrics = consoleService.subscribeToMetrics(setMetrics);
    
    return () => {
      unsubscribeLogs();
      unsubscribeMetrics();
    };
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);
  
  // Filter logs
  const filteredLogs = React.useMemo(() => {
    let filtered = logs;
    
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.stackTrace?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [logs, filterLevel, searchQuery]);
  
  // Handle command execution
  const executeCommand = useCallback(async () => {
    if (!commandInput.trim()) return;
    
    const command = commandInput.trim();
    commandHistory.current.add(command);
    
    try {
      // Try to execute as JavaScript first
      if (command.startsWith('js:')) {
        const code = command.substring(3);
        const result = eval(code);
        consoleService.addLog('info', `> ${code}`, undefined, result);
        if (result !== undefined) {
          consoleService.addLog('debug', String(result));
        }
      } else {
        // Execute as console command
        const result = await consoleService.executeCommand(command);
        consoleService.addLog('info', `> ${command}`);
        if (result !== undefined) {
          consoleService.addLog('success', String(result));
        }
      }
    } catch (error) {
      consoleService.addLog('error', `> ${command}`);
      consoleService.addLog('error', error instanceof Error ? error.message : String(error));
    }
    
    setCommandInput('');
  }, [commandInput]);
  
  // Handle command input change
  const handleCommandChange = (value: string) => {
    setCommandInput(value);
    
    // Update suggestions
    if (value && !value.startsWith('js:')) {
      const suggestions = getCommandSuggestions(value);
      setCommandSuggestions(suggestions);
    } else {
      setCommandSuggestions([]);
    }
  };
  
  // Handle key navigation in command input
  const handleCommandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = commandHistory.current.getPrevious();
      if (prev !== null) setCommandInput(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = commandHistory.current.getNext();
      if (next !== null) setCommandInput(next);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };
  
  // Export logs
  const exportLogs = () => {
    const data = consoleService.exportLogs();
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div
      className={`${styles.consolePanel} ${className || ''}`}
      style={style}
    >
      <Tabs 
        defaultActiveKey="console" 
        size="small"
        items={[
          {
            key: 'console',
            label: (
              <span>
                <CodeOutlined /> Console
                {filteredLogs.length > 0 && (
                  <Badge count={filteredLogs.length} style={{ marginLeft: '8px' }} />
                )}
              </span>
            ),
            children: (
              <div className={styles.consoleContent}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                  <Space>
                    <Select
                      value={filterLevel}
                      onChange={setFilterLevel}
                      size="small"
                      style={{ width: 100 }}
                    >
                      <Select.Option value="all">All</Select.Option>
                      <Select.Option value="debug">Debug</Select.Option>
                      <Select.Option value="info">Info</Select.Option>
                      <Select.Option value="warning">Warning</Select.Option>
                      <Select.Option value="error">Error</Select.Option>
                    </Select>
                    
                    <Input.Search
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      size="small"
                      style={{ width: 200 }}
                    />
                    
                    <Tooltip title="Toggle timestamps">
                      <Button
                        size="small"
                        type={showTimestamps ? 'primary' : 'default'}
                        onClick={() => setShowTimestamps(!showTimestamps)}
                      >
                        🕐
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Toggle stack traces">
                      <Button
                        size="small"
                        type={showStackTraces ? 'primary' : 'default'}
                        onClick={() => setShowStackTraces(!showStackTraces)}
                      >
                        📋
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Toggle auto-scroll">
                      <Button
                        size="small"
                        type={autoScroll ? 'primary' : 'default'}
                        onClick={() => setAutoScroll(!autoScroll)}
                      >
                        ↓
                      </Button>
                    </Tooltip>
                  </Space>
                  
                  <Space>
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={() => consoleService.clear()}
                    >
                      Clear
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={exportLogs}
                    >
                      Export
                    </Button>
                  </Space>
                </div>
                
                {/* Log entries */}
                <div className={styles.logContainer} data-scrollable="console">
                  {filteredLogs.map(entry => (
                    <LogEntryComponent
                      key={entry.id}
                      entry={entry}
                      showTimestamp={showTimestamps}
                      showStackTrace={showStackTraces}
                    />
                  ))}
                  <div ref={logsEndRef} />
                </div>
                
                {/* Command input */}
                <div className={styles.commandInput}>
                  <AutoComplete
                    value={commandInput}
                    onChange={handleCommandChange}
                    onKeyDown={handleCommandKeyDown}
                    options={commandSuggestions.map(cmd => ({ value: cmd }))}
                    style={{ width: '100%' }}
                  >
                    <Input
                      placeholder="Enter command or js:code..."
                      prefix=">"
                      size="small"
                    />
                  </AutoComplete>
                </div>
              </div>
            )
          },
          {
            key: 'performance',
            label: (
              <span>
                <DashboardOutlined /> Performance
              </span>
            ),
            children: <PerformanceDisplay metrics={metrics} />
          }
        ]}
      />
    </div>
  );
};