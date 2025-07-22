# Nova Editor

<div align="center">

![Nova Editor Logo](https://img.shields.io/badge/Nova-Editor-blue?style=for-the-badge&logo=react)

**Next-generation visual editor for NovaECS game framework**  
**下一代NovaECS游戏框架可视化编辑器**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-blue.svg)](https://reactjs.org/)
[![NovaECS](https://img.shields.io/badge/NovaECS-1.0.11-green.svg)](https://github.com/esengine/NovaECS)

[English](#english) | [中文](#中文)

</div>

---

## English

### ✨ Features

- 🎨 **Modern UI**: Built with Ant Design and React 18, featuring a dark theme optimized for game development
- 🏗️ **Modular Architecture**: Clean separation of concerns with TypeScript for maximum maintainability
- 🎮 **3D Scene Editor**: Integrated Three.js viewport with intuitive camera controls and gizmo manipulation
- 📝 **Code Editor**: Monaco Editor with full TypeScript support, IntelliSense, and syntax highlighting
- 🔧 **Component Inspector**: Visual component editing with real-time property updates and type-safe validation
- 📁 **Asset Management**: Comprehensive asset browser with drag-and-drop import and preview capabilities
- 🎯 **ECS Integration**: Seamless integration with NovaECS framework for entity-component-system development
- ⚡ **Real-time Updates**: Live synchronization between editor UI and game world state
- 🔄 **Undo/Redo System**: Complete command history with granular operation tracking
- 🎨 **Customizable Layout**: Draggable and resizable panels with persistent workspace configuration

### 🚀 Quick Start

#### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0

#### Installation

```bash
# Clone the repository
git clone https://github.com/esengine/nova-editor.git
cd nova-editor

# Install dependencies
npm install

# Start development server
npm run dev
```

The editor will open at `http://localhost:3000`

#### Development Scripts

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Generate documentation
npm run docs
```

### 🏗️ Architecture

```
Nova Editor
├── Core (核心层)
│   ├── EditorWorld - Extended NovaECS World
│   ├── EditorEvents - Event system integration
│   └── EditorStoreIntegration - State synchronization
├── Editor Panels (编辑器面板)
│   ├── HierarchyPanel - Entity tree view
│   ├── InspectorPanel - Component property editor
│   ├── SceneViewPanel - 3D viewport
│   └── AssetBrowserPanel - Asset management
├── Render System (渲染系统)
│   ├── Three.js Integration - 3D scene rendering
│   ├── Gizmo System - Transform manipulation
│   └── Debug Visualizer - Development aids
├── State Management (状态管理)
│   ├── Zustand Store - Global editor state
│   ├── Immer Integration - Immutable updates
│   └── Real-time Sync - ECS world synchronization
└── Extensions (扩展系统)
    ├── Plugin Architecture - Extensible functionality
    ├── Custom Components - User-defined components
    └── Theme System - Customizable appearance
```

### 🛠️ Technology Stack

#### Core Framework
- **React 18** - Modern React with Concurrent Features and Suspense
- **TypeScript 5.5** - Type-safe development with strict mode enabled
- **Vite 5** - Fast build tool with SWC for optimal performance

#### UI & Components
- **Ant Design 5** - Enterprise-class UI design language with dark theme
- **React DnD** - Drag and drop functionality for intuitive interactions
- **React Grid Layout** - Draggable and resizable panel system

#### State Management
- **Zustand** - Lightweight state management with TypeScript support
- **Immer** - Immutable state updates with structural sharing

#### 3D Graphics & Rendering
- **Three.js** - Industry-standard 3D graphics library
- **React Three Fiber** - React renderer for Three.js with declarative API
- **React Three Drei** - Useful helpers and abstractions

#### Code Editor
- **Monaco Editor** - VS Code editor experience in the browser
- **Prism.js** - Syntax highlighting for various languages

#### ECS Integration
- **NovaECS** - High-performance Entity-Component-System framework
- **Custom EditorWorld** - Extended World class with editor-specific features

#### Testing & Quality
- **Vitest** - Fast unit test framework with native TypeScript support
- **React Testing Library** - Simple and complete testing utilities
- **ESLint + Prettier** - Code quality and formatting

### 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── panels/         # Editor panel components
├── ecs/                # NovaECS integration
│   ├── EditorWorld.ts  # Extended World class
│   ├── EditorEvents.ts # Event system
│   └── EditorStoreIntegration.ts
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test utilities and setup
```

### 🎯 Current Features

#### ✅ Implemented
- [x] **HierarchyPanel** - Entity tree view with search and selection
- [x] **InspectorPanel** - Component property editor with type-safe inputs
- [x] **SceneViewPanel** - Basic 3D viewport with Three.js integration
- [x] **EditorWorld** - Extended NovaECS World with editor features
- [x] **State Management** - Zustand store with Immer integration
- [x] **Real-time Sync** - Bidirectional synchronization between UI and ECS
- [x] **Dark Theme** - Professional dark theme optimized for development

#### 🚧 In Development
- [ ] **Gizmo System** - 3D transform manipulation handles
- [ ] **Asset Browser** - File management and import system
- [ ] **Undo/Redo** - Command pattern implementation
- [ ] **Plugin System** - Extensible architecture for custom tools

#### 📋 Planned
- [ ] **Physics Debug** - Visual physics debugging tools
- [ ] **Animation Editor** - Timeline-based animation system
- [ ] **Material Editor** - Visual shader and material editing
- [ ] **Build System** - Project packaging and deployment

### 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

#### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run quality checks: `npm run lint && npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### 📖 Documentation

- [API Documentation](https://esengine.github.io/nova-editor/) - Complete API reference
- [User Guide](docs/user-guide.md) - How to use the editor
- [Developer Guide](docs/developer-guide.md) - How to extend the editor
- [Architecture Guide](docs/architecture.md) - Technical architecture details

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🔗 Related Projects

- [NovaECS](https://github.com/esengine/NovaECS) - Core ECS framework
- [NovaECS Math](https://github.com/esengine/nova-ecs-math) - Mathematics library
- [NovaECS Physics](https://github.com/esengine/nova-ecs-physics-core) - Physics engine
- [NovaECS Render](https://github.com/esengine/nova-ecs-render-core) - Rendering system

---

## 中文

### ✨ 特性

- 🎨 **现代化UI**: 基于Ant Design和React 18构建，采用为游戏开发优化的深色主题
- 🏗️ **模块化架构**: TypeScript实现的清晰关注点分离，确保最大可维护性
- 🎮 **3D场景编辑器**: 集成Three.js视口，具有直观的相机控制和操作手柄
- 📝 **代码编辑器**: Monaco编辑器，完整的TypeScript支持、智能感知和语法高亮
- 🔧 **组件检查器**: 可视化组件编辑，实时属性更新和类型安全验证
- 📁 **资源管理**: 全面的资源浏览器，支持拖拽导入和预览功能
- 🎯 **ECS集成**: 与NovaECS框架无缝集成，支持实体-组件-系统开发
- ⚡ **实时更新**: 编辑器UI与游戏世界状态的实时同步
- 🔄 **撤销/重做系统**: 完整的命令历史记录和细粒度操作跟踪
- 🎨 **可定制布局**: 可拖拽和调整大小的面板，持久化工作区配置

### 🚀 快速开始

#### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0

#### 安装

```bash
# 克隆仓库
git clone https://github.com/esengine/nova-editor.git
cd nova-editor

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

编辑器将在 `http://localhost:3000` 打开

### 💬 支持

如果您在使用过程中遇到问题，请：

1. 查看 [文档](https://esengine.github.io/nova-editor/)
2. 搜索已有的 [Issues](https://github.com/esengine/nova-editor/issues)
3. 创建新的 Issue 描述您的问题

### 🙏 致谢

感谢所有为Nova Editor项目做出贡献的开发者和社区成员。

---

<div align="center">

**Built with ❤️ by the esengine team**

</div>
