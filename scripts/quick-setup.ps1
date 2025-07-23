# Quick setup script for Nova Editor
# 快速设置脚本

Write-Host "⚡ Nova Editor Quick Setup" -ForegroundColor Green
Write-Host ""

# Initialize submodules
Write-Host "📦 Initializing submodules..." -ForegroundColor Yellow
git submodule update --init --recursive

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Try to build
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✅ Quick setup complete!" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start development" -ForegroundColor Cyan