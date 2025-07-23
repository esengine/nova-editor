/**
 * Code Editor Panel - Monaco editor for code editing
 * 代码编辑器面板 - 基于Monaco的代码编辑器
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor, type Monaco } from '@monaco-editor/react';
import { Button, Space, Tabs, Upload, Modal, App } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { FileSystemService, type ProjectFile } from '../../../services/FileSystemService';


/**
 * Main CodeEditorPanel component
 * 主代码编辑器面板组件
 */
export interface CodeEditorPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  style,
  className
}) => {
  const { modal, message } = App.useApp();
  const theme = useEditorStore(state => state.theme);
  const editorTheme = 'vs-dark';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileTabs, setFileTabs] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const fileService = useRef(FileSystemService.getInstance());
  const initializedRef = useRef(false);

  // Handle editor before mount (2024 recommended approach)
  const handleEditorBeforeMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco;

    // Configure TypeScript/JavaScript language features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ["node_modules/@types"],
      strict: false,
      skipLibCheck: true
    });

    // Configure diagnostics to be less strict but enable some features
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [1005, 1109, 1219, 1272, 2307, 2552, 2580, 2354, 2585, 2589]
    });

    // Enable better IntelliSense and navigation
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    // Add custom completion providers for NovaECS
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          {
            label: 'Component',
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: 'Component',
            documentation: 'NovaECS Component base class',
            range: range
          },
          {
            label: 'Entity',
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: 'Entity',
            documentation: 'NovaECS Entity class',
            range: range
          },
          {
            label: 'System',
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: 'System',
            documentation: 'NovaECS System base class',
            range: range
          }
        ];
        
        return { suggestions };
      }
    });
  }, []);

  // Update file tabs
  const updateFileTabs = useCallback(() => {
    const tabs = fileService.current.getFileTabs();
    setFileTabs(tabs);
    setActiveFile(fileService.current.getActiveFile());
  }, []);

  // Handle save  
  const handleSave = useCallback(async () => {
    if (activeFile) {
      try {
        await fileService.current.saveFile(activeFile.id);
        message.success(`${activeFile.name} saved successfully`);
        updateFileTabs();
      } catch (error) {
        message.error('Failed to save file');
      }
    }
  }, [activeFile, updateFileTabs]);

  // Handle editor mount (for editor instance specific setup)
  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F12, () => {
      editor.getAction('editor.action.revealDefinition')?.run();
    });
  }, [handleSave]);

  // Initialize (only once)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Don't create any default files - let user create or open files manually
      updateFileTabs();
    }
  }, [updateFileTabs]);

  // Handle code changes
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined && activeFile) {
      fileService.current.updateFile(activeFile.id, value);
      updateFileTabs();
    }
  }, [activeFile, updateFileTabs]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  }, []);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  }, []);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle file operations
  const handleNewFile = useCallback(() => {
    setShowNewFileModal(true);
  }, []);

  const handleCreateFile = useCallback(() => {
    if (newFileName.trim()) {
      fileService.current.createFile(newFileName.trim());
      updateFileTabs();
      setShowNewFileModal(false);
      setNewFileName('');
    }
  }, [newFileName, updateFileTabs]);

  const handleOpenFile = useCallback(async (file: File) => {
    try {
      // For browser File objects, we need to convert to a file handle-like structure
      // This is a fallback for when File System Access API is not available
      const fileName = file.name;
      const content = await file.text();
      
      // Create a new file in the current project
      const newFile = await fileService.current.createFile(fileName);
      fileService.current.updateFile(newFile.id, content);
      
      updateFileTabs();
      message.success(`${file.name} opened successfully`);
    } catch (error) {
      message.error('Failed to open file');
    }
  }, [updateFileTabs]);

  const handleTabChange = useCallback((fileId: string) => {
    fileService.current.setActiveFile(fileId);
    updateFileTabs();
  }, [updateFileTabs]);

  const handleCloseTab = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = fileService.current.getOpenFiles().find(f => f.id === fileId);
    if (file?.isModified) {
      modal.confirm({
        title: 'Unsaved Changes',
        content: `${file.name} has unsaved changes. Do you want to close it anyway?`,
        onOk: () => {
          fileService.current.closeFile(fileId);
          updateFileTabs();
        }
      });
    } else {
      fileService.current.closeFile(fileId);
      updateFileTabs();
    }
  }, [modal, updateFileTabs]);

  // Render toolbar
  const renderToolbar = () => (
    <div style={{ 
      padding: '8px',
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Space>
        <Button
          icon={<FileAddOutlined />}
          onClick={handleNewFile}
          size="small"
        >
          New
        </Button>
        
        <Upload
          beforeUpload={(file) => {
            handleOpenFile(file);
            return false;
          }}
          showUploadList={false}
          accept=".ts,.tsx,.js,.jsx,.json,.html,.css,.md,.yml,.yaml,.glsl,.vert,.frag"
        >
          <Button
            icon={<FolderOpenOutlined />}
            size="small"
          >
            Open
          </Button>
        </Upload>
        
        <Button
          icon={<SaveOutlined />}
          onClick={handleSave}
          size="small"
          disabled={!activeFile || !activeFile.isModified}
        >
          Save
        </Button>
        
        <Button
          icon={<UndoOutlined />}
          onClick={handleUndo}
          size="small"
        />
        
        <Button
          icon={<RedoOutlined />}
          onClick={handleRedo}
          size="small"
        />
      </Space>

      <Space>
        <span style={{ 
          color: theme.colors.textSecondary, 
          fontSize: '12px',
          padding: '0 8px'
        }}>
          {activeFile?.language?.toUpperCase() || 'TEXT'}
        </span>

        <Button
          icon={<FullscreenOutlined />}
          onClick={handleFullscreen}
          size="small"
          title="Toggle Fullscreen"
        />
      </Space>
    </div>
  );

  return (
    <>
      <style>{`
        /* Global Monaco Editor Styles */
        .monaco-editor-container {
          --monaco-bg: ${theme.colors.background};
          --monaco-surface: ${theme.colors.surface};
          --monaco-text: ${theme.colors.text};
          --monaco-border: ${theme.colors.border};
          --monaco-primary: ${theme.colors.primary};
        }
        
        /* Additional global widget styles */
        .editor-widget {
          background-color: ${theme.colors.surface} !important;
          color: ${theme.colors.text} !important;
          border: 1px solid ${theme.colors.border} !important;
        }
        
        /* Monaco list styles */
        .monaco-list .monaco-list-row {
          background-color: ${theme.colors.surface} !important;
          color: ${theme.colors.text} !important;
        }
        
        .monaco-list .monaco-list-row:hover {
          background-color: ${theme.colors.primary}33 !important;
        }
        
        .monaco-list .monaco-list-row.focused {
          background-color: ${theme.colors.primary}44 !important;
        }
        
        .monaco-list .monaco-list-row.selected {
          background-color: ${theme.colors.primary}55 !important;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
          ...(isFullscreen ? {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: theme.colors.background,
            border: 'none'
          } : {}),
          ...style
        }}
        className={`${className} monaco-editor-container`}
      >
      {renderToolbar()}
      
      {/* File Tabs */}
      {fileTabs.length > 0 && activeFile && (
        <div style={{
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface
        }}>
          <Tabs
            type="editable-card"
            activeKey={activeFile!.id}
            onChange={handleTabChange}
            hideAdd
            size="small"
            style={{ margin: 0 }}
            items={fileTabs.map(tab => ({
              key: tab.file.id,
              label: (
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: tab.file.isModified ? theme.colors.warning : 'inherit'
                }}>
                  {tab.file.name}
                  {tab.file.isModified && <span style={{ fontSize: '8px' }}>●</span>}
                  <CloseOutlined 
                    style={{ fontSize: '10px', marginLeft: '4px' }} 
                    onClick={(e) => handleCloseTab(tab.file.id, e)}
                  />
                </span>
              ),
              closable: false
            }))}
          />
        </div>
      )}
      
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <style>{`
          /* Minimal necessary overrides */
          .monaco-editor .sticky-scroll-widget {
            backdrop-filter: blur(4px);
          }
          
          /* Fullscreen specific styles */
          ${isFullscreen ? `
          .monaco-editor-container {
            background-color: ${theme.colors.background} !important;
          }
          ` : ''}
        `}</style>
        <Editor
          height="100%"
          defaultLanguage={activeFile?.language || 'typescript'}
          language={activeFile?.language || 'typescript'}
          theme={editorTheme}
          value={activeFile?.content || ''}
          onChange={handleCodeChange}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            cursorStyle: 'line',
            cursorWidth: 2,
            readOnly: false,  // Explicitly allow editing
            selectOnLineNumbers: true,
            roundedSelection: false,
            renderLineHighlight: 'gutter',
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',
            renderLineHighlightOnlyWhenFocus: false,
            contextmenu: true,
            mouseWheelZoom: true,
            multiCursorModifier: 'ctrlCmd',
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            tabSize: 2,
            insertSpaces: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: {
              enabled: true
            },
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            stickyScroll: {
              enabled: true,
              maxLineCount: 5
            },
            // Enable code navigation
            definitionLinkOpensInPeek: false,
            gotoLocation: {
              multipleDefinitions: 'goto',
              multipleTypeDefinitions: 'goto',
              multipleDeclarations: 'goto',
              multipleImplementations: 'goto',
              multipleReferences: 'goto'
            },
            // Enable Ctrl+click navigation
            links: true
          }}
          loading={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.textSecondary
            }}>
              Loading Monaco Editor...
            </div>
          }
        />
      </div>

      {/* New File Modal */}
      <Modal
        title="Create New File"
        open={showNewFileModal}
        onOk={handleCreateFile}
        onCancel={() => {
          setShowNewFileModal(false);
          setNewFileName('');
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            File Name:
          </label>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="example.ts"
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.text
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFile();
              }
            }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
    </>
  );
};