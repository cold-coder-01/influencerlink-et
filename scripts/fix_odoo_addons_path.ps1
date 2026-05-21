$ErrorActionPreference = "Stop"

$configPath = "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf"
$coreAddonsPath = "c:\program files\odoo 18.0.20260220\server\odoo\addons"
$projectAddonsPath = "C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons"
$customAddonsPath = "C:\custom_addons"

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Active Odoo config was not found at $configPath"
}

$lines = Get-Content -LiteralPath $configPath
$addonsLineIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*addons_path\s*=") {
        $addonsLineIndex = $i
        break
    }
}

if ($addonsLineIndex -lt 0) {
    throw "No addons_path line found in $configPath"
}

$existingValue = ($lines[$addonsLineIndex] -split "=", 2)[1]
$paths = $existingValue -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$ordered = New-Object System.Collections.Generic.List[string]
foreach ($path in @($coreAddonsPath, $projectAddonsPath, $customAddonsPath)) {
    if (-not $ordered.Contains($path)) {
        $ordered.Add($path)
    }
}

foreach ($path in $paths) {
    $isKnownPath = $path -ieq $coreAddonsPath -or $path -ieq $projectAddonsPath -or $path -ieq $customAddonsPath
    if (-not $isKnownPath -and -not $ordered.Contains($path)) {
        $ordered.Add($path)
    }
}

$lines[$addonsLineIndex] = "addons_path = " + ($ordered -join ", ")
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, ($lines -join [Environment]::NewLine) + [Environment]::NewLine, $utf8NoBom)

Write-Host "Updated active Odoo addons_path:"
Write-Host $lines[$addonsLineIndex]
