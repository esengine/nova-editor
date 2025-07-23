/**
 * Asset Browser Panel - File browser and asset management
 * 资源浏览器面板 - 文件浏览器和资源管理
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Input,
  Button,
  Select,
  Spin,
  Empty,
  Slider,
  Breadcrumb,
  Upload,
  message,
  Tabs,
  Tree,
  Typography
} from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  ImportOutlined,
  ReloadOutlined,
  FolderOutlined,
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  CodeOutlined,
  FileTextOutlined,
  QuestionOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { assetService } from '../../../services/AssetService';
import { FileSystemService } from '../../../services/FileSystemService';
import type { ProjectFile, ProjectFolder } from '../../../services/FileSystemService';
import {
  AssetType
} from '../../../types/AssetTypes';
import type {
  AssetMetadata,
  AssetFolder,
  AssetImportConfig
} from '../../../types/AssetTypes';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

/**
 * Asset icon mapping
 * 资源图标映射
 */
const ASSET_ICONS = {
  [AssetType.Folder]: <FolderOutlined />,
  [AssetType.Texture]: <PictureOutlined />,
  [AssetType.Model]: <VideoCameraOutlined />,
  [AssetType.Mesh]: <VideoCameraOutlined />,
  [AssetType.Audio]: <AudioOutlined />,
  [AssetType.Video]: <VideoCameraOutlined />,
  [AssetType.Script]: <CodeOutlined />,
  [AssetType.Scene]: <FileTextOutlined />,
  [AssetType.Prefab]: <FileOutlined />,
  [AssetType.Material]: <FileTextOutlined />,
  [AssetType.Font]: <FileTextOutlined />,
  [AssetType.Unknown]: <QuestionOutlined />
};

/**
 * Asset type colors
 * 资源类型颜色
 */
const ASSET_COLORS = {
  [AssetType.Folder]: '#faad14',
  [AssetType.Texture]: '#52c41a',
  [AssetType.Model]: '#1890ff',
  [AssetType.Mesh]: '#1890ff',
  [AssetType.Audio]: '#722ed1',
  [AssetType.Video]: '#ff4d4f',
  [AssetType.Script]: '#13c2c2',
  [AssetType.Scene]: '#eb2f96',
  [AssetType.Prefab]: '#f5222d',
  [AssetType.Material]: '#fa8c16',
  [AssetType.Font]: '#389e0d',
  [AssetType.Unknown]: '#8c8c8c'
};

/**
 * Asset item component for grid view
 * 网格视图的资源项组件
 */
interface AssetItemProps {
  asset: AssetMetadata;
  isSelected: boolean;
  gridSize: number;
  onSelect: (assetId: string, event: React.MouseEvent) => void;
  onDoubleClick: (asset: AssetMetadata) => void;
}

const AssetItem: React.FC<AssetItemProps> = ({
  asset,
  isSelected,
  gridSize,
  onSelect,
  onDoubleClick
}) => {
  const iconSize = Math.max(24, gridSize * 0.3);
  
  return (
    <div
      style={{
        width: gridSize,
        height: gridSize,
        padding: '8px',
        border: isSelected ? '2px solid #1890ff' : '1px solid #303030',
        borderRadius: '4px',
        backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : '#1f1f1f',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        userSelect: 'none'
      }}
      onClick={(e) => onSelect(asset.id, e)}
      onDoubleClick={() => onDoubleClick(asset)}
    >
      {/* Asset thumbnail or icon */}
      {asset.thumbnail ? (
        <img
          src={asset.thumbnail}
          style={{
            maxWidth: iconSize,
            maxHeight: iconSize,
            objectFit: 'cover',
            borderRadius: '2px'
          }}
          alt={asset.name}
        />
      ) : (
        <div
          style={{
            fontSize: iconSize,
            color: ASSET_COLORS[asset.type],
            marginBottom: '4px'
          }}
        >
          {ASSET_ICONS[asset.type]}
        </div>
      )}
      
      {/* Asset name */}
      <div
        style={{
          fontSize: '12px',
          color: '#fff',
          textAlign: 'center',
          wordBreak: 'break-all',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.2',
          marginTop: '4px'
        }}
        title={asset.name}
      >
        {asset.name}
      </div>
    </div>
  );
};

