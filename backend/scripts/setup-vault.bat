
@echo off
REM HashiCorp Vault Setup Script for Windows
REM This script sets up environment variables and initializes Vault with secrets

echo 🔐 Starting HashiCorp Vault setup...

REM Set environment for development
set NODE_ENV=development

REM Set Vault environment variables
set VAULT_URL=http://localhost:8200
set VAULT_TOKEN=myroot

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Start Vault container if not already running
echo 🚀 Starting Vault container...
docker-compose -f docker-compose.vault.yml up -d

REM Wait for Vault to be ready
echo ⏳ Waiting for Vault to be ready...
timeout /t 5 /nobreak >nul

REM Check if Vault is healthy
curl -s http://localhost:8200/v1/sys/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vault is not responding. Please check the container logs:
    echo    docker logs vault-dev
    exit /b 1
)

echo ✅ Vault is ready!

REM Run the Deno setup script with environment variables
echo 🔧 Running Vault initialization script...
set VAULT_URL=%VAULT_URL%
set VAULT_TOKEN=%VAULT_TOKEN%
set NODE_ENV=%NODE_ENV%
deno run --allow-net --allow-env --allow-read scripts/setupVault.ts

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Vault setup completed successfully!
    echo.
    echo 📋 Next steps:
    echo    1. Vault UI: http://localhost:8200 ^(token: myroot^)
    echo    2. Start your Deno server: deno run --allow-net --allow-env --allow-read main.ts
    echo.
) else (
    echo ❌ Vault setup failed. Check the error messages above.
    exit /b 1
)
