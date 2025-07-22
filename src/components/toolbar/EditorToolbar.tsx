/**
 * Editor toolbar with panel management and workspace controls
 * 编辑器工具栏，包含面板管理和工作区控制
 */

import React from 'react';


/**
 * Main editor toolbar component
 * 主编辑器工具栏组件
 */
export interface EditorToolbarProps {
  style?: React.CSSProperties;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  style,
  className
}) => {

  return (
    <div 
      style={{
        display: 'none', // Hide the toolbar completely
        ...style
      }}
      className={className}
    >
    </div>
  );
};