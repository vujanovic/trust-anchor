# start-vault.ps1
# Run this every time you need to start Vault

Write-Host "=== Starting Vault ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Run .\init-vault.ps1 first to set up Vault" -ForegroundColor Yellow
    exit 1
}

Write-Host "Loading environment variables..." -ForegroundColor Yellow
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

$vaultAddr = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://localhost:8200" }

# Start Docker
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker compose up -d

# Wait for Vault to be ready
Write-Host "Waiting for Vault to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check Vault status via REST API (vault CLI is blocked by Application Control policy)
Write-Host "Checking Vault status..." -ForegroundColor Yellow
$isSealed = $false
try {
    $health = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/health" -Method Get -ErrorAction Stop
    $isSealed = $health.sealed
} catch {
    $response = $_.Exception.Response
    $statusCode = if ($response) { $response.StatusCode.value__ } else { $null }
    if ($statusCode -eq 503) {
        $isSealed = $true
    } else {
        $detail = if ($statusCode) { "HTTP $statusCode" } else { "no HTTP response - is Docker running?" }
        Write-Host "[ERROR] Vault is not responding ($detail)" -ForegroundColor Red
        exit 1
    }
}

if ($isSealed) {
    Write-Host "Unsealing Vault..." -ForegroundColor Yellow

    if ([string]::IsNullOrWhiteSpace($env:VAULT_UNSEAL_KEY)) {
        Write-Host "[ERROR] VAULT_UNSEAL_KEY is missing from .env" -ForegroundColor Red
        exit 1
    }

    try {
        $body = @{ key = $env:VAULT_UNSEAL_KEY } | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/unseal" `
            -Method Put -Body $body -ContentType "application/json" -ErrorAction Stop
        if ($result.sealed -eq $false) {
            Write-Host "[OK] Vault unsealed successfully!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Vault is still sealed after unseal attempt" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[ERROR] Failed to unseal Vault: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Vault is already unsealed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Validating secrets..." -ForegroundColor Yellow

$missingVars = @()
if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) { $missingVars += "JWT_SECRET" }
if ([string]::IsNullOrWhiteSpace($env:MASTER_ENCRYPTION_KEY)) { $missingVars += "MASTER_ENCRYPTION_KEY" }
if ([string]::IsNullOrWhiteSpace($env:VAULT_TOKEN)) { $missingVars += "VAULT_TOKEN" }

if ($missingVars.Count -gt 0) {
    Write-Host "[ERROR] Missing or empty required variables in .env:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "Add them to .env and re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Syncing secrets to Vault..." -ForegroundColor Yellow
$headers = @{ "X-Vault-Token" = $env:VAULT_TOKEN }
$body = @{
    data = @{
        "jwt.secret"            = $env:JWT_SECRET
        "master.encryption.key" = $env:MASTER_ENCRYPTION_KEY
    }
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$vaultAddr/v1/secret/data/application" `
        -Method Post -Headers $headers -Body $body `
        -ContentType "application/json" -ErrorAction Stop | Out-Null
    Write-Host "[OK] Secrets synced to Vault" -ForegroundColor Green

    # Refresh application-local.properties (no BOM - Java Properties.load requires clean UTF-8)
    $localPropsPath = Join-Path $PSScriptRoot "application-local.properties"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($localPropsPath, "VAULT_TOKEN=$($env:VAULT_TOKEN)`nVAULT_ADDR=$vaultAddr`n", $utf8NoBom)
    Write-Host "[OK] application-local.properties refreshed for Spring Boot" -ForegroundColor Green
} catch {
    $response = $_.Exception.Response
    $statusCode = if ($response) { $response.StatusCode.value__ } else { $null }
    if ($statusCode -eq 403) {
        Write-Host "[ERROR] Vault token is invalid or expired (403 Forbidden)" -ForegroundColor Red
        Write-Host "   Re-run .\init-vault.ps1 to reinitialize Vault with a fresh token." -ForegroundColor Yellow
    } else {
        $detail = if ($statusCode) { "HTTP $statusCode" } else { "no HTTP response" }
        Write-Host "[ERROR] Failed to sync secrets ($detail): $_" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "=== Vault is ready! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start your Spring Boot application" -ForegroundColor Yellow
Write-Host ""
