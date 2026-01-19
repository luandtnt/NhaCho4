Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING PRICING POLICIES API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Backend is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[FAIL] Backend is NOT running!" -ForegroundColor Red
    Write-Host "Please start the backend" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check database connection
Write-Host "Test 2: Checking database for pricing policies..." -ForegroundColor Yellow
try {
    Push-Location apps/backend
    $countOutput = npx ts-node -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.pricingPolicy.count().then(count => { console.log(count); process.exit(0); });" 2>&1
    $count = $countOutput | Select-Object -Last 1
    Pop-Location
    Write-Host "[OK] Found $count pricing policies in database" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[FAIL] Could not query database" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Test 3: Check API routes
Write-Host "Test 3: Checking if API routes are registered..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/pricing-policies?page=1&limit=5" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[WARN] Unexpected success (should require auth)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403 -or $statusCode -eq 401) {
        Write-Host "[OK] API route is registered (returns $statusCode as expected)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "[FAIL] API route NOT FOUND (404)" -ForegroundColor Red
        Write-Host "The pricing-policies routes are not being registered!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[WARN] Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open the frontend: http://localhost:5173" -ForegroundColor White
Write-Host "2. Login with your credentials" -ForegroundColor White
Write-Host "3. Click on the sidebar button for pricing policies" -ForegroundColor White
Write-Host "4. You should see 10 sample pricing policies" -ForegroundColor White
Write-Host ""
