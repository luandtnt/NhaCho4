# Test Pricing Policy Isolation
Write-Host "Testing Pricing Policy Isolation..." -ForegroundColor Cyan

# Login as landlord3
Write-Host "`n1. Login as landlord3@example.com..." -ForegroundColor Yellow
$loginResponse3 = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json)

$token3 = $loginResponse3.access_token
Write-Host "   Token: $($token3.Substring(0, 20))..." -ForegroundColor Green

# Get pricing policies for landlord3
Write-Host "`n2. Get pricing policies for landlord3..." -ForegroundColor Yellow
$policies3 = Invoke-RestMethod -Uri "http://localhost:3000/api/pricing-policies" -Method Get -Headers @{
    Authorization = "Bearer $token3"
}

Write-Host "   Total policies for landlord3: $($policies3.meta.total)" -ForegroundColor Green
Write-Host "   Policies:" -ForegroundColor White
$policies3.data | ForEach-Object {
    Write-Host "     - $($_.name)" -ForegroundColor Gray
}

# Login as landlord4
Write-Host "`n3. Login as landlord4@example.com..." -ForegroundColor Yellow
$loginResponse4 = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json)

$token4 = $loginResponse4.access_token
Write-Host "   Token: $($token4.Substring(0, 20))..." -ForegroundColor Green

# Get pricing policies for landlord4
Write-Host "`n4. Get pricing policies for landlord4..." -ForegroundColor Yellow
$policies4 = Invoke-RestMethod -Uri "http://localhost:3000/api/pricing-policies" -Method Get -Headers @{
    Authorization = "Bearer $token4"
}

Write-Host "   Total policies for landlord4: $($policies4.meta.total)" -ForegroundColor Green
Write-Host "   Policies:" -ForegroundColor White
$policies4.data | ForEach-Object {
    Write-Host "     - $($_.name)" -ForegroundColor Gray
}

# Check isolation
Write-Host "`n5. Checking isolation..." -ForegroundColor Yellow
if ($policies3.meta.total -eq 4 -and $policies4.meta.total -eq 8) {
    Write-Host "   SUCCESS: Landlords see different policies!" -ForegroundColor Green
    Write-Host "   - Landlord3 sees 4 policies" -ForegroundColor Green
    Write-Host "   - Landlord4 sees 8 policies" -ForegroundColor Green
} else {
    Write-Host "   FAILED: Isolation not working correctly" -ForegroundColor Red
    Write-Host "   - Landlord3 sees $($policies3.meta.total) policies (expected 4)" -ForegroundColor Red
    Write-Host "   - Landlord4 sees $($policies4.meta.total) policies (expected 8)" -ForegroundColor Red
}
