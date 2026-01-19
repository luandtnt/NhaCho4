# Test pricing policy isolation
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "=== LOGIN AS landlord3@example.com ===" -ForegroundColor Cyan
$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token3 = $login3.access_token

# Count before
$before3 = Invoke-RestMethod -Uri "$baseUrl/pricing-policies?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
Write-Host "Landlord3 policies before: $($before3.total)" -ForegroundColor Yellow

# Create new policy
Write-Host "`n=== CREATE PRICING POLICY FOR LANDLORD3 ===" -ForegroundColor Cyan
$newPolicy = Invoke-RestMethod -Uri "$baseUrl/pricing-policies" -Method POST -Headers @{
    Authorization = "Bearer $token3"
} -Body (@{
    name = "TEST POLICY LANDLORD3 - $(Get-Date -Format 'HH:mm:ss')"
    description = "Test policy created by landlord3"
    property_category = "APARTMENT"
    rental_duration_type = "LONG_TERM"
    pricing_mode = "FIXED"
    base_price = 5000000
    price_unit = "MONTH"
    min_rent_duration = 6
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created policy: $($newPolicy.name)" -ForegroundColor Green
Write-Host "Policy ID: $($newPolicy.id.Substring(0, 8))..." -ForegroundColor Green
Write-Host "Landlord Party ID: $($newPolicy.landlord_party_id)" -ForegroundColor Green

# Count after
$after3 = Invoke-RestMethod -Uri "$baseUrl/pricing-policies?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
Write-Host "Landlord3 policies after: $($after3.total)" -ForegroundColor Yellow

# Login as landlord4
Write-Host "`n=== LOGIN AS landlord4@example.com ===" -ForegroundColor Cyan
$login4 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token4 = $login4.access_token

# Count landlord4's policies
$policies4 = Invoke-RestMethod -Uri "$baseUrl/pricing-policies?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
Write-Host "Landlord4 policies: $($policies4.total)" -ForegroundColor Yellow

# Try to get the policy created by landlord3
Write-Host "`n=== TRY TO GET LANDLORD3'S POLICY AS LANDLORD4 ===" -ForegroundColor Cyan
try {
    $getPolicy = Invoke-RestMethod -Uri "$baseUrl/pricing-policies/$($newPolicy.id)" -Method GET -Headers @{
        Authorization = "Bearer $token4"
    }
    Write-Host "ERROR: Landlord4 CAN see landlord3's policy!" -ForegroundColor Red
    Write-Host "Policy: $($getPolicy.name)" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Landlord4 CANNOT see landlord3's policy!" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# Check if policy appears in landlord4's list
Write-Host "`n=== CHECK IF POLICY IN LANDLORD4'S LIST ===" -ForegroundColor Cyan
$allPolicies4 = Invoke-RestMethod -Uri "$baseUrl/pricing-policies?page=1&page_size=100" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
$found = $allPolicies4.data | Where-Object { $_.id -eq $newPolicy.id }
if ($found) {
    Write-Host "ERROR: Policy appears in landlord4's list!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Policy does NOT appear in landlord4's list!" -ForegroundColor Green
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Landlord3 policies: $($after3.total) (was $($before3.total))" -ForegroundColor White
Write-Host "Landlord4 policies: $($policies4.total)" -ForegroundColor White
