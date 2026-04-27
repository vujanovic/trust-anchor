# init-vault.ps1
# Run this ONCE when setting up Vault for the first time

Write-Host "=== Vault Initial Setup ===" -ForegroundColor Cyan
Write-Host ""

# Start Docker
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5

# Initialize Vault
Write-Host ""
Write-Host "Initializing Vault..." -ForegroundColor Yellow
$env:VAULT_ADDR='http://127.0.0.1:8200'
$initOutput = vault operator init -key-shares=1 -key-threshold=1

# Parse the output
$unsealKey = ($initOutput | Select-String "Unseal Key 1: (.+)").Matches.Groups[1].Value
$rootToken = ($initOutput | Select-String "Initial Root Token: (.+)").Matches.Groups[1].Value

Write-Host ""
Write-Host "=== SAVE THESE VALUES ===" -ForegroundColor Red
Write-Host "Unseal Key: $unsealKey" -ForegroundColor Green
Write-Host "Root Token: $rootToken" -ForegroundColor Green
Write-Host ""

# Update .env file (encryption key generated later — placeholder updated below)
$envPath = Join-Path $PSScriptRoot ".env"
@"
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=$rootToken
VAULT_UNSEAL_KEY=$unsealKey
"@ | Out-File -FilePath $envPath -Encoding UTF8

Write-Host "✅ .env file created at: $envPath" -ForegroundColor Green
Write-Host ""

# Load env and unseal
$env:VAULT_TOKEN = $rootToken
$env:VAULT_UNSEAL_KEY = $unsealKey

Write-Host "Unsealing Vault..." -ForegroundColor Yellow
vault operator unseal $unsealKey

# Enable KV v2
Write-Host ""
Write-Host "Enabling KV v2 secrets engine..." -ForegroundColor Yellow
vault secrets enable -path=secret kv-v2

# Generate secrets using PowerShell's built-in crypto (no openssl dependency)
Write-Host ""
Write-Host "Generating secrets..." -ForegroundColor Yellow

# JWT secret: 32 random bytes encoded as Base64 (required by JwtService / HMAC-SHA256)
$jwtBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)

# Master encryption key: 32 random bytes encoded as lowercase hex
$encBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($encBytes)
$encryptionKey = ($encBytes | ForEach-Object { $_.ToString("x2") }) -join ""

Write-Host "Storing secrets in Vault..." -ForegroundColor Yellow
vault kv put secret/application `
    jwt.secret="$jwtSecret" `
    master.encryption.key="$encryptionKey"

# Append both secrets to .env so start-vault.ps1 can re-sync them on every startup
Add-Content -Path $envPath -Value "JWT_SECRET=$jwtSecret"
Add-Content -Path $envPath -Value "MASTER_ENCRYPTION_KEY=$encryptionKey"

# Create other paths Spring looks for
vault kv put secret/trustanchor/dev placeholder=true
vault kv put secret/trustanchor placeholder=true
vault kv put secret/application/dev placeholder=true

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Vault initialized and unsealed" -ForegroundColor Green
Write-Host "✅ KV v2 secrets engine enabled" -ForegroundColor Green
Write-Host "✅ JWT secret generated and stored" -ForegroundColor Green
Write-Host "✅ Encryption key generated and stored" -ForegroundColor Green
Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Save the unseal key and root token somewhere safe!" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Save the unseal key and root token somewhere safe"
Write-Host "  2. Use .\start-vault.ps1 for daily startup"
Write-Host "  3. Start your Spring Boot app from IntelliJ"
Write-Host ""