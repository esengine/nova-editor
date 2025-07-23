/**
 * Scene Manager Panel for managing scenes, assets, and project settings
 * 场景管理面板，用于管理场景、资源和项目设置
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Upload,
  List,
  Tag,
  Tabs,
  Progress,
  message,
  Drawer
} from 'antd';
import {
  SaveOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { sceneSerializer } from '../../services/SceneSerializer';
import { assetImportPipeline } from '../../services/AssetImportPipeline';
import { AssetPreview } from './AssetBrowserPanel/AssetPreview';
import type { AssetMetadata } from '../../types/AssetTypes';

const { TextArea } = Input;

/**
 * Scene Manager Panel Props
 */
export interface SceneManagerPanelProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Scene template interface
 */
interface SceneTemplate {
  name: string;
  description: string;
  preview?: string;
}

/**
 * Scene Manager Panel Component
 */
export const SceneManagerPanel: React.FC<SceneManagerPanelProps> = ({
  style,
  className
}) => {
  const world = useEditorStore(state => state.world.instance);
  const theme = useEditorStore(state => state.theme);
  
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetMetadata | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  
  const [saveForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // Scene templates
  const sceneTemplates: SceneTemplate[] = [
    {
      name: 'empty',
      description: 'Empty scene with no objects',
      preview: '🌌'
    },
    {
      name: 'basic',
      description: 'Basic scene with ground plane and lighting',
      preview: '🏞️'
    }
  ];

  /**
   * Save current scene
   */
  const handleSaveScene = useCallback(async (values: any) => {
    if (!world) {
      message.error('No world instance available');
      return;
    }

    try {
      await sceneSerializer.saveSceneToFile(world, undefined, {
        name: values.name,
        description: values.description,
        author: values.author,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : []
      });
      
      message.success('Scene saved successfully');
      setSaveModalVisible(false);
      saveForm.resetFields();
    } catch (error) {
      message.error('Failed to save scene');
    }
  }, [world, saveForm]);

  /**
   * Load scene from file
   */
  const handleLoadScene = useCallback(async (file: File) => {
    if (!world) {
      message.error('No world instance available');
      return;
    }

    try {
      await sceneSerializer.loadSceneFromFile(file, world);
      message.success('Scene loaded successfully');
      setLoadModalVisible(false);
    } catch (error) {
      message.error('Failed to load scene');
    }
  }, [world]);

  /**
   * Create new scene from template
   */
  const handleCreateFromTemplate = useCallback(async (templateName: string) => {
    if (!world) {
      message.error('No world instance available');
      return;
    }

    try {
      const template = sceneSerializer.createSceneTemplate(templateName);
      await sceneSerializer.deserializeScene(template, world);
      message.success(`Created scene from ${templateName} template`);
      setTemplateModalVisible(false);
    } catch (error) {
      message.error('Failed to create scene from template');
    }
  }, [world]);

  /**
   * Import assets
   */
  const handleImportAssets = useCallback(async () => {
    if (importFiles.length === 0) return;

    setImportProgress(0);
    const results = [];
    
    for (let i = 0; i < importFiles.length; i++) {
      const file = importFiles[i];
      try {
        const result = await assetImportPipeline.importFile(file);
        results.push(result);
        setImportProgress(((i + 1) / importFiles.length) * 100);
      } catch (error) {
        console.error('Import failed:', error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    if (failed === 0) {
      message.success(`Successfully imported ${successful} assets`);
    } else {
      message.warning(`Imported ${successful} assets, ${failed} failed`);
    }

    setImportModalVisible(false);
    setImportFiles([]);
    setImportProgress(0);
  }, [importFiles]);

  /**
   * Export project
   */
  const handleExportProject = useCallback(async () => {
    if (!world) {
      message.error('No world instance available');
      return;
    }

    try {
      // Create a complete project export
      const sceneData = await sceneSerializer.serializeScene(world);
      
      const projectData = {
        name: 'Exported Project',
        version: '1.0.0',
        scenes: [sceneData],
        assets: [], // TODO: Export assets
        settings: sceneData.settings
      };

      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.json';
      a.click();
      
      URL.revokeObjectURL(url);
      message.success('Project exported successfully');
    } catch (error) {
      message.error('Failed to export project');
    }
  }, [world]);

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        ...style
      }}
      className={className}
    >
      <Tabs 
        defaultActiveKey="scenes" 
        size="small"
        items={[
          {
            key: 'scenes',
            label: (
              <span>
                <FileTextOutlined /> Scenes
              </span>
            ),
            children: (
              <div style={{ padding: '16px' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Scene Actions */}
                  <Card title="Scene Management" size="small">
                    <Space wrap>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setTemplateModalVisible(true)}
                      >
                        New Scene
                      </Button>
                      <Button
                        icon={<SaveOutlined />}
                        onClick={() => setSaveModalVisible(true)}
                      >
                        Save Scene
                      </Button>
                      <Button
                        icon={<FolderOpenOutlined />}
                        onClick={() => setLoadModalVisible(true)}
                      >
                        Load Scene
                      </Button>
                      <Button
                        icon={<ExportOutlined />}
                        onClick={handleExportProject}
                      >
                        Export Project
                      </Button>
                    </Space>
                  </Card>

                  {/* Asset Management */}
                  <Card title="Asset Management" size="small">
                    <Space wrap>
                      <Button
                        icon={<ImportOutlined />}
                        onClick={() => setImportModalVisible(true)}
                      >
                        Import Assets
                      </Button>
                      <Button
                        icon={<AppstoreOutlined />}
                      >
                        Asset Browser
                      </Button>
                    </Space>
                  </Card>

                  {/* Project Settings */}
                  <Card title="Project Settings" size="small">
                    <Button
                      icon={<SettingOutlined />}
                      onClick={() => setSettingsDrawerVisible(true)}
                    >
                      Open Settings
                    </Button>
                  </Card>
                </Space>
              </div>
            )
          }
        ]}
      />

      {/* Save Scene Modal */}
      <Modal
        title="Save Scene"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        onOk={() => saveForm.submit()}
      >
        <Form form={saveForm} layout="vertical" onFinish={handleSaveScene}>
          <Form.Item
            name="name"
            label="Scene Name"
            rules={[{ required: true, message: 'Please enter scene name' }]}
          >
            <Input placeholder="Enter scene name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="author" label="Author">
            <Input placeholder="Optional author name" />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Input placeholder="Comma-separated tags" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Load Scene Modal */}
      <Modal
        title="Load Scene"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".json,.scene.json"
          beforeUpload={(file) => {
            handleLoadScene(file);
            return false;
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <FolderOpenOutlined />
          </p>
          <p className="ant-upload-text">Click or drag scene file to load</p>
          <p className="ant-upload-hint">
            Support for .json and .scene.json files
          </p>
        </Upload.Dragger>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        title="Create New Scene"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
      >
        <List
          dataSource={sceneTemplates}
          renderItem={(template) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleCreateFromTemplate(template.name)}
                >
                  Create
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<div style={{ fontSize: '24px' }}>{template.preview}</div>}
                title={template.name.charAt(0).toUpperCase() + template.name.slice(1)}
                description={template.description}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Import Assets Modal */}
      <Modal
        title="Import Assets"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={handleImportAssets}
        okText="Import"
        okButtonProps={{ disabled: importFiles.length === 0 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Upload.Dragger
            multiple
            beforeUpload={(_, fileList) => {
              setImportFiles([...importFiles, ...fileList]);
              return false;
            }}
            fileList={[]}
          >
            <p className="ant-upload-drag-icon">
              <ImportOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to import</p>
            <p className="ant-upload-hint">
              Support for images, 3D models, audio, scripts, and more
            </p>
          </Upload.Dragger>

          {importFiles.length > 0 && (
            <div>
              <div style={{ marginBottom: '8px' }}>
                Selected Files ({importFiles.length}):
              </div>
              <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                {importFiles.map((file, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => {
                      const newFiles = importFiles.filter((_, i) => i !== index);
                      setImportFiles(newFiles);
                    }}
                    style={{ marginBottom: '4px' }}
                  >
                    {file.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {importProgress > 0 && (
            <Progress percent={importProgress} />
          )}
        </Space>
      </Modal>

      {/* Settings Drawer */}
      <Drawer
        title="Project Settings"
        placement="right"
        onClose={() => setSettingsDrawerVisible(false)}
        open={settingsDrawerVisible}
        width={400}
      >
        <Form form={settingsForm} layout="vertical">
          <Card title="Physics Settings" size="small" style={{ marginBottom: '16px' }}>
            <Form.Item label="Gravity X" name="gravityX">
              <Input type="number" defaultValue={0} />
            </Form.Item>
            <Form.Item label="Gravity Y" name="gravityY">
              <Input type="number" defaultValue={-9.81} />
            </Form.Item>
            <Form.Item label="Time Step" name="timeStep">
              <Input type="number" defaultValue={1/60} step={0.001} />
            </Form.Item>
          </Card>

          <Card title="Rendering Settings" size="small">
            <Form.Item label="Background Color" name="backgroundColor">
              <Input type="color" defaultValue="#1a1a1a" />
            </Form.Item>
            <Form.Item label="Ambient Light" name="ambientLight">
              <Input type="color" defaultValue="#404040" />
            </Form.Item>
          </Card>
        </Form>
      </Drawer>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <Modal
          title="Asset Preview"
          open={!!previewAsset}
          onCancel={() => setPreviewAsset(null)}
          footer={null}
          width={800}
        >
          <AssetPreview asset={previewAsset} />
        </Modal>
      )}
    </div>
  );
};