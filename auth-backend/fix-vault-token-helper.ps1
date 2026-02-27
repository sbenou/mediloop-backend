# ==============================================================================
# FIX VAULT TOKEN HELPER ISSUE
# ==============================================================================
# This script creates a Vault CLI config that disables the problematic token helper
# ==============================================================================

Write-Host "🔧 Fixing Vault Token Helper Issue" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Create Vault CLI config file to disable token helper
$vaultCliConfig = "$env:USERPROFILE\.vault-cli-config"
Write-Host "📝 Creating Vault CLI config..." -ForegroundColor Yellow
Write-Host "   Location: $vaultCliConfig" -ForegroundColor White

$configContent = "disable_token_helper = true"
$configContent | Out-File -FilePath $vaultCliConfig -Encoding ASCII -Force

if (Test-Path $vaultCliConfig) {
    Write-Host "✅ Config file created!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create config file" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Set environment variables
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow

$env:VAULT_CONFIG_PATH = $vaultCliConfig
$env:VAULT_TOKEN_HELPER = ""
$env:VAULT_ADDR = "http://127.0.0.1:8200"

Write-Host "   ✓ VAULT_CONFIG_PATH = $vaultCliConfig" -ForegroundColor Green
Write-Host "   ✓ VAULT_TOKEN_HELPER = (empty)" -ForegroundColor Green
Write-Host "   ✓ VAULT_ADDR = http://127.0.0.1:8200" -ForegroundColor Green

Write-Host ""

# 3. Get root token from credentials file
$credFile = "$env:USERPROFILE\.vault\config\VAULT_CREDENTIALS.txt"

if (-not (Test-Path $credFile)) {
    Write-Host "❌ Credentials file not found: $credFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please enter your Vault root token manually:" -ForegroundColor Yellow
    $rootToken = Read-Host "Root Token"
    $env:VAULT_TOKEN = $rootToken
} else {
    Write-Host "📖 Reading root token from credentials file..." -ForegroundColor Yellow
    $credentials = Get-Content $credFile -Raw
    
    if ($credentials -match 'Root Token:\s*([^\r\n]+)') {
        $rootToken = $matches[1].Trim()
        $env:VAULT_TOKEN = $rootToken
        Write-Host "   ✓ Root token loaded: $($rootToken.Substring(0,10))..." -ForegroundColor Green
    } else {
        Write-Host "❌ Could not parse root token from file" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please enter your Vault root token manually:" -ForegroundColor Yellow
        $rootToken = Read-Host "Root Token"
        $env:VAULT_TOKEN = $rootToken
    }
}

Write-Host ""

# 4. Test connection
Write-Host "🔍 Testing Vault connection..." -ForegroundColor Yellow
Write-Host ""

vault status

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✅ SUCCESS! Vault connection working!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. These environment variables are set for THIS session only" -ForegroundColor Yellow
    Write-Host "   2. Run: .\import-from-env.ps1 (in THIS same terminal)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tip: Keep this terminal open and run import from here!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Vault connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Vault server is running (check other terminal)" -ForegroundColor White
    Write-Host "   2. Verify root token is correct" -ForegroundColor White
    Write-Host "   3. Try restarting Vault server" -ForegroundColor White
    Write-Host ""
}
