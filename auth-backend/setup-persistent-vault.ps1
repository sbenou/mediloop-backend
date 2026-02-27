# ==============================================================================
# PERSISTENT VAULT SETUP SCRIPT
# ==============================================================================
# This script sets up HashiCorp Vault with FILE-BACKED storage so your secrets
# are NEVER lost again, even after PC restarts!
#
# Run this ONCE to setup, then use start-vault.ps1 to start Vault
# ==============================================================================

Write-Host "🔐 Setting up PERSISTENT HashiCorp Vault..." -ForegroundColor Cyan
Write-Host ""

# Stop any running Vault processes
Write-Host "🛑 Stopping any existing Vault processes..." -ForegroundColor Yellow
Get-Process vault -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Create directories
$vaultDataDir = "$env:USERPROFILE\.vault\data"
$vaultConfigDir = "$env:USERPROFILE\.vault\config"
$vaultBackupDir = "$env:USERPROFILE\.vault\backups"

Write-Host "📁 Creating Vault directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $vaultDataDir | Out-Null
New-Item -ItemType Directory -Force -Path $vaultConfigDir | Out-Null
New-Item -ItemType Directory -Force -Path $vaultBackupDir | Out-Null

# Create Vault configuration file
$vaultConfigFile = "$vaultConfigDir\vault.hcl"

Write-Host "📝 Creating Vault configuration file..." -ForegroundColor Yellow

$configContent = @"
# Vault Configuration - PERSISTENT File Storage
# All secrets are stored in: $vaultDataDir

storage "file" {
  path = "$($vaultDataDir -replace '\\', '/')"
}

listener "tcp" {
  address     = "127.0.0.1:8200"
  tls_disable = 1
}

ui = true
disable_mlock = true

# Telemetry disabled for privacy
telemetry {
  disable_hostname = true
}
"@

$configContent | Out-File -FilePath $vaultConfigFile -Encoding ASCII

Write-Host "✅ Configuration created: $vaultConfigFile" -ForegroundColor Green
Write-Host ""

# Check if Vault is already initialized
if (Test-Path "$vaultDataDir\vault.db") {
    Write-Host "⚠️  Vault data directory already exists!" -ForegroundColor Yellow
    Write-Host "   This means Vault was previously initialized." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "   Do you want to REINITIALIZE (this will DELETE existing data)? (yes/no)"
    
    if ($response -ne "yes") {
        Write-Host "❌ Keeping existing data. Use start-vault.ps1 to start Vault." -ForegroundColor Red
        Write-Host ""
        Write-Host "   If you forgot your unseal key/root token, you MUST reinitialize." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "🗑️  Removing old data..." -ForegroundColor Red
    Remove-Item -Path "$vaultDataDir\*" -Recurse -Force
}

# Start Vault in background
Write-Host "🚀 Starting Vault server..." -ForegroundColor Yellow

$vaultProcess = Start-Process -FilePath "vault" -ArgumentList "server", "-config=$vaultConfigFile" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

# Set environment variables
$env:VAULT_ADDR = "http://127.0.0.1:8200"

# Initialize Vault
Write-Host "🔧 Initializing Vault (this creates your master keys)..." -ForegroundColor Yellow
Write-Host ""

$initOutput = vault operator init -key-shares=1 -key-threshold=1 -format=json | ConvertFrom-Json

$unsealKey = $initOutput.unseal_keys_b64[0]
$rootToken = $initOutput.root_token

# Save credentials securely
$credentialsFile = "$vaultConfigDir\VAULT_CREDENTIALS.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$credentialsContent = @"
==============================================================================
VAULT CREDENTIALS - SAVE THIS FILE SECURELY!
==============================================================================
Generated: $timestamp

⚠️  CRITICAL: Keep these credentials safe! You need them to access Vault!

Unseal Key: $unsealKey
Root Token: $rootToken

Vault Address: http://127.0.0.1:8200
UI Access: http://127.0.0.1:8200/ui

==============================================================================
WHAT THESE ARE:
==============================================================================

UNSEAL KEY:
  - Used to "unlock" Vault after restart
  - Without this, you CANNOT access your secrets
  - Keep this in a password manager!

ROOT TOKEN:
  - Used to login and manage secrets
  - This is like your master password
  - Keep this in a password manager!

==============================================================================
HOW TO USE:
==============================================================================

1. Start Vault:
   .\start-vault.ps1

2. The start script will automatically unseal and setup environment

3. Access UI:
   - Open: http://127.0.0.1:8200/ui
   - Login with Root Token: $rootToken

==============================================================================
"@

$credentialsContent | Out-File -FilePath $credentialsFile -Encoding UTF8

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 VAULT INITIALIZED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  CRITICAL: Save these credentials NOW!" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Unseal Key: " -NoNewline -ForegroundColor Yellow
Write-Host "$unsealKey" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Root Token: " -NoNewline -ForegroundColor Yellow
Write-Host "$rootToken" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Credentials saved to: $credentialsFile" -ForegroundColor Green
Write-Host "   📱 IMMEDIATELY copy this to your password manager!" -ForegroundColor Yellow
Write-Host ""

# Unseal Vault
Write-Host "🔓 Unsealing Vault..." -ForegroundColor Yellow
vault operator unseal $unsealKey | Out-Null

# Login
Write-Host "🔐 Logging in..." -ForegroundColor Yellow
vault login $rootToken | Out-Null

# Enable KV v2 secrets engine
Write-Host "📦 Enabling KV v2 secrets engine..." -ForegroundColor Yellow
vault secrets enable -version=2 -path=secret kv 2>$null

Write-Host "✅ Secrets engine enabled!" -ForegroundColor Green
Write-Host ""

# Create startup script
$startScriptPath = "$(Get-Location)\start-vault.ps1"
$startScriptContent = @"
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
`$vaultConfigFile = "$vaultConfigFile"
Start-Process -FilePath "vault" -ArgumentList "server", "-config=`$vaultConfigFile" -WindowStyle Hidden

Write-Host "⏳ Waiting for Vault to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Set environment
`$env:VAULT_ADDR = "http://127.0.0.1:8200"

# Check if Vault is sealed
`$status = vault status -format=json 2>`$null | ConvertFrom-Json

if (`$status.sealed) {
    Write-Host "🔓 Unsealing Vault..." -ForegroundColor Yellow
    vault operator unseal $unsealKey | Out-Null
}

