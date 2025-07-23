# PowerShell script to initialize submodules and run build

Write-Host "Nova Editor Project Initialization" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Function to find the correct npm command
function Get-NpmCommand {
    # Try different possible npm locations
    $npmCommands = @("npm", "npm.cmd", "npm.exe")
    
    foreach ($npmCmd in $npmCommands) {
        try {
            $null = Get-Command $npmCmd -ErrorAction Stop
            Write-Host "[DEBUG] Found npm command: $npmCmd" -ForegroundColor DarkGray
            return $npmCmd
        } catch {
            # Continue trying other commands
        }
    }
    
    # If we can't find npm, try to locate it in common paths
    $commonPaths = @(
        "$env:ProgramFiles\nodejs\npm.cmd",
        "$env:ProgramFiles(x86)\nodejs\npm.cmd",
        "$env:APPDATA\npm\npm.cmd"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host "[DEBUG] Found npm at: $path" -ForegroundColor DarkGray
            return $path
        }
    }
    
    Write-Host "[ERROR] npm command not found! Please ensure Node.js is installed and npm is in PATH." -ForegroundColor Red
    return $null
}

# Function to run npm commands with better output
function Invoke-NpmWithProgress {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$Description
    )
    
    Write-Host "[CMD] Running: $Command $($Arguments -join ' ')" -ForegroundColor Magenta
    Write-Host "[INFO] $Description" -ForegroundColor Cyan
    
    # Find the correct npm command
    if ($Command -eq "npm") {
        $actualCommand = Get-NpmCommand
        if (-not $actualCommand) {
            return $null, 1
        }
    } else {
        $actualCommand = $Command
    }
    
    Write-Host "[PROGRESS] Executing command with: $actualCommand" -ForegroundColor Yellow
    Write-Host "" # Add spacing for better readability
    
    $startTime = Get-Date
    
    # Use simpler approach - call the command directly
    try {
        # Use cmd.exe to ensure npm.cmd works properly on Windows
        if ($actualCommand.EndsWith('.cmd')) {
            $fullArgs = @('/c', $actualCommand) + $Arguments
            & cmd @fullArgs
        } else {
            & $actualCommand @Arguments
        }
        
        $exitCode = $LASTEXITCODE
        $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
        
        Write-Host "" # Add spacing
        Write-Host "[DEBUG] Command finished with exit code: $exitCode" -ForegroundColor DarkGray
        
        # Ensure exitCode is a proper integer
        if ($exitCode -eq $null) {
            $exitCode = 0
        }
        
        # Convert to integer if it's not already
        try {
            $exitCode = [int]$exitCode
        } catch {
            # If conversion fails, assume success if LASTEXITCODE was 0 or null
            $exitCode = 0
        }
        
        if ($exitCode -eq 0) {
            Write-Host "[PROGRESS] [SUCCESS] Completed in ${elapsed}s!" -ForegroundColor Green
        } else {
            Write-Host "[PROGRESS] [ERROR] Failed in ${elapsed}s (exit code: $exitCode)" -ForegroundColor Red
        }
        
        return $null, $exitCode
        
    } catch {
        $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
        Write-Host "" # Add spacing
        Write-Host "[PROGRESS] [ERROR] Exception after ${elapsed}s: $_" -ForegroundColor Red
        return $null, 1
    }
}

# Change to project root directory first
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Push-Location $rootDir

Write-Host "Working from root directory: $((Get-Location).Path)" -ForegroundColor Gray

# Check prerequisites
Write-Host ""
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if git is available
try {
    $gitVersion = git --version 2>$null
    Write-Host "[OK] Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git not found! Please install Git first." -ForegroundColor Red
    Pop-Location
    exit 1
}

# Check if npm is available
$npmCommand = Get-NpmCommand
if (-not $npmCommand) {
    Write-Host "[ERROR] Node.js/npm not found! Please install Node.js first." -ForegroundColor Red
    Write-Host "[INFO] Download from: https://nodejs.org/" -ForegroundColor Cyan
    Pop-Location
    exit 1
} else {
    try {
        if ($npmCommand.EndsWith('.cmd')) {
            $npmVersion = & cmd /c $npmCommand --version
        } else {
            $npmVersion = & $npmCommand --version
        }
        Write-Host "[OK] npm found: v$npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] npm found but version check failed" -ForegroundColor Yellow
    }
}

