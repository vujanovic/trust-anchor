# init-vault.ps1
# Run this ONCE when setting up Vault for the first time

Write-Host "=== Vault Initial Setup ===" -ForegroundColor Cyan
Write-Host ""

$vaultAddr = "http://127.0.0.1:8200"

# Start Docker
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5

# Initialize Vault via REST API (vault CLI blocked by Application Control policy)
Write-Host ""
Write-Host "Initializing Vault..." -ForegroundColor Yellow
$initBody = @{ secret_shares = 1; secret_threshold = 1 } | ConvertTo-Json
try {
    $initResult = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/init" `
        -Method Post -Body $initBody -ContentType "application/json" -ErrorAction Stop
} catch {
    Write-Host "❌ Failed to initialize Vault: $_" -ForegroundColor Red
    Write-Host "   Is the Docker container running?" -ForegroundColor Yellow
    exit 1
}

$unsealKey = $initResult.keys_base64[0]
$rootToken  = $initResult.root_token

Write-Host ""
Write-Host "=== SAVE THESE VALUES ===" -ForegroundColor Red
Write-Host "Unseal Key: $unsealKey" -ForegroundColor Green
Write-Host "Root Token: $rootToken" -ForegroundColor Green
Write-Host ""

# Write initial .env
$envPath = Join-Path $PSScriptRoot ".env"
@"
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=$rootToken
VAULT_UNSEAL_KEY=$unsealKey
"@ | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✅ .env file created at: $envPath" -ForegroundColor Green

# Write application-local.properties for Spring Boot (no BOM - Java Properties.load requires clean UTF-8)
$localPropsPath = Join-Path $PSScriptRoot "application-local.properties"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localPropsPath, "VAULT_TOKEN=$rootToken`nVAULT_ADDR=http://localhost:8200`n", $utf8NoBom)
Write-Host "✅ application-local.properties written for Spring Boot" -ForegroundColor Green
Write-Host ""

# Unseal Vault
Write-Host "Unsealing Vault..." -ForegroundColor Yellow
$unsealBody = @{ key = $unsealKey } | ConvertTo-Json
try {
    $unsealResult = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/unseal" `
        -Method Put -Body $unsealBody -ContentType "application/json" -ErrorAction Stop
    if ($unsealResult.sealed -eq $false) {
        Write-Host "✅ Vault unsealed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Vault is still sealed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to unseal Vault: $_" -ForegroundColor Red
    exit 1
}

# Enable KV v2 secrets engine
Write-Host ""
Write-Host "Enabling KV v2 secrets engine..." -ForegroundColor Yellow
$headers = @{ "X-Vault-Token" = $rootToken }
$kvBody = @{ type = "kv"; options = @{ version = "2" } } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$vaultAddr/v1/sys/mounts/secret" `
        -Method Post -Headers $headers -Body $kvBody `
        -ContentType "application/json" -ErrorAction Stop | Out-Null
    Write-Host "✅ KV v2 enabled at secret/" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "[INFO] KV v2 already enabled at secret/ (skipping)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to enable KV v2 (HTTP $statusCode): $_" -ForegroundColor Red
        exit 1
    }
}

# Generate secrets using PowerShell's built-in crypto
Write-Host ""
Write-Host "Generating secrets..." -ForegroundColor Yellow

# JWT secret: 32 random bytes encoded as Base64 (required by JwtService / HMAC-SHA256)
$jwtBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)

# Master encryption key: 32 random bytes encoded as lowercase hex
$encBytes = New-Object byte[] 32
$rng.GetBytes($encBytes)
$encryptionKey = ($encBytes | ForEach-Object { $_.ToString("x2") }) -join ""
$rng.Dispose()

# Store secrets in Vault
Write-Host "Storing secrets in Vault..." -ForegroundColor Yellow
$secretBody = @{
    data = @{
        "jwt.secret"            = $jwtSecret
        "master.encryption.key" = $encryptionKey
    }
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$vaultAddr/v1/secret/data/application" `
        -Method Post -Headers $headers -Body $secretBody `
        -ContentType "application/json" -ErrorAction Stop | Out-Null
    Write-Host "✅ Secrets stored in Vault" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to store secrets: $_" -ForegroundColor Red
    exit 1
}

# Append both secrets to .env so start-vault.ps1 can re-sync them on every startup
Add-Content -Path $envPath -Value "JWT_SECRET=$jwtSecret"
Add-Content -Path $envPath -Value "MASTER_ENCRYPTION_KEY=$encryptionKey"

# Create placeholder paths Spring looks for
$placeholderBody = @{ data = @{ placeholder = "true" } } | ConvertTo-Json
foreach ($path in @("secret/data/trustanchor/dev", "secret/data/trustanchor", "secret/data/application/dev")) {
    Invoke-RestMethod -Uri "$vaultAddr/v1/$path" `
        -Method Post -Headers $headers -Body $placeholderBody `
        -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
}

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
