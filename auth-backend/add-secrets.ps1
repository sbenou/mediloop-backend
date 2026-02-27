# ==============================================================================
# ADD SECRETS TO VAULT - Interactive Script
# ==============================================================================
# This script helps you add all your secrets to Vault interactively
# It will prompt you for each secret and save them securely
# ==============================================================================

Write-Host "🔐 Adding Secrets to Vault" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

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
Write-Host "This script will help you add secrets to three folders:" -ForegroundColor Yellow
Write-Host "  1. secret/auth     - Database URLs, JWT, Resend" -ForegroundColor White
Write-Host "  2. secret/oauth    - Google, FranceConnect, LuxTrust" -ForegroundColor White
Write-Host "  3. secret/legacy   - Supabase (if still needed)" -ForegroundColor White
Write-Host ""

$response = Read-Host "Ready to add secrets? (yes/no)"
if ($response -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 FOLDER 1/3: secret/auth" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 TIP: Find your Neon database URLs at:" -ForegroundColor Yellow
Write-Host "   https://console.neon.tech/app/projects" -ForegroundColor White
Write-Host ""

$dbUrlDev = Read-Host "Enter DATABASE_URL_DEV (development database connection string)"
$dbUrlProd = Read-Host "Enter DATABASE_URL_PROD (production database connection string)"

Write-Host ""
Write-Host "💡 TIP: Generate a secure JWT secret or use your existing one" -ForegroundColor Yellow
$jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate new one)"

if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   ✅ Generated new JWT secret" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 TIP: Get your Resend API key from:" -ForegroundColor Yellow
Write-Host "   https://resend.com/api-keys" -ForegroundColor White
Write-Host ""

$resendApiKey = Read-Host "Enter RESEND_API_KEY (starts with re_)"

# Save auth secrets
Write-Host ""
Write-Host "💾 Saving auth secrets to Vault..." -ForegroundColor Yellow

vault kv put secret/auth `
  DATABASE_URL_DEV="$dbUrlDev" `
  DATABASE_URL_PROD="$dbUrlProd" `
  JWT_SECRET="$jwtSecret" `
  RESEND_API_KEY="$resendApiKey"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Auth secrets saved successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to save auth secrets" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 FOLDER 2/3: secret/oauth" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$addOAuth = Read-Host "Do you want to add OAuth secrets now? (yes/no)"

if ($addOAuth -eq "yes") {
    Write-Host ""
    Write-Host "💡 TIP: Get your Google OAuth credentials from:" -ForegroundColor Yellow
    Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor White
    Write-Host ""
    
    $googleClientSecret = Read-Host "Enter GOOGLE_CLIENT_SECRET (or press Enter to skip)"
    
    Write-Host ""
    Write-Host "💡 TIP: Get your FranceConnect credentials from:" -ForegroundColor Yellow
    Write-Host "   https://partenaires.franceconnect.gouv.fr/" -ForegroundColor White
    Write-Host ""
    
    $franceConnectSecret = Read-Host "Enter FRANCECONNECT_CLIENT_SECRET (or press Enter to skip)"
    
    Write-Host ""
    Write-Host "💡 TIP: Get your LuxTrust credentials from your account" -ForegroundColor Yellow
    Write-Host ""
    
    $luxTrustSecret = Read-Host "Enter LUXTRUST_CLIENT_SECRET (or press Enter to skip)"
    
    Write-Host ""
    Write-Host "💾 Saving OAuth secrets to Vault..." -ForegroundColor Yellow
    
    $oauthSecrets = @{}
    if (![string]::IsNullOrWhiteSpace($googleClientSecret)) { $oauthSecrets["GOOGLE_CLIENT_SECRET"] = $googleClientSecret }
    if (![string]::IsNullOrWhiteSpace($franceConnectSecret)) { $oauthSecrets["FRANCECONNECT_CLIENT_SECRET"] = $franceConnectSecret }
    if (![string]::IsNullOrWhiteSpace($luxTrustSecret)) { $oauthSecrets["LUXTRUST_CLIENT_SECRET"] = $luxTrustSecret }
    
    if ($oauthSecrets.Count -gt 0) {
        $putArgs = @("secret/oauth")
        foreach ($key in $oauthSecrets.Keys) {
            $putArgs += "$key=$($oauthSecrets[$key])"
        }
        
        vault kv put @putArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ OAuth secrets saved successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to save OAuth secrets" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  No OAuth secrets provided, skipping..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 FOLDER 3/3: secret/legacy" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$addLegacy = Read-Host "Do you have Supabase secrets to add? (yes/no)"

if ($addLegacy -eq "yes") {
    Write-Host ""
    Write-Host "💡 TIP: Get your Supabase credentials from:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/_/settings/api" -ForegroundColor White
    Write-Host ""
    
    $supabaseUrl = Read-Host "Enter SUPABASE_URL"
    $supabaseKey = Read-Host "Enter SUPABASE_SERVICE_KEY"
    
    Write-Host ""
    Write-Host "💾 Saving legacy secrets to Vault..." -ForegroundColor Yellow
    
    vault kv put secret/legacy `
      SUPABASE_URL="$supabaseUrl" `
      SUPABASE_SERVICE_KEY="$supabaseKey"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Legacy secrets saved successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save legacy secrets" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 ALL SECRETS SAVED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verify all secrets
Write-Host "🔍 Verifying saved secrets..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 secret/auth:" -ForegroundColor Cyan
vault kv get -format=table secret/auth

Write-Host ""
Write-Host "📋 secret/oauth:" -ForegroundColor Cyan
vault kv get -format=table secret/oauth 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   (No OAuth secrets saved)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 secret/legacy:" -ForegroundColor Cyan
vault kv get -format=table secret/legacy 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   (No legacy secrets saved)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run backup: .\backup-vault-secrets.ps1" -ForegroundColor White
Write-Host "   2. Update auth-backend .bat file with correct VAULT_TOKEN" -ForegroundColor White
Write-Host "   3. Start your backend: deno task start-dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Your Vault Root Token is in:" -ForegroundColor Yellow
Write-Host "   $credentialsFile" -ForegroundColor White
Write-Host ""
