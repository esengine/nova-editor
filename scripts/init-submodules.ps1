# PowerShell script to initialize submodules and run build
# Nova Editor项目初始化脚本

Write-Host "🚀 Nova Editor Project Initialization" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Initialize and update submodules
Write-Host "📦 Initializing submodules..." -ForegroundColor Yellow
try {
    git submodule update --init --recursive
    Write-Host "✅ Submodules initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to initialize submodules: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install root dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install package dependencies (editor required packages only)
Write-Host "📦 Installing editor-required package dependencies..." -ForegroundColor Yellow
$packages = @("nova-ecs", "nova-ecs-math", "nova-ecs-physics-core", "nova-ecs-physics-box2d", "nova-ecs-render-core", "nova-ecs-render-three")

foreach ($package in $packages) {
    $packagePath = "packages/$package"
    if (Test-Path "$packagePath/package.json") {
        Write-Host "  Installing $package dependencies..." -ForegroundColor Cyan
        try {
            Push-Location $packagePath
            npm install
            Pop-Location
            Write-Host "  ✅ $package dependencies installed" -ForegroundColor Green
        } catch {
            Pop-Location
            Write-Host "  ⚠️ Failed to install $package dependencies: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️ No package.json found for $package" -ForegroundColor Yellow
    }
}

# Install local git repo dependencies
$localRepos = @("nova-ecs-animation", "nova-ecs-audio-web", "nova-ecs-input-core", "nova-ecs-ui")

foreach ($repo in $localRepos) {
    $repoPath = "packages/$repo"
    if (Test-Path "$repoPath/package.json") {
        Write-Host "  Installing $repo dependencies..." -ForegroundColor Cyan
        try {
            Push-Location $repoPath
            npm install
            Pop-Location
            Write-Host "  ✅ $repo dependencies installed" -ForegroundColor Green
        } catch {
            Pop-Location
            Write-Host "  ⚠️ Failed to install $repo dependencies: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Build packages (editor required packages only)
Write-Host "🔨 Building editor-required packages..." -ForegroundColor Yellow

foreach ($package in $packages) {
    $packagePath = "packages/$package"
    if (Test-Path "$packagePath/package.json") {
        Write-Host "  Building $package..." -ForegroundColor Cyan
        try {
            Push-Location $packagePath
            if (Get-Content package.json | Select-String '"build"') {
                npm run build
                Write-Host "  ✅ $package built successfully" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ No build script found for $package" -ForegroundColor Yellow
            }
            Pop-Location
        } catch {
            Pop-Location
            Write-Host "  ⚠️ Failed to build $package: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Build root project
Write-Host "🔨 Building root project..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Root project built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build root project: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  • Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host "  • Check package builds in packages/*/dist/" -ForegroundColor White
Write-Host ""