
@echo off
REM Development startup script for Deno server
echo 🚀 Starting Deno server in development mode...

REM Set environment for development
set NODE_ENV=development

REM Set Vault environment variables
set VAULT_URL=http://localhost:8200
set VAULT_TOKEN=myroot

REM Start the Deno server with all required permissions
echo 🔧 Starting server with Vault integration...
set VAULT_URL=%VAULT_URL%
set VAULT_TOKEN=%VAULT_TOKEN%
set NODE_ENV=%NODE_ENV%
deno run --allow-net --allow-env --allow-read --unstable-kv main.ts
