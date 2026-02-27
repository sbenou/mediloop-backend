# ==============================================================================
# BACKUP VAULT SECRETS
# ==============================================================================
# This script backs up ALL your secrets to encrypted JSON files
# Run this weekly or before making changes!
# ==============================================================================

Write-Host "💾 Backing up Vault secrets..." -ForegroundColor Cyan

$env:VAULT_ADDR = "http://127.0.0.1:8200"
$env:VAULT_TOKEN = ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Users\sbeno\.vault\backups"
$backupPath = "$backupDir\backup_$timestamp"

New-Item -ItemType Directory -Force -Path $backupPath | Out-Null

Write-Host "📁 Backup location: $backupPath" -ForegroundColor Yellow
Write-Host ""

# List of secret paths to backup
$secretPaths = @("auth", "oauth", "legacy")

foreach ($path in $secretPaths) {
    Write-Host "📦 Backing up secret/..." -ForegroundColor Yellow
    
    try {
        $secret = vault kv get -format=json secret/$path 2>$null
        
        if ($secret) {
            $secret | Out-File -FilePath "$backupPath\$path.json" -Encoding UTF8
            Write-Host "   ✅ Backed up secret/$path" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  No data found for secret/$path" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Failed to backup secret/$path" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "📂 Backup saved to: $backupPath" -ForegroundColor Cyan
Write-Host ""

# Keep only last 10 backups
$allBackups = Get-ChildItem -Path $backupDir -Directory | Sort-Object CreationTime -Descending
if ($allBackups.Count -gt 10) {
    Write-Host "🗑️  Removing old backups (keeping last 10)..." -ForegroundColor Yellow
    $allBackups | Select-Object -Skip 10 | Remove-Item -Recurse -Force
}
