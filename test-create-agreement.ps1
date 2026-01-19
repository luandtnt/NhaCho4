# Test Create Agreement API
# Kiểm tra xem API tạo hợp đồng có hoạt động không

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Agreement Creation API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as landlord
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
    Write-Host "[SUCCESS] Logged in successfully!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[FAIL] Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get available rentable items
Write-Host "2) Fetching available rentable items..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $items = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/rentable-items?page=1&page_size=10" `
        -Method Get `
        -Headers $headers
    
    $availableItems = $items.data | Where-Object { $_.status -eq "AVAILABLE" -or $_.status -eq "ACTIVE" }
    
    if ($availableItems.Count -eq 0) {
        Write-Host "[WARN] No AVAILABLE/ACTIVE items found!" -ForegroundColor Yellow
        Write-Host "Please create a rentable item first or check item status." -ForegroundColor Yellow
        exit 1
    }
    
    $firstItem = $availableItems[0]
    Write-Host "[SUCCESS] Found $($availableItems.Count) available items" -ForegroundColor Green
    Write-Host "Using item: $($firstItem.id) - Status: $($firstItem.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[FAIL] Failed to fetch items: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get tenant user ID (you need to replace this)
Write-Host "3) Preparing agreement data..." -ForegroundColor Yellow
Write-Host "[INFO] You need a valid tenant_party_id (User ID of a tenant)" -ForegroundColor Yellow
Write-Host "Enter tenant User ID (or press Enter to use test ID): " -NoNewline
$tenantId = Read-Host
if ([string]::IsNullOrWhiteSpace($tenantId)) {
    $tenantId = "tenant-test-123"
    Write-Host "Using test ID: $tenantId" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Create agreement
Write-Host "4) Creating agreement..." -ForegroundColor Yellow

$startDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$endDate = (Get-Date).AddMonths(12).ToString("yyyy-MM-dd")

$agreementBody = @{
    tenant_party_id = $tenantId
    rentable_item_id = $firstItem.id
    agreement_type = "lease"
    start_at = $startDate
    end_at = $endDate
    base_price = 5000000
    deposit_amount = 10000000
    service_fee = 200000
    building_mgmt_fee = 100000
    electricity_billing = "METER_PRIVATE"
    water_billing = "METER_PRIVATE"
    price_increase_percent = 5
    price_increase_frequency = "YEARLY"
    payment_cycle = "MONTHLY"
    landlord_notes = "Test agreement created via PowerShell script"
} | ConvertTo-Json

try {
    $agreement = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/agreements" `
        -Method Post `
        -Body $agreementBody `
        -ContentType "application/json" `
        -Headers $headers
    
    Write-Host "[SUCCESS] Agreement created!" -ForegroundColor Green
    Write-Host "Agreement ID: $($agreement.id)" -ForegroundColor Green
    Write-Host "State: $($agreement.state)" -ForegroundColor Green
    Write-Host "Base Price: $($agreement.base_price) VND" -ForegroundColor Green
    Write-Host "Start Date: $($agreement.start_at)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ TEST PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. View in frontend: http://localhost:5173/agreements/$($agreement.id)" -ForegroundColor White
    Write-Host "2. Send to tenant: POST /agreements/$($agreement.id)/send" -ForegroundColor White
    Write-Host "3. Test full flow in TEST_AGREEMENT_MODULE_NOW.md" -ForegroundColor White
    
} catch {
    Write-Host "[FAIL] Failed to create agreement!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Tenant ID doesn't exist in database" -ForegroundColor White
    Write-Host "- Rentable item already has an active agreement" -ForegroundColor White
    Write-Host "- Backend not running or wrong port" -ForegroundColor White
    exit 1
}
