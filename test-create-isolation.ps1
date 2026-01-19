# Test create isolation
$baseUrl = "http://localhost:3000/api/v1"

# Login as landlord3
Write-Host "=== LOGIN AS landlord3@example.com ===" -ForegroundColor Cyan
$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token3 = $login3.access_token

# Get first asset for landlord3
$assets3 = Invoke-RestMethod -Uri "$baseUrl/assets?page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
$asset3 = $assets3.data[0]
Write-Host "Asset for landlord3: $($asset3.name)" -ForegroundColor Yellow

# Get space node
$spaceNodes3 = Invoke-RestMethod -Uri "$baseUrl/space-nodes?asset_id=$($asset3.id)&page=1&page_size=1" -Method GET -Headers @{
    Authorization = "Bearer $token3"
}
$spaceNode3 = $spaceNodes3.data[0]
Write-Host "Space node: $($spaceNode3.name)" -ForegroundColor Yellow

# Create rentable item for landlord3
Write-Host "`n=== CREATE RENTABLE ITEM FOR LANDLORD3 ===" -ForegroundColor Cyan
$newItem3 = Invoke-RestMethod -Uri "$baseUrl/rentable-items" -Method POST -Headers @{
    Authorization = "Bearer $token3"
} -Body (@{
    space_node_id = $spaceNode3.id
    code = "TEST-LANDLORD3-$(Get-Random -Maximum 9999)"
    allocation_type = "exclusive"
    property_category = "APARTMENT"
    rental_duration_type = "LONG_TERM"
    bedrooms = 2
    bathrooms = 1
    area_sqm = 50
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created item: $($newItem3.code) (ID: $($newItem3.id.Substring(0, 8))...)" -ForegroundColor Green
Write-Host "Landlord Party ID: $($newItem3.landlord_party_id)" -ForegroundColor Green

# Login as landlord4
Write-Host "`n=== LOGIN AS landlord4@example.com ===" -ForegroundColor Cyan
$login4 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token4 = $login4.access_token

# Try to get the item created by landlord3
Write-Host "`n=== TRY TO GET LANDLORD3'S ITEM AS LANDLORD4 ===" -ForegroundColor Cyan
try {
    $getItem = Invoke-RestMethod -Uri "$baseUrl/rentable-items/$($newItem3.id)" -Method GET -Headers @{
        Authorization = "Bearer $token4"
    }
    Write-Host "ERROR: Landlord4 CAN see landlord3's item!" -ForegroundColor Red
    Write-Host "Item: $($getItem.code)" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Landlord4 CANNOT see landlord3's item!" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Green
}

# Check if item appears in landlord4's list
Write-Host "`n=== CHECK IF ITEM IN LANDLORD4'S LIST ===" -ForegroundColor Cyan
$items4 = Invoke-RestMethod -Uri "$baseUrl/rentable-items?page=1&page_size=100" -Method GET -Headers @{
    Authorization = "Bearer $token4"
}
$found = $items4.data | Where-Object { $_.id -eq $newItem3.id }
if ($found) {
    Write-Host "ERROR: Item appears in landlord4's list!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Item does NOT appear in landlord4's list!" -ForegroundColor Green
}

Write-Host "`nLandlord4 total items: $($items4.meta.total)" -ForegroundColor Yellow
