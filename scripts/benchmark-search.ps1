# Search Endpoint Benchmark Script
# Tests search performance under various conditions

$API_URL = "http://localhost:3000"
$ITERATIONS = 100

Write-Host "=== URP Search Benchmark ===" -ForegroundColor Cyan
Write-Host "API URL: $API_URL"
Write-Host "Iterations: $ITERATIONS"
Write-Host ""

# Test scenarios
$scenarios = @(
    @{ Name = "Simple search"; Query = "apartment" },
    @{ Name = "Search with filters"; Query = "apartment&minPrice=1000&maxPrice=5000" },
    @{ Name = "Geo search"; Query = "apartment&lat=10.8231&lng=106.6297&radius=5" },
    @{ Name = "Autocomplete"; Query = "apa" }
)

foreach ($scenario in $scenarios) {
    Write-Host "Testing: $($scenario.Name)" -ForegroundColor Yellow
    
    $times = @()
    $errors = 0
    
    for ($i = 1; $i -le $ITERATIONS; $i++) {
        $start = Get-Date
        
        try {
            $response = Invoke-WebRequest -Uri "$API_URL/api/v1/search/listings?q=$($scenario.Query)" `
                -Method GET `
                -TimeoutSec 10 `
                -ErrorAction Stop
            
            $end = Get-Date
            $duration = ($end - $start).TotalMilliseconds
            $times += $duration
            
            if ($i % 10 -eq 0) {
                Write-Host "  Progress: $i/$ITERATIONS" -NoNewline -ForegroundColor Gray
                Write-Host " (avg: $([math]::Round(($times | Measure-Object -Average).Average, 2))ms)" -ForegroundColor Gray
            }
        }
        catch {
            $errors++
            Write-Host "  Error on iteration $i" -ForegroundColor Red
        }
    }
    
    # Calculate statistics
    $sorted = $times | Sort-Object
    $p50 = $sorted[[math]::Floor($sorted.Count * 0.5)]
    $p95 = $sorted[[math]::Floor($sorted.Count * 0.95)]
    $p99 = $sorted[[math]::Floor($sorted.Count * 0.99)]
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host ""
    Write-Host "  Results:" -ForegroundColor Green
    Write-Host "    Min:     $([math]::Round($min, 2))ms"
    Write-Host "    Max:     $([math]::Round($max, 2))ms"
    Write-Host "    Average: $([math]::Round($avg, 2))ms"
    Write-Host "    p50:     $([math]::Round($p50, 2))ms"
    Write-Host "    p95:     $([math]::Round($p95, 2))ms"
    Write-Host "    p99:     $([math]::Round($p99, 2))ms"
    Write-Host "    Errors:  $errors"
    
    # Performance assessment
    if ($p95 -lt 500) {
        Write-Host "    Status:  PASS (p95 < 500ms)" -ForegroundColor Green
    }
    elseif ($p95 -lt 1000) {
        Write-Host "    Status:  WARNING (p95 < 1000ms)" -ForegroundColor Yellow
    }
    else {
        Write-Host "    Status:  FAIL (p95 >= 1000ms)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== Benchmark Complete ===" -ForegroundColor Cyan
