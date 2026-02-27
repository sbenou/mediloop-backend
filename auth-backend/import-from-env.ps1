# ==============================================================================
# IMPORT SECRETS FROM .ENV FILES TO VAULT
# ==============================================================================
# This script reads your .env files and automatically adds secrets to Vault
# ==============================================================================

Write-Host "📥 Importing Secrets from .env files to Vault" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Disable token helper (fixes Windows "Incorrect function" error)
$env:VAULT_TOKEN_HELPER = ""

# Set Vault environment
$env:VAULT_ADDR = "http://127.0.0.1:8200"

# Check if root token file exists
$credentialsFile = "$env:USERPROFILE\.vault\config\VAULT_CREDENTIALS.txt"
if (Test-Path $credentialsFile) {
    $credentials = Get-Content $credentialsFile
    $rootTokenLine = $credentials | Select-String -Pattern "Root Token: (.*)" 
    if ($rootTokenLine) {
        $rootToken = $rootTokenLine.Matches.Groups[1].Value
        $env:VAULT_TOKEN = $rootToken
        Write-Host "✅ Using saved root token" -ForegroundColor Green
    }
} else {
    $rootToken = Read-Host "Enter your Vault Root Token"
    $env:VAULT_TOKEN = $rootToken
}

Write-Host ""

# Function to parse .env file
function Parse-EnvFile {
    param (
        [string]$FilePath
    )
    
    if (-not (Test-Path $FilePath)) {
        return @{}
    }
    
    $envVars = @{}
    $content = Get-Content $FilePath
    
    foreach ($line in $content) {
        # Skip empty lines and comments
        if ([string]::IsNullOrWhiteSpace($line) -or $line.Trim().StartsWith("#")) {
            continue
        }
        
        # Parse KEY=VALUE
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            
            $envVars[$key] = $value
        }
    }
    
    return $envVars
}

# Find all .env files in current directory
$envFiles = Get-ChildItem -Path . -Filter ".env*" -File | Where-Object { $_.Name -match '^\.env' }

