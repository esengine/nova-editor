# PowerShell script to initialize submodules and run build

Write-Host "Nova Editor Project Initialization" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Change to project root directory first
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Push-Location $rootDir

Write-Host "Working from root directory: $((Get-Location).Path)" -ForegroundColor Gray

# Initialize and update submodules
Write-Host "Initializing submodules..." -ForegroundColor Yellow
try {
    git submodule update --init --recursive
    Write-Host "Submodules initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to initialize submodules: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Root dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "Failed to install root dependencies: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""

# Process packages (install dependencies and build)
Write-Host "Processing editor-required packages..." -ForegroundColor Yellow

# Verify submodules are actually initialized
Write-Host "Verifying submodule initialization..." -ForegroundColor Gray
$submoduleStatus = git submodule status
Write-Host "Submodule status:" -ForegroundColor Gray
Write-Host $submoduleStatus -ForegroundColor Gray
Write-Host ""

$packages = @("nova-ecs", "nova-ecs-math", "nova-ecs-physics-core", "nova-ecs-physics-box2d", "nova-ecs-render-core", "nova-ecs-render-three")

foreach ($package in $packages) {
    Write-Host "=" * 60 -ForegroundColor DarkGray
    Write-Host "PROCESSING PACKAGE: $package" -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor DarkGray
    
    $packagePath = "packages\$package"
    $packageJsonPath = "$packagePath\package.json"
    
    Write-Host "[DEBUG] Current working directory: $((Get-Location).Path)" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Package path: $packagePath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Package.json path: $packageJsonPath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Full package.json path: $((Get-Location).Path)\$packageJsonPath" -ForegroundColor DarkGray
    
    # Check if directory exists first
    Write-Host "[CHECK] Testing if directory exists..." -ForegroundColor Gray
    if (-not (Test-Path $packagePath)) {
        Write-Host "[ERROR] Directory $packagePath does not exist!" -ForegroundColor Red
        Write-Host "[INFO] Available directories in packages/:" -ForegroundColor Gray
        if (Test-Path "packages") {
            Get-ChildItem "packages" -Directory | ForEach-Object { 
                Write-Host "  - $($_.Name)" -ForegroundColor Gray 
            }
        } else {
            Write-Host "  packages/ directory not found!" -ForegroundColor Red
        }
        continue
    }
    Write-Host "[SUCCESS] Directory $packagePath exists" -ForegroundColor Green
    
    # List contents of package directory for debugging
    Write-Host "[DEBUG] Contents of ${packagePath}:" -ForegroundColor DarkGray
    try {
        Get-ChildItem $packagePath | ForEach-Object { 
            $type = if ($_.PSIsContainer) { "DIR " } else { "FILE" }
            Write-Host "  [$type] $($_.Name)" -ForegroundColor DarkGray 
        }
    } catch {
        Write-Host "[ERROR] Failed to list directory contents: $_" -ForegroundColor Red
    }
    
    # Check if package.json exists
    Write-Host "[CHECK] Testing if package.json exists..." -ForegroundColor Gray
    if (Test-Path $packageJsonPath) {
        Write-Host "[SUCCESS] package.json found!" -ForegroundColor Green
        Write-Host "[INFO] Processing ${package}..." -ForegroundColor Cyan
        
        try {
            # Enter package directory
            Write-Host "[ACTION] Entering directory: $packagePath" -ForegroundColor White
            Push-Location $packagePath
            Write-Host "[DEBUG] New working directory: $((Get-Location).Path)" -ForegroundColor DarkGray
            
            # Verify we can read package.json
            Write-Host "[CHECK] Reading package.json..." -ForegroundColor Gray
            try {
                $packageJsonContent = Get-Content package.json -Raw | ConvertFrom-Json
                Write-Host "[SUCCESS] Package name: $($packageJsonContent.name)" -ForegroundColor Green
                Write-Host "[SUCCESS] Package version: $($packageJsonContent.version)" -ForegroundColor Green
            } catch {
                Write-Host "[WARNING] Could not parse package.json: $_" -ForegroundColor Yellow
            }
            
            # Install dependencies
            Write-Host "[ACTION] Installing dependencies..." -ForegroundColor White
            Write-Host "[CMD] Running: npm install" -ForegroundColor Magenta
            $installResult = npm install 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] Dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] npm install failed with exit code: $LASTEXITCODE" -ForegroundColor Red
                Write-Host "[OUTPUT] $installResult" -ForegroundColor Red
            }
            
            # Build if build script exists
            Write-Host "[CHECK] Checking for build script..." -ForegroundColor Gray
            if (Get-Content package.json | Select-String '"build"') {
                Write-Host "[SUCCESS] Build script found!" -ForegroundColor Green
                Write-Host "[ACTION] Building..." -ForegroundColor White
                Write-Host "[CMD] Running: npm run build" -ForegroundColor Magenta
                $buildResult = npm run build 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[SUCCESS] ${package} built successfully!" -ForegroundColor Green
                    
                    # Check if dist directory was created
                    if (Test-Path "dist") {
                        Write-Host "[SUCCESS] dist/ directory created" -ForegroundColor Green
                        Write-Host "[INFO] dist/ contents:" -ForegroundColor Gray
                        Get-ChildItem "dist" | ForEach-Object { 
                            Write-Host "  - $($_.Name)" -ForegroundColor Gray 
                        }
                    } else {
                        Write-Host "[WARNING] No dist/ directory found after build" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "[ERROR] npm run build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
                    Write-Host "[OUTPUT] $buildResult" -ForegroundColor Red
                }
            } else {
                Write-Host "[INFO] No build script found in package.json" -ForegroundColor Yellow
                Write-Host "[SUCCESS] ${package} dependencies installed (no build needed)" -ForegroundColor Green
            }
            
            # Return to root directory
            Write-Host "[ACTION] Returning to root directory..." -ForegroundColor White
            Pop-Location
            Write-Host "[DEBUG] Back to: $((Get-Location).Path)" -ForegroundColor DarkGray
            
        } catch {
            Write-Host "[ERROR] Exception occurred while processing ${package}:" -ForegroundColor Red
            Write-Host "[ERROR] $_" -ForegroundColor Red
            Write-Host "[ACTION] Attempting to return to root directory..." -ForegroundColor White
            Pop-Location
        }
    } else {
        Write-Host "[ERROR] No package.json found at: $packageJsonPath" -ForegroundColor Red
        Write-Host "[DEBUG] Attempted full path: $((Get-Location).Path)\$packageJsonPath" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host ""

# Build root project
Write-Host "Building root project..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "Root project built successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to build root project: $_" -ForegroundColor Red
}

# Return to original directory
Pop-Location

Write-Host ""
Write-Host "Initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host "  - Check package builds in packages/[package]/dist/" -ForegroundColor White
Write-Host ""