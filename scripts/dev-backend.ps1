param(
    [string] $HostName = "127.0.0.1",
    [int] $Port = 8000,
    [switch] $NoReload
)

Set-StrictMode -Version Latest
. "$PSScriptRoot\_dev-helpers.ps1"

$repoRoot = Get-DeveloperOsRepoRoot -ScriptsRoot $PSScriptRoot
$pythonPath = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$mainPath = Join-Path $repoRoot "backend\app\main.py"

try {
    Assert-FileExists -Path $pythonPath -Message "Backend virtual environment was not found. Run: cd backend; python -m venv .venv; .\.venv\Scripts\Activate.ps1; python -m pip install -e `".[dev]`""
    Assert-FileExists -Path $mainPath -Message "Backend app entrypoint was not found at backend\app\main.py."
    Assert-PortAvailable -Port $Port -ServiceName "Backend"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$arguments = @(
    "-m", "uvicorn",
    "app.main:app",
    "--app-dir", "backend",
    "--host", $HostName,
    "--port", "$Port"
)

if (-not $NoReload) {
    $arguments += "--reload"
}

Write-Host "Starting Developer OS API on http://${HostName}:$Port"
Write-Host "Health: http://${HostName}:$Port/api/v1/health"

Set-Location -LiteralPath $repoRoot
& $pythonPath @arguments
exit $LASTEXITCODE
