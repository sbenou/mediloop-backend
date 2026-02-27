# ==============================================================================
# START VAULT - Automatic startup script
# ==============================================================================
# This script starts your persistent Vault and automatically unseals it
# ==============================================================================

Write-Host "🚀 Starting Persistent Vault..." -ForegroundColor Cyan

# Kill any existing Vault processes
Get-Process vault -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start Vault server in background
$vaultConfigFile = "C:\Users\sbeno\.vault\config\vault.hcl"
Start-Process -FilePath "vault" -ArgumentList "server", "-config=$vaultConfigFile" -WindowStyle Hidden

Write-Host "⏳ Waiting for Vault to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Set environment
$env:VAULT_ADDR = "http://127.0.0.1:8200"

# Check if Vault is sealed
$status = vault status -format=json 2>$null | ConvertFrom-Json

if ($status.sealed) {
    Write-Host "🔓 Unsealing Vault..." -ForegroundColor Yellow
    vault operator unseal  | Out-Null
}

# Set environment variables for backend
$env:VAULT_ADDR = "http://127.0.0.1:8200"
$env:VAULT_TOKEN = ""
$env:VAULT_URL = "http://127.0.0.1:8200"

Write-Host "✅ Vault is running and unsealed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Vault UI: http://127.0.0.1:8200/ui" -ForegroundColor Cyan
Write-Host "🔑 Root Token: " -ForegroundColor Yellow
Write-Host ""
Write-Host "💾 Data location: C:\Users\sbeno\.vault\data" -ForegroundColor White
Write-Host "📋 Your secrets are safe and persistent!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Add your secrets using: .\add-secrets.ps1" -ForegroundColor White
Write-Host "   2. Or use Vault UI: http://127.0.0.1:8200/ui" -ForegroundColor White
Write-Host "   3. Then start your backend: deno task start-dev" -ForegroundColor White
Write-Host ""
