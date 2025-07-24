/**
 * Project Start Screen - Entry point for project management
 * 项目启动屏幕 - 项目管理的入口点
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Button,
  List,
  Avatar,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Divider,
  Row,
  Col,
  Tag,
  Empty,
  Tooltip,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  GithubOutlined,
  BookOutlined,
  DeleteOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { projectService, type RecentProject } from '../../services/ProjectService';
import type { ProjectConfig } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface ProjectStartScreenProps {
  onProjectSelected: (projectPath: string, config: ProjectConfig) => void;
  theme: any;
}

const PROJECT_TEMPLATES = [
  {
    id: '2d-game',
    name: '2D Game',
    description: 'Platform games, puzzles, side-scrollers with 2D physics',
    icon: '🎮',
    settings: {
      physics: { gravity: { x: 0, y: -9.8 }, timeStep: 1/60 },
      rendering: { backgroundColor: '#87CEEB', ambientLight: '#FFFFFF' }
    },
    defaultEntities: [
      { name: 'Player', components: ['Transform', 'MeshRenderer', 'BoxCollider', 'RigidBody'] },
      { name: 'Ground', components: ['Transform', 'MeshRenderer', 'BoxCollider'] },
      { name: 'Camera2D', components: ['Transform', 'Camera'] }
    ],
    enabledSystems: ['Physics2D', 'Rendering2D', 'Input', 'Audio'],
    cameraType: 'orthographic',
    recommendedAssets: ['sprites', 'textures', 'audio', 'animations']
  },
  {
    id: '3d-game',
    name: '3D Game',
    description: 'First-person, third-person, or 3D adventure games',
    icon: '🎯',
    settings: {
      physics: { gravity: { x: 0, y: -9.8 }, timeStep: 1/60 },
      rendering: { backgroundColor: '#000000', ambientLight: '#404040' }
    },
    defaultEntities: [
      { name: 'Player', components: ['Transform', 'MeshRenderer', 'BoxCollider', 'RigidBody'] },
      { name: 'Ground', components: ['Transform', 'MeshRenderer', 'BoxCollider'] },
      { name: 'MainCamera', components: ['Transform', 'Camera'] },
      { name: 'DirectionalLight', components: ['Transform', 'Light'] }
    ],
    enabledSystems: ['Physics3D', 'Rendering3D', 'Lighting', 'Input', 'Audio'],
    cameraType: 'perspective',
    recommendedAssets: ['meshes', 'materials', 'textures', 'audio', 'animations']
  },
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Minimal setup for custom projects',
    icon: '📄',
    settings: {
      physics: { gravity: { x: 0, y: 0 }, timeStep: 1/60 },
      rendering: { backgroundColor: '#F0F0F0', ambientLight: '#FFFFFF' }
    },
    defaultEntities: [
      { name: 'MainCamera', components: ['Transform', 'Camera'] }
    ],
    enabledSystems: ['Core'],
    cameraType: 'perspective',
    recommendedAssets: []
  }
];

export const ProjectStartScreen: React.FC<ProjectStartScreenProps> = ({
  onProjectSelected,
  theme
}) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [form] = Form.useForm();
  const [previewPath, setPreviewPath] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadRecentProjects();
  }, []);

  // Update preview path when selectedPath changes
  useEffect(() => {
    if (selectedPath) {
      setPreviewPath(selectedPath);
    } else {
      setPreviewPath('Please select a location');
    }
  }, [selectedPath]);

  const loadRecentProjects = async () => {
    try {
      const projects = await projectService.getRecentProjects();
      setRecentProjects(projects);
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  };

  const handleSelectPath = async () => {
    try {
      const path = await projectService.selectDirectory();
      
      if (path) {
        setSelectedPath(path);
        form.setFieldsValue({ path });
        // Update preview path immediately
        const name = form.getFieldValue('name');
        const createFolder = form.getFieldValue('createFolder');
        
        if (createFolder && name) {
          setPreviewPath(`${path}/${name}`);
        } else {
          setPreviewPath(path);
        }
      }
    } catch (error) {
      console.error('Failed to select path:', error);
      // Show user-friendly error message
      alert('Failed to select folder. Please try again or enter the path manually.');
    }
  };

  const handleCreateProject = async (values: any) => {
    try {
      setLoading(true);
      const template = PROJECT_TEMPLATES.find(t => t.id === values.template);
      
      // Determine final project path
      let finalPath = values.path;
      if (values.createFolder) {
        // If creating a folder, append project name to the path
        finalPath = `${values.path}/${values.name}`;
      }
      
      const projectConfig: ProjectConfig = {
        name: values.name,
        version: values.version || '1.0.0',
        description: values.description || '',
        author: values.author || '',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        settings: {
          defaultScene: 'main',
          physics: template?.settings.physics || { gravity: { x: 0, y: 0 }, timeStep: 1/60 },
          rendering: template?.settings.rendering || { backgroundColor: '#F0F0F0', ambientLight: '#FFFFFF' }
        }
      };

      const projectPath = await projectService.createProject(finalPath, projectConfig, template);
      setCreateModalVisible(false);
      form.resetFields();
      setSelectedPath('');
      setPreviewPath('');
      setSelectedTemplate('');
      onProjectSelected(projectPath, projectConfig);
    } catch (error) {
      console.error('Failed to create project:', error);
      // In a real app, you'd show a proper error message
      alert(`Failed to create project: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async () => {
    try {
      const result = await projectService.openProject();
      if (result) {
        onProjectSelected(result.path, result.config);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const handleOpenRecentProject = async (project: RecentProject) => {
    try {
      const result = await projectService.openProjectByPath(project.path);
      if (result) {
        onProjectSelected(result.path, result.config);
      }
    } catch (error) {
      console.error('Failed to open recent project:', error);
      // Remove invalid project from recent list
      await projectService.removeFromRecentProjects(project.path);
      loadRecentProjects();
    }
  };

  const handleRemoveRecentProject = async (projectPath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await projectService.removeFromRecentProjects(projectPath);
      loadRecentProjects();
    } catch (error) {
      console.error('Failed to remove project from recent list:', error);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: theme.colors.background }}>
      <Content style={{ padding: '40px', background: theme.colors.background }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title
            level={1}
            style={{
              color: theme.colors.text,
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Nova Editor
          </Title>
          <Paragraph style={{ color: theme.colors.textSecondary, fontSize: '16px' }}>
            Next-generation visual editor for NovaECS game framework
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {/* Quick Actions */}
          <Col xs={24} lg={8}>
            <Card
              title="Quick Start"
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`
              }}
              styles={{
                header: { color: theme.colors.text, borderBottom: `1px solid ${theme.colors.border}` },
                body: { color: theme.colors.text }
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => setCreateModalVisible(true)}
                >
                  Create New Project
                </Button>
                
                <Button
                  size="large"
                  icon={<FolderOpenOutlined />}
                  block
                  onClick={handleOpenProject}
                >
                  Open Project File
                </Button>

                <Divider style={{ borderColor: theme.colors.border }} />

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Quick Links</Text>
                  <Button type="link" icon={<BookOutlined />} style={{ padding: 0, height: 'auto' }}>
                    Documentation
                  </Button>
                  <Button type="link" icon={<GithubOutlined />} style={{ padding: 0, height: 'auto' }}>
                    GitHub Repository
                  </Button>
                  <Button type="link" icon={<SettingOutlined />} style={{ padding: 0, height: 'auto' }}>
                    Settings
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Recent Projects */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  Recent Projects
                </Space>
              }
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                minHeight: '400px'
              }}
              styles={{
                header: { color: theme.colors.text, borderBottom: `1px solid ${theme.colors.border}` },
                body: { color: theme.colors.text }
              }}
            >
              {recentProjects.length > 0 ? (
                <List
                  dataSource={recentProjects}
                  renderItem={(project) => (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        padding: '16px 0'
                      }}
                      onClick={() => handleOpenRecentProject(project)}
                      actions={[
                        <Tooltip title="Remove from recent">
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={(e) => handleRemoveRecentProject(project.path, e)}
                            style={{ color: theme.colors.textSecondary }}
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<ProjectOutlined />}
                            style={{
                              backgroundColor: theme.colors.primary,
                              color: '#ffffff'
                            }}
                          />
                        }
                        title={
                          <Space>
                            <Text style={{ color: theme.colors.text, fontSize: '16px' }}>
                              {project.name}
                            </Text>
                            {project.version && (
                              <Tag color="blue">{project.version}</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text style={{ color: theme.colors.textSecondary }}>
                              {project.description || 'No description'}
                            </Text>
                            <Text
                              style={{ color: theme.colors.textSecondary, fontSize: '12px' }}
                              title={project.path}
                            >
                              {project.path.length > 60 
                                ? `...${project.path.slice(-60)}` 
                                : project.path
                              }
                            </Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                              Last opened: {new Date(project.lastOpened).toLocaleDateString()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description={
                    <span style={{ color: theme.colors.textSecondary }}>
                      No recent projects found
                    </span>
                  }
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Create Project Modal */}
        <Modal
          title="Create New Project"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
            setSelectedPath('');
            setPreviewPath('');
            setSelectedTemplate('');
          }}
          onOk={() => form.submit()}
          confirmLoading={loading}
          width={600}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateProject}
            onValuesChange={(_, allValues) => {
              // Update preview path when form values change
              const name = allValues.name;
              const createFolder = allValues.createFolder;
              
              if (selectedPath) {
                if (createFolder && name) {
                  setPreviewPath(`${selectedPath}/${name}`);
                } else {
                  setPreviewPath(selectedPath);
                }
              }
            }}
          >
            <Form.Item
              name="name"
              label="Project Name"
              rules={[
                { required: true, message: 'Please enter project name' },
                { 
                  pattern: /^[a-zA-Z0-9_\- ]+$/, 
                  message: 'Project name can only contain letters, numbers, spaces, hyphens and underscores' 
                },
                { min: 1, max: 50, message: 'Project name must be between 1 and 50 characters' }
              ]}
            >
              <Input placeholder="My Awesome Game" />
            </Form.Item>

            <Form.Item
              name="path"
              label={
                <Space>
                  Project Location
                  <Text style={{ color: theme.colors.textSecondary, fontSize: '12px', fontWeight: 'normal' }}>
                    (Choose a folder on your computer)
                  </Text>
                </Space>
              }
              rules={[{ required: true, message: 'Please select project location' }]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  style={{ width: 'calc(100% - 100px)' }}
                  placeholder="Click Browse to select folder"
                  value={selectedPath}
                  readOnly
                />
                <Button
                  type="default"
                  style={{ width: '100px' }}
                  icon={<FolderOutlined />}
                  onClick={handleSelectPath}
                >
                  Browse
                </Button>
              </Space.Compact>
            </Form.Item>
            
            <div style={{ marginTop: '-16px', marginBottom: '16px' }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: '11px' }}>
                💡 Select an existing folder on your computer where the project will be created
                {!('showDirectoryPicker' in window) && (
                  <span style={{ color: theme.colors.warning }}>
                    {' '}(Note: Advanced folder picker requires Chrome 86+ or Edge 86+)
                  </span>
                )}
              </Text>
            </div>

            <Form.Item
              name="createFolder"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox defaultChecked>
                <Text style={{ color: theme.colors.text }}>
                  Create project folder (recommended)
                </Text>
              </Checkbox>
            </Form.Item>

            <div style={{ 
              background: theme.colors.surface, 
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                📁 Project will be created at: {previewPath}
              </Text>
            </div>

            <Form.Item
              name="template"
              label="Project Template"
              rules={[{ required: true, message: 'Please select a template' }]}
            >
              <Select 
                placeholder="Select a template" 
                size="large"
                style={{ width: '100%' }}
                onChange={(value) => setSelectedTemplate(value)}
              >
                {PROJECT_TEMPLATES.map(template => (
                  <Option key={template.id} value={template.id}>
                    <Space>
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {/* Template Details - Outside Form.Item */}
            {selectedTemplate && (() => {
              const template = PROJECT_TEMPLATES.find(t => t.id === selectedTemplate);
              if (!template) return null;
              
              return (
                <div style={{
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: '12px',
                  minHeight: '120px',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{template.icon}</span>
                    <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: '14px' }}>
                      {template.name}
                    </Text>
                  </div>
                  <Text style={{ 
                    color: theme.colors.textSecondary, 
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '12px' 
                  }}>
                    {template.description}
                  </Text>
                  <div style={{ fontSize: '11px', color: theme.colors.textSecondary, lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>🎯 Default Entities:</strong> {template.defaultEntities?.map(e => e.name).join(', ')}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>⚡ Enabled Systems:</strong> {template.enabledSystems?.join(', ')}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>📷 Camera Type:</strong> {template.cameraType}
                    </div>
                    <div>
                      <strong>📁 Asset Folders:</strong> {template.recommendedAssets?.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="author" label="Author">
                  <Input placeholder="Your Name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="version" label="Version" initialValue="1.0.0">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Describe your project..." />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ProjectStartScreen;