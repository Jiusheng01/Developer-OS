param(
    [string] $ApiBaseUrl = "http://127.0.0.1:8000/api/v1",
    [int] $TimeoutSec = 10,
    [string] $Email = "smoke@example.com",
    [string] $Username = "smoke_user",
    [string] $Password = "smoke-password"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:BaseUrl = $ApiBaseUrl.TrimEnd("/")
$script:RequestTimeoutSec = $TimeoutSec
$script:AuthToken = $null
$created = @{
    todo = $null
    learning = $null
    note = $null
    goal = $null
    goalTask = $null
}

function ConvertTo-RequestJson {
    param(
        [Parameter(Mandatory = $true)]
        [object] $Value
    )

    return ($Value | ConvertTo-Json -Depth 10)
}

function Invoke-ApiJson {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Method,
        [Parameter(Mandatory = $true)]
        [string] $Path,
        [object] $Body = $null
    )

    $parameters = @{
        Method = $Method
        Uri = "$script:BaseUrl$Path"
        TimeoutSec = $script:RequestTimeoutSec
        Headers = @{ Accept = "application/json" }
    }

    if ($script:AuthToken) {
        $parameters.Headers.Authorization = "Bearer $script:AuthToken"
    }

    if ($null -ne $Body) {
        $parameters.ContentType = "application/json"
        $parameters.Body = ConvertTo-RequestJson -Value $Body
    }

    return Invoke-RestMethod @parameters
}

function Get-StatusCode {
    param(
        [Parameter(Mandatory = $true)]
        [object] $ErrorRecord
    )

    $response = $ErrorRecord.Exception.Response
    if ($null -eq $response) {
        return $null
    }

    return [int] $response.StatusCode
}

function Initialize-SmokeAuth {
    $registerBody = @{
        email = $Email
        username = $Username
        password = $Password
        displayName = "Smoke User"
    }

    try {
        Invoke-ApiJson -Method "POST" -Path "/auth/register" -Body $registerBody | Out-Null
    } catch {
        $statusCode = Get-StatusCode -ErrorRecord $_
        if ($statusCode -ne 409) {
            throw
        }
    }

    $login = Invoke-ApiJson -Method "POST" -Path "/auth/login" -Body @{
        identifier = $Email
        password = $Password
    }
    $script:AuthToken = $login.accessToken
    if (-not $script:AuthToken) {
        throw "Auth smoke setup failed: login did not return accessToken."
    }
}

