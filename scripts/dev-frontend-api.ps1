param(
    [string] $HostName = "127.0.0.1",
    [int] $Port = 3000,
    [string] $ApiBaseUrl = "http://127.0.0.1:8000/api/v1"
)

Set-StrictMode -Version Latest
. "$PSScriptRoot\_dev-helpers.ps1"

$repoRoot = Get-DeveloperOsRepoRoot -ScriptsRoot $PSScriptRoot
$frontendPackage = Join-Path $repoRoot "frontend\package.json"
$npm = $null

try {
    $npm = Get-NpmExecutable
    Assert-FileExists -Path $frontendPackage -Message "Frontend package.json was not found."
    Assert-NoNextDevServerLock -FrontendRoot (Join-Path $repoRoot "frontend")
    Assert-PortAvailable -Port $Port -ServiceName "Frontend"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$env:NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER = "api"
$env:NEXT_PUBLIC_API_BASE_URL = $ApiBaseUrl

Write-Host "Starting Developer OS frontend in API mode on http://${HostName}:$Port"
Write-Host "API base URL: $env:NEXT_PUBLIC_API_BASE_URL"
Write-Host "Restart this script after changing NEXT_PUBLIC_* values."

Set-Location -LiteralPath $repoRoot
& $npm run dev --prefix frontend -- --hostname $HostName --port $Port
exit $LASTEXITCODE
