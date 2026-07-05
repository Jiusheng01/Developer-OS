param(
    [string] $Revision = "head",
    [string] $DatabaseUrl = ""
)

Set-StrictMode -Version Latest
. "$PSScriptRoot\_dev-helpers.ps1"

$repoRoot = Get-DeveloperOsRepoRoot -ScriptsRoot $PSScriptRoot
$pythonPath = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$alembicConfig = Join-Path $repoRoot "backend\alembic.ini"

try {
    Assert-FileExists -Path $pythonPath -Message "Backend virtual environment was not found. Run: cd backend; python -m venv .venv; .\.venv\Scripts\Activate.ps1; python -m pip install -e `".[dev]`""
    Assert-FileExists -Path $alembicConfig -Message "Alembic config was not found at backend\alembic.ini."
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Running API database migration to revision: $Revision"
if ($DatabaseUrl.Trim()) {
    $env:DEVELOPER_OS_DATABASE_URL = $DatabaseUrl
    Write-Host "Using database URL from -DatabaseUrl."
}

Set-Location -LiteralPath $repoRoot
& $pythonPath -m alembic -c backend\alembic.ini upgrade $Revision
exit $LASTEXITCODE