if ($envFiles.Count -eq 0) {
    Write-Host "❌ No .env files found in current directory!" -ForegroundColor Red
    Write-Host "   Please run this script from your auth-backend folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Found .env files:" -ForegroundColor Yellow
foreach ($file in $envFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor White
}
Write-Host ""

# Parse all .env files
$allSecrets = @{}

foreach ($file in $envFiles) {
    Write-Host "📖 Reading $($file.Name)..." -ForegroundColor Yellow
    $secrets = Parse-EnvFile -FilePath $file.FullName
    
    foreach ($key in $secrets.Keys) {
        $allSecrets[$key] = $secrets[$key]
        Write-Host "   ✓ Found: $key" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 SECRETS FOUND:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Categorize secrets
$authSecrets = @{}
$oauthSecrets = @{}
$legacySecrets = @{}
$otherSecrets = @{}

foreach ($key in $allSecrets.Keys) {
    $value = $allSecrets[$key]
    
    # Categorize based on key name
    if ($key -match "DATABASE_URL|JWT_SECRET|RESEND_API_KEY|NEON_") {
        $authSecrets[$key] = $value
    }
    elseif ($key -match "GOOGLE_|FRANCECONNECT_|LUXTRUST_|OAUTH") {
        $oauthSecrets[$key] = $value
    }
    elseif ($key -match "SUPABASE_") {
        $legacySecrets[$key] = $value
    }
    else {
        $otherSecrets[$key] = $value
    }
}

# Display categorized secrets
if ($authSecrets.Count -gt 0) {
    Write-Host "📁 Auth Secrets (will go to secret/auth):" -ForegroundColor Cyan
    foreach ($key in $authSecrets.Keys) {
        Write-Host "   ✓ $key" -ForegroundColor Green
    }
    Write-Host ""
}

if ($oauthSecrets.Count -gt 0) {
    Write-Host "📁 OAuth Secrets (will go to secret/oauth):" -ForegroundColor Cyan
    foreach ($key in $oauthSecrets.Keys) {
        Write-Host "   ✓ $key" -ForegroundColor Green
    }
    Write-Host ""
}

if ($legacySecrets.Count -gt 0) {
    Write-Host "📁 Legacy Secrets (will go to secret/legacy):" -ForegroundColor Cyan
    foreach ($key in $legacySecrets.Keys) {
        Write-Host "   ✓ $key" -ForegroundColor Green
    }
    Write-Host ""
}

if ($otherSecrets.Count -gt 0) {
    Write-Host "📁 Other Secrets (will go to secret/other):" -ForegroundColor Yellow
    foreach ($key in $otherSecrets.Keys) {
        Write-Host "   ✓ $key" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Import these secrets to Vault? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""

# Import auth secrets
if ($authSecrets.Count -gt 0) {
    Write-Host "💾 Saving auth secrets to Vault..." -ForegroundColor Yellow
    
    $putArgs = @("kv", "put", "secret/auth")
    foreach ($key in $authSecrets.Keys) {
        $putArgs += "$key=$($authSecrets[$key])"
    }
    
    # Force environment variables for this command
    $prevTokenHelper = $env:VAULT_TOKEN_HELPER
    $env:VAULT_TOKEN_HELPER = ""
    
    & vault @putArgs
    
    $env:VAULT_TOKEN_HELPER = $prevTokenHelper
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Auth secrets saved!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save auth secrets" -ForegroundColor Red
    }
    Write-Host ""
}

# Import oauth secrets
if ($oauthSecrets.Count -gt 0) {
    Write-Host "💾 Saving OAuth secrets to Vault..." -ForegroundColor Yellow
    
    $putArgs = @("kv", "put", "secret/oauth")
    foreach ($key in $oauthSecrets.Keys) {
        $putArgs += "$key=$($oauthSecrets[$key])"
    }
    
    # Force environment variables for this command
    $prevTokenHelper = $env:VAULT_TOKEN_HELPER
    $env:VAULT_TOKEN_HELPER = ""
    
    & vault @putArgs
    
    $env:VAULT_TOKEN_HELPER = $prevTokenHelper
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OAuth secrets saved!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save OAuth secrets" -ForegroundColor Red
    }
    Write-Host ""
}

# Import legacy secrets
if ($legacySecrets.Count -gt 0) {
    Write-Host "💾 Saving legacy secrets to Vault..." -ForegroundColor Yellow
    
    $putArgs = @("kv", "put", "secret/legacy")
    foreach ($key in $legacySecrets.Keys) {
        $putArgs += "$key=$($legacySecrets[$key])"
    }
    
    # Force environment variables for this command
    $prevTokenHelper = $env:VAULT_TOKEN_HELPER
    $env:VAULT_TOKEN_HELPER = ""
    
    & vault @putArgs
    
    $env:VAULT_TOKEN_HELPER = $prevTokenHelper
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Legacy secrets saved!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save legacy secrets" -ForegroundColor Red
    }
    Write-Host ""
}

# Import other secrets
if ($otherSecrets.Count -gt 0) {
    Write-Host "💾 Saving other secrets to Vault..." -ForegroundColor Yellow
    
    $putArgs = @("kv", "put", "secret/other")
    foreach ($key in $otherSecrets.Keys) {
        $putArgs += "$key=$($otherSecrets[$key])"
    }
    
    # Force environment variables for this command
    $prevTokenHelper = $env:VAULT_TOKEN_HELPER
    $env:VAULT_TOKEN_HELPER = ""
    
    & vault @putArgs
    
    $env:VAULT_TOKEN_HELPER = $prevTokenHelper
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Other secrets saved!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save other secrets" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ IMPORT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verify secrets
Write-Host "🔍 Verifying saved secrets..." -ForegroundColor Yellow
Write-Host ""

if ($authSecrets.Count -gt 0) {
    Write-Host "📋 secret/auth:" -ForegroundColor Cyan
    vault kv get -format=table secret/auth
    Write-Host ""
}

if ($oauthSecrets.Count -gt 0) {
    Write-Host "📋 secret/oauth:" -ForegroundColor Cyan
    vault kv get -format=table secret/oauth
    Write-Host ""
}

if ($legacySecrets.Count -gt 0) {
    Write-Host "📋 secret/legacy:" -ForegroundColor Cyan
    vault kv get -format=table secret/legacy
    Write-Host ""
}

if ($otherSecrets.Count -gt 0) {
    Write-Host "📋 secret/other:" -ForegroundColor Cyan
    vault kv get -format=table secret/other
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 ALL SECRETS IMPORTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\backup-vault-secrets.ps1 (backup your secrets)" -ForegroundColor White
Write-Host "   2. Delete or secure your .env files" -ForegroundColor White
Write-Host "   3. Start your backend: deno task start-dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Your secrets are now safely stored in Vault!" -ForegroundColor Green
Write-Host ""