/**
 * Folder breadcrumb component
 * 文件夹面包屑组件
 */
interface FolderBreadcrumbProps {
  currentFolder: AssetFolder | null;
  folders: AssetFolder[];
  onNavigate: (folderId: string) => void;
}

const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  currentFolder,
  folders,
  onNavigate
}) => {
  const buildBreadcrumbPath = () => {
    if (!currentFolder) return [];
    
    const path: AssetFolder[] = [];
    let current: AssetFolder | null = currentFolder;
    
    while (current) {
      path.unshift(current);
      current = current.parentId ? folders.find(f => f.id === current!.parentId) || null : null;
    }
    
    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath();

  const breadcrumbItems = breadcrumbPath.map((folder) => ({
    key: folder.id,
    title: (
      <span 
        onClick={() => onNavigate(folder.id)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center',
          fontSize: '12px',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {folder.id === 'root' ? <HomeOutlined style={{ fontSize: '12px' }} /> : <FolderOutlined style={{ fontSize: '12px' }} />}
        <span style={{ marginLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {folder.name}
        </span>
      </span>
    )
  }));

  return (
    <div style={{ 
      margin: '6px 0', 
      minHeight: '24px',
      overflow: 'hidden'
    }}>
      <Breadcrumb 
        style={{ fontSize: '12px' }}
        items={breadcrumbItems}
        separator="›"
      />
    </div>
  );
};

/**
 * Main AssetBrowserPanel component
 * 主资源浏览器面板组件
 */
export interface AssetBrowserPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export const AssetBrowserPanel: React.FC<AssetBrowserPanelProps> = ({
  style,
  className
}) => {
  const assetBrowser = useEditorStore(state => state.assetBrowser);
  const {
    navigateToFolder,
    setAssetViewMode,
    setAssetGridSize,
    searchAssets,
    filterAssetsByType,
    selectAsset
  } = useEditorStore();

  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [currentFolder, setCurrentFolder] = useState<AssetFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'project'>('project');
  
  const fileSystemService = FileSystemService.getInstance();
  
  // Load folders and assets
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      await assetService.initialize();
      
      // Load all folders
      const allFolders = await assetService.getFolders();
      setFolders(allFolders);
      
      // Load current folder
      const folder = await assetService.getFolder(assetBrowser.currentFolderId);
      setCurrentFolder(folder || null);
      
      // Load assets in current folder
      let folderAssets: AssetMetadata[] = [];
      if (assetBrowser.searchQuery) {
        // Search mode
        folderAssets = await assetService.searchAssets(
          assetBrowser.searchQuery,
          assetBrowser.typeFilter || undefined
        );
      } else {
        // Browse mode
        folderAssets = await assetService.getAssetsInFolder(assetBrowser.currentFolderId);
        if (assetBrowser.typeFilter) {
          folderAssets = folderAssets.filter(asset => asset.type === assetBrowser.typeFilter);
        }
      }
      
      // Sort assets
      folderAssets.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        switch (assetBrowser.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'date':
            aValue = a.modifiedAt;
            bValue = b.modifiedAt;
            break;
        }
        
        if (assetBrowser.sortOrder === 'desc') {
          return aValue > bValue ? -1 : 1;
        } else {
          return aValue < bValue ? -1 : 1;
        }
      });
      
      setAssets(folderAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
      message.error('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  }, [assetBrowser]);

  // Load assets when dependencies change
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Handle asset selection
  const handleAssetSelect = (assetId: string, event: React.MouseEvent) => {
    const isCtrlPressed = event.ctrlKey || event.metaKey;
    selectAsset(assetId, isCtrlPressed);
  };

  // Handle asset double-click
  const handleAssetDoubleClick = (asset: AssetMetadata) => {
    // TODO: Implement asset opening/editing
    message.info(`Opening asset: ${asset.name}`);
  };

  // Convert project structure to tree data
  const convertProjectToTreeData = (folder: ProjectFolder): any => {
    return {
      title: folder.name,
      key: folder.path,
      icon: <FolderOutlined />,
      children: folder.children.map(child => {
        if ('children' in child) {
          return convertProjectToTreeData(child as ProjectFolder);
        } else {
          const file = child as ProjectFile;
          return {
            title: file.name,
            key: file.path,
            icon: getFileIcon(file.language),
            isLeaf: true,
            file: file
          };
        }
      })
    };
  };

  // Get file icon based on language/extension
  const getFileIcon = (language: string) => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <CodeOutlined />;
      case 'json':
        return <FileTextOutlined />;
      case 'glsl':
        return <FileOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  // Handle project file selection
  const handleProjectFileSelect = (_selectedKeys: React.Key[], info: any) => {
    const selectedNode = info.selectedNodes[0];
    if (selectedNode?.file) {
      const file = selectedNode.file as ProjectFile;
      console.log('Selected project file:', file);
      // TODO: Open file in code editor
    }
  };

  // Handle project file import
  const handleProjectFileImport = async () => {
    try {
      const importedFiles = await fileSystemService.importFiles();
      if (importedFiles.length > 0) {
        message.success(`Successfully imported ${importedFiles.length} file(s)`);
        // Force re-render by setting activeTab again
        setActiveTab('project');
      }
    } catch (error) {
      console.error('Failed to import files:', error);
      message.error('Failed to import files');
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (!currentFolder) return;

    // Convert File[] to FileList-like object
    const fileList = {
      ...files,
      item: (index: number) => files[index] || null,
      length: files.length
    } as FileList;

    const importConfig: AssetImportConfig = {
      targetFolderId: currentFolder.id,
      generateThumbnails: true,
      thumbnailSize: 128,
      overwrite: false,
      metadata: {}
    };

    try {
      setIsLoading(true);
      const results = await assetService.importAssets(fileList, importConfig);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        message.success(`Successfully imported ${successCount} asset(s)`);
        loadAssets(); // Reload to show new assets
      }
      
      if (failCount > 0) {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
        message.error(`Failed to import ${failCount} asset(s): ${errors}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      message.error('Failed to import assets');
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolbar = () => (
    <div style={{ 
      padding: '12px',
      borderBottom: '1px solid #303030',
      backgroundColor: '#1a1a1a'
    }}>
      {/* First row - Search and filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Search
          placeholder="Search assets..."
          style={{ width: 240 }}
          value={assetBrowser.searchQuery}
          onChange={(e) => searchAssets(e.target.value)}
          allowClear
        />
        
        <Select
          placeholder="All Types"
          style={{ width: 140 }}
          value={assetBrowser.typeFilter}
          onChange={filterAssetsByType}
          allowClear
        >
          {Object.values(AssetType).filter(type => type !== AssetType.Folder).map(type => (
            <Option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Option>
          ))}
        </Select>
      </div>
      
      {/* Second row - View controls and actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View mode */}
          <Button.Group>
            <Button
              type={assetBrowser.viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setAssetViewMode('grid')}
              size="small"
            />
            <Button
              type={assetBrowser.viewMode === 'list' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              onClick={() => setAssetViewMode('list')}
              size="small"
            />
          </Button.Group>
          
          {/* Grid size slider (only show in grid mode) */}
          {assetBrowser.viewMode === 'grid' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ccc', fontSize: '11px', whiteSpace: 'nowrap' }}>Size:</span>
              <Slider
                style={{ width: 100 }}
                min={64}
                max={256}
                step={32}
                value={assetBrowser.gridSize}
                onChange={setAssetGridSize}
                tooltip={{ formatter: null }}
              />
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Upload
            multiple
            showUploadList={false}
            beforeUpload={(_, fileList) => {
              handleFileUpload(Array.from(fileList));
              return false;
            }}
          >
            <Button icon={<ImportOutlined />} size="small">Import</Button>
          </Upload>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={loadAssets}
            loading={isLoading}
            size="small"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div style={{
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${assetBrowser.gridSize}px, 1fr))`,
      gap: '16px',
      height: '100%',
      overflowY: 'auto'
    }}>
      {assets.map(asset => (
        <AssetItem
          key={asset.id}
          asset={asset}
          isSelected={assetBrowser.selectedAssets.includes(asset.id)}
          gridSize={assetBrowser.gridSize}
          onSelect={handleAssetSelect}
          onDoubleClick={handleAssetDoubleClick}
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <div style={{ padding: '8px' }}>
      {/* TODO: Implement list view */}
      <Empty description="List view coming soon" />
    </div>
  );

  const renderProjectView = () => {
    const currentProject = fileSystemService.getCurrentProject();
    
    if (!currentProject) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          padding: '20px'
        }}>
          <Empty
            description={
              <div>
                <Text style={{ color: '#ccc' }}>No project opened</Text>
                <br />
                <Text style={{ color: '#999', fontSize: '12px' }}>
                  Use the toolbar to create or open a project
                </Text>
              </div>
            }
          />
        </div>
      );
    }

    const treeData = [convertProjectToTreeData(currentProject.rootFolder)];

    return (
      <div style={{ padding: '12px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Project header */}
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          backgroundColor: '#1f1f1f', 
          borderRadius: '6px',
          border: '1px solid #303030'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong style={{ color: '#fff', fontSize: '14px' }}>{currentProject.name}</Text>
            <Button 
              size="small" 
              icon={<ImportOutlined />}
              onClick={handleProjectFileImport}
              type="primary"
              ghost
            >
              Import Files
            </Button>
          </div>
          <Text style={{ color: '#999', fontSize: '11px', wordBreak: 'break-all' }}>
            {currentProject.rootPath}
          </Text>
        </div>
        
        {/* File tree */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1a1a1a', borderRadius: '4px', padding: '8px' }}>
          <Tree
            showIcon
            treeData={treeData}
            onSelect={handleProjectFileSelect}
            style={{ 
              backgroundColor: 'transparent',
              color: '#fff'
            }}
            blockNode
          />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#141414',
        border: '1px solid #303030',
        borderRadius: '6px',
        overflow: 'hidden',
        ...style
      }}
      className={className}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'assets' | 'project')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        tabBarStyle={{ 
          margin: 0,
          paddingLeft: '12px',
          paddingRight: '12px',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #303030',
          minHeight: '40px'
        }}
        size="small"
        items={[
          {
            key: 'project',
            label: 'Project Files',
            style: { height: '100%' },
            children: renderProjectView()
          },
          {
            key: 'assets',
            label: 'Assets',
            style: { height: '100%', display: 'flex', flexDirection: 'column' },
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {renderToolbar()}
                
                {/* Breadcrumb */}
                <div style={{ padding: '0 12px 6px 12px', borderBottom: '1px solid #303030', backgroundColor: '#1a1a1a' }}>
                  <FolderBreadcrumb
                    currentFolder={currentFolder}
                    folders={folders}
                    onNavigate={navigateToFolder}
                  />
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {isLoading ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <Spin size="large" />
                    </div>
                  ) : assets.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      flexDirection: 'column'
                    }}>
                      <Empty
                        description="No assets found"
                        style={{ color: '#ccc' }}
                      />
                    </div>
                  ) : assetBrowser.viewMode === 'grid' ? (
                    renderGridView()
                  ) : (
                    renderListView()
                  )}
                </div>
              </div>
            )
          }
        ]}
      />
    </div>
  );
};