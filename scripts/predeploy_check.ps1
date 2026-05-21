$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot "apps\web"

Write-Host "Running Odoo module static check..."
Push-Location $repoRoot
try {
    python .\scripts\check_odoo_module.py
} finally {
    Pop-Location
}

Write-Host "Running Next.js lint..."
Push-Location $webRoot
try {
    npm.cmd run lint

    Write-Host "Running Next.js production build..."
    npm.cmd run build
} finally {
    Pop-Location
}

Write-Host "Predeploy checks completed."
