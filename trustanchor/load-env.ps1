# load-env.ps1
$envFile = Join-Path $PSScriptRoot '\.env'
if (Test-Path $envFile) {
    Write-Host 'Loading environment variables...'
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host 'Loaded.'
} else {
    Write-Host '❌ .env file not found!'
    exit 1
}