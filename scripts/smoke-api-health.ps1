param(
    [string] $ApiBaseUrl = "http://127.0.0.1:8000/api/v1",
    [int] $TimeoutSec = 10
)

Set-StrictMode -Version Latest

$healthUrl = "${ApiBaseUrl}/health"

try {
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec $TimeoutSec
    if ($response.status -ne "ok") {
        Write-Error "API health check returned an unexpected status: $($response | ConvertTo-Json -Compress)"
        exit 1
    }

    $response | ConvertTo-Json -Compress
    exit 0
} catch {
    Write-Error "API health check failed for $healthUrl. $($_.Exception.Message)"
    exit 1
}
