Set-StrictMode -Version Latest

function Get-DeveloperOsRepoRoot {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ScriptsRoot
    )

    return (Resolve-Path -LiteralPath (Join-Path $ScriptsRoot "..")).Path
}

function Assert-FileExists {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path,
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw $Message
    }
}

function Assert-PortAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port,
        [string] $ServiceName = "service"
    )

    try {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    } catch {
        return
    }

    if ($listeners) {
        throw "$ServiceName port $Port is already in use. Stop the listening process or rerun with a different -Port."
    }
}

function Assert-NoNextDevServerLock {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FrontendRoot
    )

    $lockPath = Join-Path $FrontendRoot ".next\dev\lock"
    if (-not (Test-Path -LiteralPath $lockPath -PathType Leaf)) {
        return
    }

    $relativeLockPath = "frontend\.next\dev\lock"
    $relativeLogPath = "frontend\.next\dev\logs\next-development.log"
    throw "Another Next.js dev server may already be running for this frontend project. Stop the existing server before switching local/API mode. If you have confirmed no Node dev server is running, delete the stale lock at $relativeLockPath. Recent logs: $relativeLogPath."
}

function Get-NpmExecutable {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npm) {
        $npm = Get-Command npm -ErrorAction SilentlyContinue
    }

    if ($null -eq $npm) {
        throw "npm was not found on PATH. Install Node.js before starting the frontend."
    }

    return $npm.Source
}
