# Test create listing isolation
$baseUrl = "http://localhost:3000/api/v1"

# Login as landlord3
Write-Host "=== LOGIN AS landlord3@example.com ===" -ForegroundColor Cyan
$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token3 = $login3.access_token

# Count listings before
$before3 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
Write-Host "Landlord3 listings before: $($before3.meta.total)" -ForegroundColor Yellow

# Create listing for landlord3
Write-Host "`n=== CREATE LISTING FOR LANDLORD3 ===" -ForegroundColor Cyan
$newListing = Invoke-RestMethod -Uri "$baseUrl/listings" -Method POST -Headers @{
    Authorization = "Bearer $token3"
} -Body (@{
    title = "TEST LISTING LANDLORD3 - $(Get-Date -Format 'HH:mm:ss')"
    description = "This is a test listing created by landlord3"
    pricing_display = @{
        from_amount = 5000000
        currency = "VND"
        unit = "MONTH"
    }
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created listing: $($newListing.title)" -ForegroundColor Green
Write-Host "Listing ID: $($newListing.id.Substring(0, 8))..." -ForegroundColor Green
Write-Host "Landlord Party ID: $($newListing.landlord_party_id.Substring(0, 8))..." -ForegroundColor Green

# Count listings after
$after3 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
Write-Host "Landlord3 listings after: $($after3.meta.total)" -ForegroundColor Yellow

# Login as landlord4
Write-Host "`n=== LOGIN AS landlord4@example.com ===" -ForegroundColor Cyan
$login4 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token4 = $login4.access_token

# Count landlord4's listings
$listings4 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
Write-Host "Landlord4 listings: $($listings4.meta.total)" -ForegroundColor Yellow

# Try to get the listing created by landlord3
Write-Host "`n=== TRY TO GET LANDLORD3'S LISTING AS LANDLORD4 ===" -ForegroundColor Cyan
try {
    $getListing = Invoke-RestMethod -Uri "$baseUrl/listings/$($newListing.id)" -Method GET -Headers @{
        Authorization = "Bearer $token4"
    }
    Write-Host "ERROR: Landlord4 CAN see landlord3's listing!" -ForegroundColor Red
    Write-Host "Listing: $($getListing.title)" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Landlord4 CANNOT see landlord3's listing!" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# Check if listing appears in landlord4's full list
Write-Host "`n=== CHECK IF LISTING IN LANDLORD4'S LIST ===" -ForegroundColor Cyan
$allListings4 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=100" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
$found = $allListings4.data | Where-Object { $_.id -eq $newListing.id }
if ($found) {
    Write-Host "ERROR: Listing appears in landlord4's list!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Listing does NOT appear in landlord4's list!" -ForegroundColor Green
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Landlord3 listings: $($after3.meta.total) (was $($before3.meta.total))" -ForegroundColor White
Write-Host "Landlord4 listings: $($listings4.meta.total)" -ForegroundColor White
if ($listings4.meta.total -eq $before3.meta.total) {
    Write-Host "ERROR: Landlord4 count increased!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Landlord4 count unchanged!" -ForegroundColor Green
}
