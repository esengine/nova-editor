/**
 * Console panel for displaying logs and output
 * 用于显示日志和输出的控制台面板
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Badge, Select } from 'antd';
import {
  ClearOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import './ConsolePanel.module.css';

const { Search } = Input;
const { Option } = Select;

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  source?: string;
}

/**
 * Console panel props
 * 控制台面板属性
 */
export interface ConsolePanelProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Console panel component
 * 控制台面板组件
 */
export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  style,
  className
}) => {
  const theme = useEditorStore(state => state.theme);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Intercept console methods to capture logs
  const addMessage = React.useCallback((type: ConsoleMessage['type'], args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const newMessage: ConsoleMessage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      source: 'Editor'
    };

    // Use functional update to avoid dependency issues
    setMessages(prev => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog(...args);
      // Use setTimeout to avoid setState during render
      setTimeout(() => addMessage('log', args), 0);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      setTimeout(() => addMessage('warn', args), 0);
    };

    console.error = (...args) => {
      originalError(...args);
      setTimeout(() => addMessage('error', args), 0);
    };

    console.info = (...args) => {
      originalInfo(...args);
      setTimeout(() => addMessage('info', args), 0);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, [addMessage]);

  const clearMessages = () => {
    setMessages([]);
  };

  const exportLogs = () => {
    const logText = messages.map(msg => 
      `[${new Date(msg.timestamp).toLocaleTimeString()}] [${msg.type.toUpperCase()}] ${msg.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'console-logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = searchQuery === '' || 
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || message.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getMessageTypeColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return '#ff4d4f';
      case 'warn': return '#faad14';
      case 'info': return '#1890ff';
      case 'log': 
      default: return theme.colors.text;
    }
  };

  const getMessageCounts = () => {
    return messages.reduce((counts, msg) => {
      counts[msg.type] = (counts[msg.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const messageCounts = getMessageCounts();

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        ...style
      }}
      className={className}
    >
      {/* Console toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <Search
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '200px' }}
          size="small"
        />
        
        <Select
          value={filterType}
          onChange={setFilterType}
          size="small"
          style={{ width: '120px' }}
        >
          <Option value="all">All ({messages.length})</Option>
          <Option value="log">
            <Badge count={messageCounts.log || 0} size="small">
              Log
            </Badge>
          </Option>
          <Option value="info">
            <Badge count={messageCounts.info || 0} size="small" color="#1890ff">
              Info
            </Badge>
          </Option>
          <Option value="warn">
            <Badge count={messageCounts.warn || 0} size="small" color="#faad14">
              Warn
            </Badge>
          </Option>
          <Option value="error">
            <Badge count={messageCounts.error || 0} size="small" color="#ff4d4f">
              Error
            </Badge>
          </Option>
        </Select>

        <div style={{ flex: 1 }} />

        <Space size="small">
          <Button
            icon={<ClearOutlined />}
            size="small"
            onClick={clearMessages}
            title="Clear console"
          />
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={exportLogs}
            title="Export logs"
          />
        </Space>
      </div>

      {/* Console messages */}
      <div 
        ref={consoleRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
          setAutoScroll(isAtBottom);
        }}
      >
        {filteredMessages.length === 0 ? (
          <div style={{ 
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            {searchQuery || filterType !== 'all' ? 'No matching messages' : 'No messages'}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '4px',
                padding: '4px 8px',
                borderRadius: '3px',
                backgroundColor: message.type === 'error' ? 'rgba(255, 77, 79, 0.1)' :
                                 message.type === 'warn' ? 'rgba(250, 173, 20, 0.1)' :
                                 'transparent',
                borderLeft: `3px solid ${getMessageTypeColor(message.type)}`,
                paddingLeft: '8px'
              }}
            >
              <div style={{
                color: theme.colors.textSecondary,
                fontSize: '10px',
                marginBottom: '2px'
              }}>
                [{new Date(message.timestamp).toLocaleTimeString()}] 
                <span style={{ 
                  color: getMessageTypeColor(message.type),
                  fontWeight: 'bold',
                  marginLeft: '4px'
                }}>
                  {message.type.toUpperCase()}
                </span>
                {message.source && (
                  <span style={{ marginLeft: '4px' }}>
                    ({message.source})
                  </span>
                )}
              </div>
              <div style={{
                color: getMessageTypeColor(message.type),
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {message.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};