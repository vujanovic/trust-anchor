# start-vault.ps1
# Run this every time you need to start Vault

Write-Host "=== Starting Vault ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
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

# Start Docker
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker compose up -d

# Wait for Vault to be ready
Write-Host "Waiting for Vault to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if Vault is sealed
$status = vault status -format=json 2>$null | ConvertFrom-Json

if ($null -eq $status) {
    Write-Host "❌ Vault is not responding. Check if Docker is running." -ForegroundColor Red
    exit 1
}

if ($status.sealed) {
    Write-Host "Unsealing Vault..." -ForegroundColor Yellow
    vault operator unseal $env:VAULT_UNSEAL_KEY | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vault unsealed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to unseal Vault" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Vault is already unsealed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Syncing secrets to Vault..." -ForegroundColor Yellow
vault kv put secret/application `
    jwt.secret="$env:JWT_SECRET" | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secrets synced to Vault" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to sync secrets to Vault" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Vault is ready! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start your Spring Boot application" -ForegroundColor Yellow
Write-Host ""