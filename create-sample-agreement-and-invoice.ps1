# Create Sample Agreement and Invoice for Testing
# Date: 2026-01-19

$baseUrl = "http://localhost:3000/api/v1"
$token = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CREATE SAMPLE DATA FOR INVOICE TESTING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "[1/3] Logging in as landlord..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = "landlord@example.com"
        password = "Password123!"
    } | ConvertTo-Json) -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "OK: Login successful" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Login failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get rentable item
Write-Host "[2/3] Getting rentable item..." -ForegroundColor Yellow
try {
    $itemsResponse = Invoke-RestMethod -Uri "$baseUrl/rentable-items?page=1&page_size=10" -Method Get -Headers $headers
    $rentableItem = $itemsResponse.data | Select-Object -First 1
    
    if ($rentableItem) {
        Write-Host "OK: Found rentable item: $($rentableItem.id)" -ForegroundColor Green
    } else {
        Write-Host "ERROR: No rentable item found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to get rentable items" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Create agreement
Write-Host "[3/3] Creating agreement..." -ForegroundColor Yellow
try {
    $agreementPayload = @{
        tenant_party_id = "00000000-0000-0000-0000-000000000002"
        rentable_item_id = $rentableItem.id
        contract_title = "Sample Agreement for Invoice Testing"
        agreement_type = "lease"
        start_at = "2026-01-01T00:00:00Z"
        end_at = "2026-12-31T23:59:59Z"
        billing_day = 1
        payment_due_days = 5
        base_price = 5000000
        deposit_amount = 10000000
        service_fee = 500000
        building_mgmt_fee = 300000
        parking_fee_motorbike = 100000
        internet_fee = 150000
        electricity_billing = "OWNER_RATE"
        electricity_rate = 3500
        water_billing = "OWNER_RATE"
        water_rate = 15000
        payment_cycle = "MONTHLY"
        house_rules = "No pets, No smoking"
        allow_pets = $false
        allow_smoking = $false
        allow_guests = $true
    } | ConvertTo-Json -Depth 10
    
    $agreementResponse = Invoke-RestMethod -Uri "$baseUrl/agreements" -Method Post -Headers $headers -Body $agreementPayload
    
    Write-Host "OK: Agreement created (DRAFT)" -ForegroundColor Green
    Write-Host "   ID: $($agreementResponse.id)" -ForegroundColor Gray
    Write-Host "   Code: $($agreementResponse.contract_code)" -ForegroundColor Gray
    Write-Host "   State: $($agreementResponse.state)" -ForegroundColor Gray
    
    # Send agreement
    Write-Host "   Sending agreement..." -ForegroundColor Gray
    $sendResponse = Invoke-RestMethod -Uri "$baseUrl/agreements/$($agreementResponse.id)/send" -Method Post -Headers $headers -Body "{}" -ContentType "application/json"
    
    # Confirm agreement (as tenant would do)
    Write-Host "   Confirming agreement..." -ForegroundColor Gray
    $confirmResponse = Invoke-RestMethod -Uri "$baseUrl/agreements/$($agreementResponse.id)/confirm" -Method Post -Headers $headers -Body "{}" -ContentType "application/json"
    
    # Activate agreement
    Write-Host "   Activating agreement..." -ForegroundColor Gray
    $activateResponse = Invoke-RestMethod -Uri "$baseUrl/agreements/$($agreementResponse.id)/activate" -Method Post -Headers $headers -Body "{}" -ContentType "application/json"
    
    Write-Host "OK: Agreement activated" -ForegroundColor Green
    Write-Host "   State: $($activateResponse.state)" -ForegroundColor Gray
    Write-Host "   Base price: $($activateResponse.base_price) VND" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to create agreement" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SAMPLE DATA CREATED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now test invoice APIs:" -ForegroundColor Yellow
Write-Host "  .\test-invoice-apis-simple.ps1" -ForegroundColor Gray
Write-Host ""
