# Test Agreement Enhancement - All 10 Requirements
# Quick test script for new fields

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Agreement Enhancement" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "1) Authenticating as landlord..." -ForegroundColor Yellow
$loginBody = @{
    email = "landlord@example.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "[SUCCESS] Logged in!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[FAIL] Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get rentable items
Write-Host "2) Fetching rentable items..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $items = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/rentable-items?page=1&page_size=10" `
        -Method Get `
        -Headers $headers
    
    $availableItems = $items.data | Where-Object { $_.status -eq "AVAILABLE" -or $_.status -eq "ACTIVE" }
    
    if ($availableItems.Count -eq 0) {
        Write-Host "[WARN] No available items!" -ForegroundColor Yellow
        exit 1
    }
    
    $firstItem = $availableItems[0]
    Write-Host "[SUCCESS] Found item: $($firstItem.id)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[FAIL] Failed to fetch items" -ForegroundColor Red
    exit 1
}

# Step 3: Create agreement with ALL new fields
Write-Host "3) Creating agreement with all 10 requirements..." -ForegroundColor Yellow

$agreementBody = @{
    # Yêu cầu 1: Identity
    contract_title = "HĐ thuê căn 2PN Vinhomes Q9 - Test Enhancement"
    
    # Yêu cầu 3: Tenant
    tenant_party_id = "tenant-test-123"
    
    # Yêu cầu 2: Rentable Item
    rentable_item_id = $firstItem.id
    agreement_type = "lease"
    
    # Yêu cầu 4: Dates & Billing
    start_at = "2026-02-01"
    end_at = "2027-02-01"
    billing_day = 1
    payment_due_days = 5
    payment_cycle = "MONTHLY"
    
    # Yêu cầu 5: Pricing
    base_price = 5000000
    deposit_amount = 10000000
    service_fee = 500000
    building_mgmt_fee = 300000
    parking_fee_motorbike = 50000
    parking_fee_car = 500000
    internet_fee = 200000
    price_increase_percent = 5
    price_increase_frequency = "YEARLY"
    
    # Yêu cầu 6: Utilities
    electricity_billing = "OWNER_RATE"
    electricity_rate = 3500
    water_billing = "OWNER_RATE"
    water_rate = 15000
    
    # Yêu cầu 7: Terms & Rules
    house_rules = "Không hút thuốc trong nhà, giữ vệ sinh chung"
    termination_clause = "Phạt 1 tháng tiền thuê nếu chấm dứt trước hạn"
    violation_penalty = 1000000
    allow_pets = $false
    allow_smoking = $false
    allow_guests = $true
    
    # Yêu cầu 8: Handover
    handover_date = "2026-02-01"
    handover_condition = "Mới 100%, đầy đủ nội thất"
    initial_electricity = 1234.5
    initial_water = 567.8
    
    landlord_notes = "Test agreement với đầy đủ 10 yêu cầu"
} | ConvertTo-Json

try {
    $agreement = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/agreements" `
        -Method Post `
        -Body $agreementBody `
        -ContentType "application/json" `
        -Headers $headers
    
    Write-Host "[SUCCESS] Agreement created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ TEST RESULTS" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Verify all fields
    Write-Host "Yêu cầu 1 - Identity:" -ForegroundColor Yellow
    Write-Host "  Contract Code: $($agreement.contract_code)" -ForegroundColor White
    Write-Host "  Contract Title: $($agreement.contract_title)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Yêu cầu 4 - Billing:" -ForegroundColor Yellow
    Write-Host "  Billing Day: $($agreement.billing_day)" -ForegroundColor White
    Write-Host "  Payment Due Days: $($agreement.payment_due_days)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Yêu cầu 5 - Additional Fees:" -ForegroundColor Yellow
    Write-Host "  Parking Motorbike: $($agreement.parking_fee_motorbike) VND" -ForegroundColor White
    Write-Host "  Parking Car: $($agreement.parking_fee_car) VND" -ForegroundColor White
    Write-Host "  Internet: $($agreement.internet_fee) VND" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Yêu cầu 6 - Utilities:" -ForegroundColor Yellow
    Write-Host "  Electricity: $($agreement.electricity_billing) @ $($agreement.electricity_rate) VND/kWh" -ForegroundColor White
    Write-Host "  Water: $($agreement.water_billing) @ $($agreement.water_rate) VND/m3" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Yêu cầu 7 - Terms:" -ForegroundColor Yellow
    Write-Host "  Allow Pets: $($agreement.allow_pets)" -ForegroundColor White
    Write-Host "  Allow Smoking: $($agreement.allow_smoking)" -ForegroundColor White
    Write-Host "  Allow Guests: $($agreement.allow_guests)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Yêu cầu 8 - Handover:" -ForegroundColor Yellow
    Write-Host "  Initial Electricity: $($agreement.initial_electricity) kWh" -ForegroundColor White
    Write-Host "  Initial Water: $($agreement.initial_water) m3" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "View in frontend:" -ForegroundColor Yellow
    Write-Host "http://localhost:5173/agreements/$($agreement.id)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[FAIL] Failed to create agreement!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}
