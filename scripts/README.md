# Nova Editor Scripts | Nova 编辑器脚本

This directory contains initialization scripts for the Nova Editor project.

本目录包含 Nova 编辑器项目的初始化脚本。

## Scripts Overview | 脚本概述

### Full Initialization Scripts | 完整初始化脚本
These scripts perform complete project setup including submodules, dependencies, and builds:

这些脚本执行完整的项目设置，包括子模块、依赖项和构建：

- **`init-submodules.ps1`** - PowerShell script for Windows | Windows PowerShell 脚本
- **`init-submodules.bat`** - Batch script for Windows | Windows 批处理脚本

### Quick Setup Scripts | 快速设置脚本
These scripts perform basic setup for development:

这些脚本执行基本的开发环境设置：

- **`quick-setup.ps1`** - PowerShell quick setup for Windows | Windows PowerShell 快速设置
- **`quick-setup.bat`** - Batch quick setup for Windows | Windows 批处理快速设置

## Usage | 使用方法

### Windows (PowerShell)
```powershell
# Full initialization | 完整初始化
.\scripts\init-submodules.ps1

# Quick setup | 快速设置
.\scripts\quick-setup.ps1
```

### Windows (Command Prompt | 命令提示符)
```cmd
# Full initialization | 完整初始化
scripts\init-submodules.bat

# Quick setup | 快速设置
scripts\quick-setup.bat
```

## What These Scripts Do | 脚本功能

### Full Initialization (`init-submodules.*`) | 完整初始化
1. Initialize and update git submodules | 初始化并更新 git 子模块
2. Install root project dependencies (`npm install`) | 安装根项目依赖
3. Install dependencies for editor-required packages | 安装编辑器所需包的依赖
4. Build editor-required packages that have build scripts | 构建有构建脚本的编辑器所需包
5. Build the root project | 构建根项目

### Quick Setup (`quick-setup.*`) | 快速设置
1. Initialize and update git submodules | 初始化并更新 git 子模块
2. Install root project dependencies | 安装根项目依赖
3. Build the root project | 构建根项目

## Manual Setup (Alternative) | 手动安装（替代方案）

If you prefer to set up manually:

如果您希望手动设置：

```bash
# Initialize submodules | 初始化子模块
git submodule update --init --recursive

# Install dependencies | 安装依赖
npm install

# Build project | 构建项目
npm run build

# Start development | 启动开发
npm run dev
```

## Package Structure | 包结构

The project uses a monorepo structure with packages managed as git submodules:

项目使用单体仓库结构，包通过 git 子模块管理：

- **Submodules** (7 packages): Managed from external repositories | **子模块**（7个包）：从外部仓库管理
- **Local packages** (4 packages): Local git repositories waiting for remote setup | **本地包**（4个包）：等待远程设置的本地 git 仓库

### Editor Dependencies | 编辑器依赖

The editor currently uses these packages:

编辑器当前使用这些包：

- `nova-ecs` - Core ECS framework | 核心 ECS 框架
- `nova-ecs-math` - Mathematics utilities | 数学工具
- `nova-ecs-physics-box2d` - Box2D physics integration | Box2D 物理集成
- `nova-ecs-physics-core` - Physics core system | 物理核心系统
- `nova-ecs-render-core` - Rendering core system | 渲染核心系统
- `nova-ecs-render-three` - Three.js rendering system | Three.js 渲染系统

## Troubleshooting | 故障排除

If you encounter issues:

如果遇到问题：

1. Ensure Git is installed and configured | 确保 Git 已安装并配置
2. Ensure Node.js and npm are installed | 确保 Node.js 和 npm 已安装
3. Check that you have internet access for submodule updates | 检查您有互联网访问权限以更新子模块
4. Try running scripts as administrator if permission issues occur | 如果出现权限问题，请尝试以管理员身份运行脚本

## Development Workflow | 开发工作流

After setup:

设置完成后：

```bash
npm run dev    # Start development server | 启动开发服务器
npm run build  # Build for production | 生产构建
npm run test   # Run tests | 运行测试
npm run lint   # Lint code | 代码检查
```