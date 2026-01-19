# Load Testing Script
# Simulates concurrent users accessing the API

param(
    [int]$ConcurrentUsers = 50,
    [int]$DurationSeconds = 60,
    [string]$ApiUrl = "http://localhost:3000"
)

Write-Host "=== URP Load Test ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host "Concurrent Users: $ConcurrentUsers"
Write-Host "Duration: $DurationSeconds seconds"
Write-Host ""

# Login to get token
Write-Host "Authenticating..." -ForegroundColor Yellow
$loginBody = @{
    email = "landlord@example.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "Authentication successful" -ForegroundColor Green
}
catch {
    Write-Host "Authentication failed: $_" -ForegroundColor Red
    exit 1
}

# Test endpoints
$endpoints = @(
    @{ Method = "GET"; Path = "/api/v1/listings"; Weight = 40 },
    @{ Method = "GET"; Path = "/api/v1/search/listings?q=apartment"; Weight = 30 },
    @{ Method = "GET"; Path = "/api/v1/assets"; Weight = 15 },
    @{ Method = "GET"; Path = "/api/v1/agreements"; Weight = 10 },
    @{ Method = "GET"; Path = "/api/v1/invoices"; Weight = 5 }
)

# Shared variables for results
$script:totalRequests = 0
$script:successfulRequests = 0
$script:failedRequests = 0
$script:responseTimes = [System.Collections.Concurrent.ConcurrentBag[double]]::new()

# Worker function
$workerScript = {
    param($ApiUrl, $Token, $Endpoints, $EndTime, $ResultBag, $SuccessCounter, $FailCounter, $TotalCounter)
    
    while ((Get-Date) -lt $EndTime) {
        # Select random endpoint based on weight
        $random = Get-Random -Minimum 0 -Maximum 100
        $cumulative = 0
        $selectedEndpoint = $null
        
        foreach ($ep in $Endpoints) {
            $cumulative += $ep.Weight
            if ($random -lt $cumulative) {
                $selectedEndpoint = $ep
                break
            }
        }
        
        if (-not $selectedEndpoint) {
            $selectedEndpoint = $Endpoints[0]
        }
        
        $start = Get-Date
        
        try {
            $headers = @{
                "Authorization" = "Bearer $Token"
            }
            
            $response = Invoke-WebRequest -Uri "$ApiUrl$($selectedEndpoint.Path)" `
                -Method $selectedEndpoint.Method `
                -Headers $headers `
                -TimeoutSec 10 `
                -ErrorAction Stop
            
            $end = Get-Date
            $duration = ($end - $start).TotalMilliseconds
            
            [void]$ResultBag.Add($duration)
            [System.Threading.Interlocked]::Increment([ref]$SuccessCounter)
        }
        catch {
            [System.Threading.Interlocked]::Increment([ref]$FailCounter)
        }
        
        [System.Threading.Interlocked]::Increment([ref]$TotalCounter)
        
        # Small delay to prevent overwhelming
        Start-Sleep -Milliseconds 100
    }
}

# Start load test
Write-Host "Starting load test..." -ForegroundColor Yellow
$startTime = Get-Date
$endTime = $startTime.AddSeconds($DurationSeconds)

$jobs = @()
for ($i = 1; $i -le $ConcurrentUsers; $i++) {
    $job = Start-Job -ScriptBlock $workerScript -ArgumentList @(
        $ApiUrl,
        $token,
        $endpoints,
        $endTime,
        $script:responseTimes,
        ([ref]$script:successfulRequests),
        ([ref]$script:failedRequests),
        ([ref]$script:totalRequests)
    )
    $jobs += $job
}

# Monitor progress
$lastTotal = 0
while ((Get-Date) -lt $endTime) {
    Start-Sleep -Seconds 5
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)
    $remaining = $DurationSeconds - $elapsed
    $currentTotal = $script:totalRequests
    $rps = [math]::Round(($currentTotal - $lastTotal) / 5, 2)
    $lastTotal = $currentTotal
    
    Write-Host "  Progress: ${elapsed}s / ${DurationSeconds}s | Requests: $currentTotal | RPS: $rps" -ForegroundColor Gray
}

# Wait for all jobs to complete
Write-Host "Waiting for workers to finish..." -ForegroundColor Yellow
$jobs | Wait-Job | Out-Null
$jobs | Remove-Job

# Calculate results
$actualDuration = ((Get-Date) - $startTime).TotalSeconds
$times = $script:responseTimes.ToArray()

if ($times.Count -gt 0) {
    $sorted = $times | Sort-Object
    $p50 = $sorted[[math]::Floor($sorted.Count * 0.5)]
    $p95 = $sorted[[math]::Floor($sorted.Count * 0.95)]
    $p99 = $sorted[[math]::Floor($sorted.Count * 0.99)]
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
}
else {
    $p50 = $p95 = $p99 = $avg = $min = $max = 0
}

$rps = [math]::Round($script:totalRequests / $actualDuration, 2)
$errorRate = if ($script:totalRequests -gt 0) { 
    [math]::Round(($script:failedRequests / $script:totalRequests) * 100, 2) 
} else { 
    0 
}

# Display results
Write-Host ""
Write-Host "=== Load Test Results ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Duration:           $([math]::Round($actualDuration, 2))s"
Write-Host "Total Requests:     $($script:totalRequests)"
Write-Host "Successful:         $($script:successfulRequests)"
Write-Host "Failed:             $($script:failedRequests)"
Write-Host "Requests/sec:       $rps"
Write-Host "Error Rate:         $errorRate%"
Write-Host ""
Write-Host "Response Times:" -ForegroundColor Yellow
Write-Host "  Min:     $([math]::Round($min, 2))ms"
Write-Host "  Max:     $([math]::Round($max, 2))ms"
Write-Host "  Average: $([math]::Round($avg, 2))ms"
Write-Host "  p50:     $([math]::Round($p50, 2))ms"
Write-Host "  p95:     $([math]::Round($p95, 2))ms"
Write-Host "  p99:     $([math]::Round($p99, 2))ms"
Write-Host ""

# Performance assessment
$passed = $true
if ($errorRate -gt 5) {
    Write-Host "FAIL: Error rate > 5%" -ForegroundColor Red
    $passed = $false
}
if ($p95 -gt 1000) {
    Write-Host "FAIL: p95 response time > 1000ms" -ForegroundColor Red
    $passed = $false
}
if ($rps -lt 50) {
    Write-Host "WARNING: RPS < 50" -ForegroundColor Yellow
}

if ($passed) {
    Write-Host "PASS: Load test successful" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Load Test Complete ===" -ForegroundColor Cyan
