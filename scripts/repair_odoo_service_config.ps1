$ErrorActionPreference = "Stop"

$configPath = "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf"
$backupPath = "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf.backup_before_bom_repair_20260515"

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Odoo config not found: $configPath"
}

if (-not (Test-Path -LiteralPath $backupPath)) {
    Copy-Item -LiteralPath $configPath -Destination $backupPath
}

$text = [System.IO.File]::ReadAllText($configPath)
if ($text.Length -gt 0 -and [int][char]$text[0] -eq 65279) {
    $text = $text.Substring(1)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $text, $utf8NoBom)

$bytes = [System.IO.File]::ReadAllBytes($configPath)
if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
    throw "BOM is still present; repair failed."
}

Write-Host "Odoo config repaired. First line:"
Get-Content -LiteralPath $configPath -TotalCount 1

$service = Get-Service -Name "odoo-server-18.0"
if ($service.Status -eq "Paused" -or $service.Status -eq "Running") {
    Stop-Service -Name "odoo-server-18.0" -Force
    Start-Sleep -Seconds 3
}

Start-Service -Name "odoo-server-18.0"
Start-Sleep -Seconds 8
Get-Service -Name "odoo-server-18.0"

Write-Host "Latest Odoo log lines:"
Get-Content "C:\Program Files\Odoo 18.0.20260220\server\odoo.log" -Tail 40