# Set environment variables for backend
`$env:VAULT_ADDR = "http://127.0.0.1:8200"
`$env:VAULT_TOKEN = "$rootToken"
`$env:VAULT_URL = "http://127.0.0.1:8200"

Write-Host "✅ Vault is running and unsealed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Vault UI: http://127.0.0.1:8200/ui" -ForegroundColor Cyan
Write-Host "🔑 Root Token: $rootToken" -ForegroundColor Yellow
Write-Host ""
Write-Host "💾 Data location: $vaultDataDir" -ForegroundColor White
Write-Host "📋 Your secrets are safe and persistent!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Add your secrets using: .\add-secrets.ps1" -ForegroundColor White
Write-Host "   2. Or use Vault UI: http://127.0.0.1:8200/ui" -ForegroundColor White
Write-Host "   3. Then start your backend: deno task start-dev" -ForegroundColor White
Write-Host ""
"@

$startScriptContent | Out-File -FilePath $startScriptPath -Encoding UTF8

Write-Host "✅ Startup script created: $startScriptPath" -ForegroundColor Green
Write-Host ""

# Create backup script
$backupScriptPath = "$(Get-Location)\backup-vault-secrets.ps1"
$backupScriptContent = @"
# ==============================================================================
# BACKUP VAULT SECRETS
# ==============================================================================
# This script backs up ALL your secrets to encrypted JSON files
# Run this weekly or before making changes!
# ==============================================================================

Write-Host "💾 Backing up Vault secrets..." -ForegroundColor Cyan

`$env:VAULT_ADDR = "http://127.0.0.1:8200"
`$env:VAULT_TOKEN = "$rootToken"

`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupDir = "$vaultBackupDir"
`$backupPath = "`$backupDir\backup_`$timestamp"

New-Item -ItemType Directory -Force -Path `$backupPath | Out-Null

Write-Host "📁 Backup location: `$backupPath" -ForegroundColor Yellow
Write-Host ""

# List of secret paths to backup
`$secretPaths = @("auth", "oauth", "legacy")

foreach (`$path in `$secretPaths) {
    Write-Host "📦 Backing up secret/$path..." -ForegroundColor Yellow
    
    try {
        `$secret = vault kv get -format=json secret/`$path 2>`$null
        
        if (`$secret) {
            `$secret | Out-File -FilePath "`$backupPath\`$path.json" -Encoding UTF8
            Write-Host "   ✅ Backed up secret/`$path" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  No data found for secret/`$path" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Failed to backup secret/`$path" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "📂 Backup saved to: `$backupPath" -ForegroundColor Cyan
Write-Host ""

# Keep only last 10 backups
`$allBackups = Get-ChildItem -Path `$backupDir -Directory | Sort-Object CreationTime -Descending
if (`$allBackups.Count -gt 10) {
    Write-Host "🗑️  Removing old backups (keeping last 10)..." -ForegroundColor Yellow
    `$allBackups | Select-Object -Skip 10 | Remove-Item -Recurse -Force
}
"@

$backupScriptContent | Out-File -FilePath $backupScriptPath -Encoding UTF8

Write-Host "✅ Backup script created: $backupScriptPath" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎊 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Files created:" -ForegroundColor Cyan
Write-Host "   1. $credentialsFile" -ForegroundColor White
Write-Host "   2. $startScriptPath" -ForegroundColor White
Write-Host "   3. $backupScriptPath" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. ✅ Vault is running now!" -ForegroundColor Green
Write-Host "   2. 📋 Save your credentials to password manager" -ForegroundColor Yellow
Write-Host "   3. 🔐 Add your secrets using add-secrets.ps1 or Vault UI" -ForegroundColor Yellow
Write-Host "   4. 💾 Run backup-vault-secrets.ps1 after adding secrets" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Access Vault UI:" -ForegroundColor Cyan
Write-Host "   URL: http://127.0.0.1:8200/ui" -ForegroundColor White
Write-Host "   Token: $rootToken" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Every time you restart your PC, run:" -ForegroundColor Yellow
Write-Host "   .\start-vault.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🛡️  Your secrets are now PERSISTENT and will NEVER be lost!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Keep window open
Read-Host "Press Enter to close this window"
