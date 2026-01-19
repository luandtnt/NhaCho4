# Run All M1 Tests

Write-Host "`n=== URP M1 - RUN ALL TESTS ===`n" -ForegroundColor Cyan

# Check backend
Write-Host "[1/2] Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ErrorAction Stop
    Write-Host "Backend server is running`n" -ForegroundColor Green
} catch {
    Write-Host "Backend server is NOT running!" -ForegroundColor Red
    Write-Host "Please run: pnpm -C apps/backend dev`n" -ForegroundColor Yellow
    exit 1
}

# Run basic tests
Write-Host "[2/2] Running Basic Tests..." -ForegroundColor Yellow
Write-Host ("=" * 60)

& "$PSScriptRoot\test-m1.ps1"
$basicTestResult = $LASTEXITCODE

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "FINAL RESULTS" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($basicTestResult -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Basic Tests: PASS" -ForegroundColor Green
    Write-Host "`nM1 Foundation is ready!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Basic Tests: FAIL" -ForegroundColor Red
    Write-Host "`nPlease check the failed tests.`n" -ForegroundColor Yellow
    exit 1
}
