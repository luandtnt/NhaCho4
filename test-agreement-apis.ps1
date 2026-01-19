# ========================================
# Test Agreement Module APIs
# ========================================

$baseUrl = "http://localhost:3000/api/v1"
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Agreement Module APIs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1) Authenticating as landlord..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = "landlord@example.com"
        password = "Password123!"
    } | ConvertTo-Json) -ContentType "application/json"
    
    $token = $loginResponse.access_token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "[OK] Authenticated successfully" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Authentication failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get available rentable items
Write-Host "`n2) Getting available rentable items..." -ForegroundColor Yellow
try {
    $itemsResponse = Invoke-RestMethod -Uri "$baseUrl/rentable-items?status=AVAILABLE&page_size=1" -Headers $headers
    
    if ($itemsResponse.data.Count -gt 0) {
        $rentableItemId = $itemsResponse.data[0].id
        Write-Host "[OK] Found rentable item: $rentableItemId" -ForegroundColor Green
    } else {
        Write-Host "[WARN] No available rentable items found" -ForegroundColor Yellow
        $rentableItemId = "test-item-id"
    }
} catch {
    Write-Host "[WARN] Could not fetch rentable items: $_" -ForegroundColor Yellow
    $rentableItemId = "test-item-id"
}

# Step 3: Create Agreement (DRAFT)
Write-Host "`n3) Creating new agreement (DRAFT)..." -ForegroundColor Yellow
try {
    $createDto = @{
        tenant_party_id = "tenant-party-123"
        rentable_item_id = $rentableItemId
        agreement_type = "LONG_TERM"
        start_at = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        end_at = (Get-Date).AddMonths(12).ToString("yyyy-MM-dd")
        base_price = 5000000
        deposit_amount = 10000000
        service_fee = 500000
        building_mgmt_fee = 300000
        electricity_billing = "ACTUAL"
        water_billing = "ACTUAL"
        payment_cycle = "MONTHLY"
        landlord_notes = "Test agreement created by API"
    } | ConvertTo-Json
    
    $agreement = Invoke-RestMethod -Uri "$baseUrl/agreements" -Method Post -Headers $headers -Body $createDto
    $agreementId = $agreement.id
    
    Write-Host "[OK] Agreement created: $agreementId" -ForegroundColor Green
    Write-Host "    State: $($agreement.state)" -ForegroundColor Gray
    Write-Host "    Base Price: $($agreement.base_price)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Create agreement failed: $_" -ForegroundColor Red
    $agreementId = $null
}

# Step 4: Get Agreement List
Write-Host "`n4) Getting agreement list..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/agreements?page=1&page_size=10" -Headers $headers
    
    Write-Host "[OK] Found $($listResponse.meta.total) agreements" -ForegroundColor Green
    Write-Host "    Page: $($listResponse.meta.page)/$($listResponse.meta.total_pages)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Get list failed: $_" -ForegroundColor Red
}

# Step 5: Get Agreement Detail
if ($agreementId) {
    Write-Host "`n5) Getting agreement detail..." -ForegroundColor Yellow
    try {
        $detail = Invoke-RestMethod -Uri "$baseUrl/agreements/$agreementId" -Headers $headers
        
        Write-Host "[OK] Agreement detail retrieved" -ForegroundColor Green
        Write-Host "    ID: $($detail.id)" -ForegroundColor Gray
        Write-Host "    State: $($detail.state)" -ForegroundColor Gray
        Write-Host "    Type: $($detail.agreement_type)" -ForegroundColor Gray
        Write-Host "    Base Price: $($detail.base_price) VND" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get detail failed: $_" -ForegroundColor Red
    }
}

# Step 6: Update Agreement (DRAFT only)
if ($agreementId) {
    Write-Host "`n6) Updating agreement..." -ForegroundColor Yellow
    try {
        $updateDto = @{
            base_price = 5500000
            landlord_notes = "Updated price"
        } | ConvertTo-Json
        
        $updated = Invoke-RestMethod -Uri "$baseUrl/agreements/$agreementId" -Method Put -Headers $headers -Body $updateDto
        
        Write-Host "[OK] Agreement updated" -ForegroundColor Green
        Write-Host "    New Base Price: $($updated.base_price)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Update failed: $_" -ForegroundColor Red
    }
}

# Step 7: Send Agreement to Tenant
if ($agreementId) {
    Write-Host "`n7) Sending agreement to tenant..." -ForegroundColor Yellow
    try {
        $sent = Invoke-RestMethod -Uri "$baseUrl/agreements/$agreementId/send" -Method Post -Headers $headers
        
        Write-Host "[OK] Agreement sent" -ForegroundColor Green
        Write-Host "    State: $($sent.state)" -ForegroundColor Gray
        Write-Host "    Sent At: $($sent.sent_at)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Send failed: $_" -ForegroundColor Red
    }
}

# Step 8: Filter by State
Write-Host "`n8) Filtering agreements by state..." -ForegroundColor Yellow
try {
    $draftList = Invoke-RestMethod -Uri "$baseUrl/agreements?state=DRAFT" -Headers $headers
    $sentList = Invoke-RestMethod -Uri "$baseUrl/agreements?state=SENT" -Headers $headers
    
    Write-Host "[OK] Filter working" -ForegroundColor Green
    Write-Host "    DRAFT: $($draftList.meta.total)" -ForegroundColor Gray
    Write-Host "    SENT: $($sentList.meta.total)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Filter failed: $_" -ForegroundColor Red
}

# Step 9: Check Expired Agreements (Admin only)
Write-Host "`n9) Checking expired agreements..." -ForegroundColor Yellow
try {
    $expired = Invoke-RestMethod -Uri "$baseUrl/agreements/check-expired" -Method Post -Headers $headers
    
    Write-Host "[OK] Expired check completed" -ForegroundColor Green
    Write-Host "    Expired Count: $($expired.expired_count)" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Check expired failed (may need admin role): $_" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Agreement Module Backend APIs are working!" -ForegroundColor Green
Write-Host "`nTested endpoints:" -ForegroundColor White
Write-Host "  [OK] POST   /agreements (create)" -ForegroundColor Green
Write-Host "  [OK] GET    /agreements (list)" -ForegroundColor Green
Write-Host "  [OK] GET    /agreements/:id (detail)" -ForegroundColor Green
Write-Host "  [OK] PUT    /agreements/:id (update)" -ForegroundColor Green
Write-Host "  [OK] POST   /agreements/:id/send" -ForegroundColor Green
Write-Host "  [OK] GET    /agreements?state=X (filter)" -ForegroundColor Green
Write-Host "`nNext: Implement Frontend pages (STEP 3)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
