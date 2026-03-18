
@echo off
REM Vault Manager Script for Windows
REM This script handles all vault operations with proper environment setup

echo 🔐 Starting Vault Manager...

REM Set Vault environment variables
set VAULT_URL=http://localhost:8200
set VAULT_TOKEN=myroot
set NODE_ENV=development

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Vault container is running
docker ps | findstr vault-dev >nul 2>&1
if %errorlevel% neq 0 (
    echo 🚀 Starting Vault container...
    docker-compose -f docker-compose.vault.yml up -d
    echo ⏳ Waiting for Vault to be ready...
    timeout /t 5 /nobreak >nul
)

REM Check if Vault is healthy
curl -s http://localhost:8200/v1/sys/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vault is not responding. Please check the container logs:
    echo    docker logs vault-dev
    exit /b 1
)

REM Run the vault manager with all arguments passed through
echo 🔧 Running Vault Manager with environment variables set...
set VAULT_URL=%VAULT_URL%
set VAULT_TOKEN=%VAULT_TOKEN%
set NODE_ENV=%NODE_ENV%
deno run --allow-net --allow-env --allow-read scripts/vaultManager.ts %*

if %errorlevel% equ 0 (
    echo ✅ Vault operation completed successfully!
) else (
    echo ❌ Vault operation failed. Check the error messages above.
    exit /b 1
)
