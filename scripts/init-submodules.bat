@echo off
REM Batch script to initialize submodules and run build
REM Nova Editor项目初始化脚本

echo.
echo 🚀 Nova Editor Project Initialization
echo =====================================
echo.

REM Initialize and update submodules
echo 📦 Initializing submodules...
git submodule update --init --recursive
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to initialize submodules
    exit /b 1
)
echo ✅ Submodules initialized successfully
echo.

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install root dependencies
    exit /b 1
)
echo ✅ Root dependencies installed
echo.

REM Install package dependencies (editor required packages only)
echo 📦 Installing editor-required package dependencies...

REM Editor required packages
for %%p in (nova-ecs nova-ecs-math nova-ecs-physics-core nova-ecs-physics-box2d nova-ecs-render-core nova-ecs-render-three) do (
    if exist "packages\%%p\package.json" (
        echo   Installing %%p dependencies...
        pushd packages\%%p
        call npm install
        if %ERRORLEVEL% neq 0 (
            echo   ⚠️ Failed to install %%p dependencies
        ) else (
            echo   ✅ %%p dependencies installed
        )
        popd
    ) else (
        echo   ⚠️ No package.json found for %%p
    )
)

REM Local git repo packages
for %%r in (nova-ecs-animation nova-ecs-audio-web nova-ecs-input-core nova-ecs-ui) do (
    if exist "packages\%%r\package.json" (
        echo   Installing %%r dependencies...
        pushd packages\%%r
        call npm install
        if %ERRORLEVEL% neq 0 (
            echo   ⚠️ Failed to install %%r dependencies
        ) else (
            echo   ✅ %%r dependencies installed
        )
        popd
    )
)

echo.

REM Build packages (editor required packages only)
echo 🔨 Building editor-required packages...

for %%p in (nova-ecs nova-ecs-math nova-ecs-physics-core nova-ecs-physics-box2d nova-ecs-render-core nova-ecs-render-three) do (
    if exist "packages\%%p\package.json" (
        echo   Building %%p...
        pushd packages\%%p
        findstr "\"build\"" package.json >nul
        if %ERRORLEVEL% equ 0 (
            call npm run build
            if %ERRORLEVEL% neq 0 (
                echo   ⚠️ Failed to build %%p
            ) else (
                echo   ✅ %%p built successfully
            )
        ) else (
            echo   ⚠️ No build script found for %%p
        )
        popd
    )
)

echo.

REM Build root project
echo 🔨 Building root project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to build root project
) else (
    echo ✅ Root project built successfully
)

echo.
echo 🎉 Initialization complete!
echo.
echo 📋 Next steps:
echo   • Run 'npm run dev' to start development server
echo   • Check package builds in packages\*\dist\
echo.

pause