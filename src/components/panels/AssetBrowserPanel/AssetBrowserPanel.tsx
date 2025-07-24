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
  App,
  Typography,
  Space,
  List,
  Tooltip
} from 'antd';

const { Text } = Typography;
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
 * Get asset icon by type
 * 根据类型获取资源图标
 */
const getAssetIcon = (type: AssetType) => {
  return ASSET_ICONS[type] || ASSET_ICONS[AssetType.Unknown];
};

/**
 * Format file size in human readable format
 * 格式化文件大小为人类可读格式
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const { message } = App.useApp();
  const assetBrowser = useEditorStore(state => state.assetBrowser);
  const forceUpdateTrigger = useEditorStore(state => state.forceUpdateTrigger);
  const theme = useEditorStore(state => state.theme);
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
  }, [assetBrowser.currentFolderId, assetBrowser.searchQuery, assetBrowser.typeFilter, assetBrowser.sortBy, assetBrowser.sortOrder, forceUpdateTrigger]);

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
          <Space.Compact>
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
          </Space.Compact>
          
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
      {assets.length === 0 ? (
        <Empty description="No assets found" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={assets}
          renderItem={(asset) => (
            <List.Item
              key={asset.id}
              onClick={(e) => handleAssetSelect(asset.id, e)}
              onDoubleClick={() => handleAssetDoubleClick(asset)}
              style={{
                cursor: 'pointer',
                backgroundColor: assetBrowser.selectedAssets.includes(asset.id) ? theme.colors.primary + '20' : 'transparent',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '2px'
              }}
              actions={[
                <Tooltip title={`Type: ${asset.type}`} key="type">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {asset.type}
                  </Text>
                </Tooltip>,
                <Tooltip title={`Size: ${formatFileSize(asset.size)}`} key="size">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatFileSize(asset.size)}
                  </Text>
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: theme.colors.border,
                    borderRadius: '4px'
                  }}>
                    {getAssetIcon(asset.type)}
                  </div>
                }
                title={
                  <Text strong style={{ color: theme.colors.text }}>
                    {asset.name}
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {asset.filename}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );


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
      {/* Assets Panel Header */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #303030',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Typography.Text style={{ color: '#fff', fontWeight: '500' }}>
          Assets
        </Typography.Text>
      </div>

      {/* Assets Content */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
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
    </div>
  );
};