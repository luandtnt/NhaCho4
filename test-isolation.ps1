# Test landlord isolation
$baseUrl = "http://localhost:3000/api/v1"

# Login as landlord3
Write-Host "=== LOGIN AS landlord3@example.com ===" -ForegroundColor Cyan
$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"

$token3 = $login3.access_token
Write-Host "Token: $($token3.Substring(0, 20))..." -ForegroundColor Green

# Get listings for landlord3
Write-Host "`n=== LISTINGS FOR LANDLORD3 ===" -ForegroundColor Cyan
$listings3 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=5" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
Write-Host "Total listings: $($listings3.meta.total)" -ForegroundColor Yellow
$listings3.data | ForEach-Object {
    Write-Host "  - $($_.title) (ID: $($_.id.Substring(0, 8))...)" -ForegroundColor White
}

# Login as landlord4
Write-Host "`n=== LOGIN AS landlord4@example.com ===" -ForegroundColor Cyan
$login4 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"

$token4 = $login4.access_token
Write-Host "Token: $($token4.Substring(0, 20))..." -ForegroundColor Green

# Get listings for landlord4
Write-Host "`n=== LISTINGS FOR LANDLORD4 ===" -ForegroundColor Cyan
$listings4 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=5" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
Write-Host "Total listings: $($listings4.meta.total)" -ForegroundColor Yellow
$listings4.data | ForEach-Object {
    Write-Host "  - $($_.title) (ID: $($_.id.Substring(0, 8))...)" -ForegroundColor White
}

# Compare
Write-Host "`n=== COMPARISON ===" -ForegroundColor Magenta
if ($listings3.meta.total -eq $listings4.meta.total) {
    Write-Host "WARNING: Both landlords see same number of listings!" -ForegroundColor Red
    Write-Host "Isolation is NOT working!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Landlords see different listings!" -ForegroundColor Green
    Write-Host "Landlord3: $($listings3.meta.total) listings" -ForegroundColor Green
    Write-Host "Landlord4: $($listings4.meta.total) listings" -ForegroundColor Green
}
