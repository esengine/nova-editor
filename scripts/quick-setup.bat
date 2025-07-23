@echo off
REM Quick setup script for Nova Editor
REM 快速设置脚本

echo ⚡ Nova Editor Quick Setup
echo.

REM Initialize submodules
echo 📦 Initializing submodules...
git submodule update --init --recursive

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Try to build
echo 🔨 Building project...
call npm run build

echo.
echo ✅ Quick setup complete!
echo Run 'npm run dev' to start development

pause