Write-Host "[OK] All prerequisites satisfied!" -ForegroundColor Green

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
    $result, $exitCode = Invoke-NpmWithProgress -Command "npm" -Arguments @("install") -Description "Installing dependencies for root project..."
    Write-Host "[DEBUG] npm install exit code: $exitCode" -ForegroundColor DarkGray
    # Check if exitCode is actually a number
    if ($exitCode -is [int] -and $exitCode -eq 0) {
        Write-Host "[SUCCESS] Root dependencies installed" -ForegroundColor Green
    } elseif ($exitCode -is [int] -and $exitCode -ne 0) {
        Write-Host "[ERROR] Failed to install root dependencies (exit code: $exitCode)" -ForegroundColor Red
        Pop-Location
        exit 1
    } else {
        # If exitCode is not a number, assume success if it contains typical npm success output
        if ([string]$exitCode -match "added \d+ packages" -or [string]$exitCode -match "audited \d+ packages") {
            Write-Host "[SUCCESS] Root dependencies installed (npm completed successfully)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to install root dependencies (unexpected output: $exitCode)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
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
            try {
                $result, $exitCode = Invoke-NpmWithProgress -Command "npm" -Arguments @("install") -Description "Installing dependencies for $package..."
                # Check if exitCode is actually a number
                if ($exitCode -is [int] -and $exitCode -eq 0) {
                    Write-Host "[SUCCESS] Dependencies installed successfully" -ForegroundColor Green
                } elseif ($exitCode -is [int] -and $exitCode -ne 0) {
                    Write-Host "[ERROR] npm install failed with exit code: $exitCode" -ForegroundColor Red
                } else {
                    # If exitCode is not a number, assume success if it contains typical npm success output
                    if ([string]$exitCode -match "added \d+ packages" -or [string]$exitCode -match "audited \d+ packages" -or [string]$exitCode -match "up to date") {
                        Write-Host "[SUCCESS] Dependencies installed successfully (npm completed)" -ForegroundColor Green
                    } else {
                        Write-Host "[ERROR] npm install failed with unexpected output: $exitCode" -ForegroundColor Red
                    }
                }
            } catch {
                Write-Host "[ERROR] npm install failed: $_" -ForegroundColor Red
            }
            
            # Build if build script exists
            Write-Host "[CHECK] Checking for build script..." -ForegroundColor Gray
            if (Get-Content package.json | Select-String '"build"') {
                Write-Host "[SUCCESS] Build script found!" -ForegroundColor Green
                Write-Host "[ACTION] Building..." -ForegroundColor White
                try {
                    $result, $exitCode = Invoke-NpmWithProgress -Command "npm" -Arguments @("run", "build") -Description "Building $package..."
                    # Check if exitCode is actually a number
                    if ($exitCode -is [int] -and $exitCode -eq 0) {
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
                    } elseif ($exitCode -is [int] -and $exitCode -ne 0) {
                        Write-Host "[ERROR] npm run build failed with exit code: $exitCode" -ForegroundColor Red
                    } else {
                        # If exitCode is not a number, try to determine success from output
                        if ([string]$exitCode -match "webpack.*compiled successfully" -or [string]$exitCode -match "build.*completed" -or [string]$exitCode -match "tsc.*compiled") {
                            Write-Host "[SUCCESS] ${package} built successfully (build completed)!" -ForegroundColor Green
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
                            Write-Host "[ERROR] npm run build failed with unexpected output: $exitCode" -ForegroundColor Red
                        }
                    }
                } catch {
                    Write-Host "[ERROR] npm run build failed: $_" -ForegroundColor Red
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
    $result, $exitCode = Invoke-NpmWithProgress -Command "npm" -Arguments @("run", "build") -Description "Building root project..."
    # Check if exitCode is actually a number
    if ($exitCode -is [int] -and $exitCode -eq 0) {
        Write-Host "[SUCCESS] Root project built successfully" -ForegroundColor Green
    } elseif ($exitCode -is [int] -and $exitCode -ne 0) {
        Write-Host "[ERROR] Failed to build root project with exit code: $exitCode" -ForegroundColor Red
    } else {
        # If exitCode is not a number, assume success if it contains typical build success output
        if ([string]$exitCode -match "webpack.*compiled successfully" -or [string]$exitCode -match "build.*completed" -or [string]$exitCode -match "vite.*built" -or [string]$exitCode -match "dist.*generated") {
            Write-Host "[SUCCESS] Root project built successfully (build completed)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to build root project with unexpected output: $exitCode" -ForegroundColor Red
        }
    }
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