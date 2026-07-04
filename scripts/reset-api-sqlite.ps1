param(
    [switch] $Force
)

Set-StrictMode -Version Latest
. "$PSScriptRoot\_dev-helpers.ps1"

$repoRoot = Get-DeveloperOsRepoRoot -ScriptsRoot $PSScriptRoot
$databasePath = Join-Path $repoRoot "backend\developer_os.db"

if (-not (Test-Path -LiteralPath $databasePath -PathType Leaf)) {
    Write-Host "No SQLite database found at backend\developer_os.db."
    exit 0
}

if (-not $Force) {
    Write-Host "This will delete backend\developer_os.db and reset local API data."
    $confirmation = Read-Host "Type DELETE to continue"
    if ($confirmation -ne "DELETE") {
        Write-Host "Reset cancelled."
        exit 1
    }
}

Remove-Item -LiteralPath $databasePath -Force
Write-Host "Deleted backend\developer_os.db."