function Assert-Equal {
    param(
        [object] $Actual,
        [object] $Expected,
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if ($Actual -ne $Expected) {
        throw "$Message Expected '$Expected', got '$Actual'."
    }
}

function Assert-StartsWith {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Value,
        [Parameter(Mandatory = $true)]
        [string] $Prefix,
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if (-not $Value.StartsWith($Prefix, [System.StringComparison]::Ordinal)) {
        throw "$Message Expected prefix '$Prefix', got '$Value'."
    }
}

function Remove-SmokeResource {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    try {
        Invoke-ApiJson -Method "DELETE" -Path $Path | Out-Null
    } catch {
        # Best-effort cleanup only. The primary failure is reported by the smoke assertion.
    }
}

try {
    $suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)

    $health = Invoke-ApiJson -Method "GET" -Path "/health"
    Assert-Equal -Actual $health.status -Expected "ok" -Message "Health check failed."

    Initialize-SmokeAuth

    $todo = Invoke-ApiJson -Method "POST" -Path "/todos" -Body @{
        title = "smoke todo $suffix"
        priority = "high"
        tags = @("smoke", "api")
        dueDate = "2026-07-10"
    }
    $created.todo = $todo.id
    Assert-StartsWith -Value $todo.id -Prefix "todo-" -Message "Todo create failed."
    Assert-Equal -Actual $todo.title -Expected "smoke todo $suffix" -Message "Todo title mismatch."

    $todoUpdated = Invoke-ApiJson -Method "PATCH" -Path "/todos/$($todo.id)" -Body @{
        done = $true
        dueDate = $null
    }
    Assert-Equal -Actual $todoUpdated.done -Expected $true -Message "Todo update failed."
    Invoke-ApiJson -Method "DELETE" -Path "/todos/$($todo.id)" | Out-Null
    $created.todo = $null

    $learning = Invoke-ApiJson -Method "POST" -Path "/learning-items" -Body @{
        title = "smoke learning $suffix"
        area = "API Smoke"
        status = "active"
        progress = 25
        notes = "temporary smoke record"
        tags = @("smoke")
    }
    $created.learning = $learning.id
    Assert-StartsWith -Value $learning.id -Prefix "learning-" -Message "Learning create failed."

    $learningUpdated = Invoke-ApiJson -Method "PATCH" -Path "/learning-items/$($learning.id)" -Body @{
        progress = 80
        status = "review"
    }
    Assert-Equal -Actual $learningUpdated.progress -Expected 80 -Message "Learning update failed."
    Invoke-ApiJson -Method "DELETE" -Path "/learning-items/$($learning.id)" | Out-Null
    $created.learning = $null

    $note = Invoke-ApiJson -Method "POST" -Path "/notes" -Body @{
        title = "smoke note $suffix"
        body = "temporary smoke note"
        category = "Smoke"
        tags = @("smoke")
    }
    $created.note = $note.id
    Assert-StartsWith -Value $note.id -Prefix "note-" -Message "Note create failed."

    $noteUpdated = Invoke-ApiJson -Method "PATCH" -Path "/notes/$($note.id)" -Body @{
        body = "updated smoke note"
    }
    Assert-Equal -Actual $noteUpdated.body -Expected "updated smoke note" -Message "Note update failed."
    Invoke-ApiJson -Method "DELETE" -Path "/notes/$($note.id)" | Out-Null
    $created.note = $null

    $goal = Invoke-ApiJson -Method "POST" -Path "/goals" -Body @{
        title = "smoke goal $suffix"
        progress = 10
        status = "active"
        targetYear = "2026"
    }
    $created.goal = $goal.id
    Assert-StartsWith -Value $goal.id -Prefix "goal-" -Message "Goal create failed."

    $goalUpdated = Invoke-ApiJson -Method "PATCH" -Path "/goals/$($goal.id)" -Body @{
        progress = 55
    }
    Assert-Equal -Actual $goalUpdated.progress -Expected 55 -Message "Goal update failed."

    $goalTask = Invoke-ApiJson -Method "POST" -Path "/goals/$($goal.id)/tasks" -Body @{
        title = "smoke goal task $suffix"
    }
    $created.goalTask = $goalTask.id
    Assert-StartsWith -Value $goalTask.id -Prefix "goal-task-" -Message "Goal task create failed."

    $goalTaskUpdated = Invoke-ApiJson -Method "PATCH" -Path "/goals/$($goal.id)/tasks/$($goalTask.id)" -Body @{
        done = $true
    }
    Assert-Equal -Actual $goalTaskUpdated.done -Expected $true -Message "Goal task update failed."

    Invoke-ApiJson -Method "DELETE" -Path "/goals/$($goal.id)/tasks/$($goalTask.id)" | Out-Null
    $created.goalTask = $null
    Invoke-ApiJson -Method "DELETE" -Path "/goals/$($goal.id)" | Out-Null
    $created.goal = $null

    [ordered]@{
        status = "ok"
        service = "developer-os-api"
        checked = @("health", "todos", "learning-items", "notes", "goals", "goal-tasks")
    } | ConvertTo-Json -Compress
    exit 0
} catch {
    Write-Error "API CRUD smoke failed for $script:BaseUrl. $($_.Exception.Message)"
    exit 1
} finally {
    if ($created.goalTask -and $created.goal) {
        Remove-SmokeResource -Path "/goals/$($created.goal)/tasks/$($created.goalTask)"
    }
    if ($created.goal) {
        Remove-SmokeResource -Path "/goals/$($created.goal)"
    }
    if ($created.note) {
        Remove-SmokeResource -Path "/notes/$($created.note)"
    }
    if ($created.learning) {
        Remove-SmokeResource -Path "/learning-items/$($created.learning)"
    }
    if ($created.todo) {
        Remove-SmokeResource -Path "/todos/$($created.todo)"
    }
}
