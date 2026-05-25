param(
  [Parameter(Mandatory = $true)]
  [string]$ClientId
)

$backendEnv = Join-Path $PSScriptRoot "..\backend\.env"
$frontendEnv = Join-Path $PSScriptRoot "..\frontend\.env"

function Set-EnvKey {
  param([string]$Path, [string]$Key, [string]$Value)
  $lines = @()
  if (Test-Path $Path) { $lines = Get-Content $Path }
  $filtered = $lines | Where-Object { $_ -notmatch "^$Key=" }
  $filtered += "$Key=$Value"
  $text = ($filtered -join "`n") + "`n"
  [System.IO.File]::WriteAllText($Path, $text, (New-Object System.Text.UTF8Encoding $false))
}

Set-EnvKey -Path $backendEnv -Key "GOOGLE_CLIENT_ID" -Value $ClientId
Set-EnvKey -Path $frontendEnv -Key "VITE_GOOGLE_CLIENT_ID" -Value $ClientId

Write-Host "Configured Google OAuth Client ID in:"
Write-Host "  $backendEnv"
Write-Host "  $frontendEnv"
Write-Host ""
Write-Host "Restart servers:"
Write-Host "  cd backend; npm run dev:auth"
Write-Host "  cd frontend; npm run dev"
