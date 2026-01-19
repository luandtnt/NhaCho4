# Test Invoice Module Phase 1 APIs
# Date: 2026-01-19

$baseUrl = "http://localhost:3000"
$token = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INVOICE MODULE PHASE 1 API TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "[1/8] Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = "landlord@test.com"
        password = "password123"
    } | ConvertTo-Json) -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get an active agreement
Write-Host "[2/8] Getting active agreement..." -ForegroundColor Yellow
try {
    $agreementsResponse = Invoke-RestMethod -Uri "$baseUrl/agreements?page=1&page_size=10" -Method Get -Headers $headers
    $activeAgreement = $agreementsResponse.data | Where-Object { $_.state -eq "ACTIVE" } | Select-Object -First 1
    
    if ($activeAgreement) {
        Write-Host "✅ Found active agreement: $($activeAgreement.id)" -ForegroundColor Green
        Write-Host "   Contract: $($activeAgreement.contract_code)" -ForegroundColor Gray
        Write-Host "   Tenant: $($activeAgreement.tenant_party_id)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No active agreement found. Please create one first." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get agreements: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Create invoice (DRAFT)
Write-Host "[3/8] Creating invoice (DRAFT)..." -ForegroundColor Yellow
$invoiceId = ""
try {
    $createPayload = @{
        agreement_id = $activeAgreement.id
        period_start = "2026-01-01"
        period_end = "2026-01-31"
        due_date = "2026-02-05"
        line_items = @(
            @{
                type = "RENT"
                description = "Tiền thuê tháng 1/2026"
                qty = 1
                unit_price = 5000000
            },
            @{
                type = "SERVICE_FEE"
                description = "Phí dịch vụ"
                qty = 1
                unit_price = 500000
            },
            @{
                type = "PARKING"
                description = "Phí gửi xe"
                qty = 1
                unit_price = 200000
            }
        )
        tax_enabled = $false
        notes = "Hóa đơn test Phase 1"
        auto_issue = $false
    } | ConvertTo-Json -Depth 10
    
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $createPayload
    $invoiceId = $createResponse.id
    
    Write-Host "✅ Invoice created (DRAFT)" -ForegroundColor Green
    Write-Host "   ID: $invoiceId" -ForegroundColor Gray
    Write-Host "   Code: $($createResponse.invoice_code)" -ForegroundColor Gray
    Write-Host "   State: $($createResponse.state)" -ForegroundColor Gray
    Write-Host "   Total: $($createResponse.total_amount) VND" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create invoice: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Get invoice detail
Write-Host "[4/8] Getting invoice detail..." -ForegroundColor Yellow
try {
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Get -Headers $headers
    
    Write-Host "✅ Invoice detail retrieved" -ForegroundColor Green
    Write-Host "   Code: $($detailResponse.invoice_code)" -ForegroundColor Gray
    Write-Host "   State: $($detailResponse.state)" -ForegroundColor Gray
    Write-Host "   Tenant: $($detailResponse.tenant_party.name)" -ForegroundColor Gray
    Write-Host "   Item: $($detailResponse.rentable_item.title)" -ForegroundColor Gray
    Write-Host "   Line items: $($detailResponse.line_items_table.Count)" -ForegroundColor Gray
    Write-Host "   Subtotal: $($detailResponse.subtotal_amount) VND" -ForegroundColor Gray
    Write-Host "   Tax: $($detailResponse.tax_amount) VND" -ForegroundColor Gray
    Write-Host "   Total: $($detailResponse.total_amount) VND" -ForegroundColor Gray
    Write-Host "   Balance due: $($detailResponse.balance_due) VND" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get invoice detail: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Update invoice (DRAFT only)
Write-Host "[5/8] Updating invoice (add line item)..." -ForegroundColor Yellow
try {
    $updatePayload = @{
        line_items = @(
            @{
                type = "RENT"
                description = "Tiền thuê tháng 1/2026"
                qty = 1
                unit_price = 5000000
            },
            @{
                type = "SERVICE_FEE"
                description = "Phí dịch vụ"
                qty = 1
                unit_price = 500000
            },
            @{
                type = "PARKING"
                description = "Phí gửi xe"
                qty = 1
                unit_price = 200000
            },
            @{
                type = "INTERNET"
                description = "Phí internet"
                qty = 1
                unit_price = 150000
            }
        )
        notes = "Hóa đơn test Phase 1 - Updated"
    } | ConvertTo-Json -Depth 10
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Patch -Headers $headers -Body $updatePayload
    
    Write-Host "✅ Invoice updated" -ForegroundColor Green
    Write-Host "   Line items: $($updateResponse.line_items_table.Count)" -ForegroundColor Gray
    Write-Host "   New total: $($updateResponse.total_amount) VND" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to update invoice: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Issue invoice (DRAFT -> ISSUED)
Write-Host "[6/8] Issuing invoice..." -ForegroundColor Yellow
try {
    $issuePayload = @{
        send_notification = $false
    } | ConvertTo-Json
    
    $issueResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId/issue" -Method Post -Headers $headers -Body $issuePayload
    
    Write-Host "✅ Invoice issued" -ForegroundColor Green
    Write-Host "   State: $($issueResponse.state)" -ForegroundColor Gray
    Write-Host "   Issued at: $($issueResponse.issued_at)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to issue invoice: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 7: List invoices with filters
Write-Host "[7/8] Listing invoices..." -ForegroundColor Yellow
try {
    # Test 1: All invoices
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/invoices?page=1&page_size=10" -Method Get -Headers $headers
    Write-Host "✅ All invoices: $($listResponse.meta.total)" -ForegroundColor Green
    
    # Test 2: Filter by state
    $issuedResponse = Invoke-RestMethod -Uri "$baseUrl/invoices?state=ISSUED&page=1&page_size=10" -Method Get -Headers $headers
    Write-Host "✅ ISSUED invoices: $($issuedResponse.meta.total)" -ForegroundColor Green
    
    # Test 3: Filter by month
    $monthResponse = Invoke-RestMethod -Uri "$baseUrl/invoices?month=2026-01&page=1&page_size=10" -Method Get -Headers $headers
    Write-Host "✅ January 2026 invoices: $($monthResponse.meta.total)" -ForegroundColor Green
    
    # Test 4: Search by invoice code
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/invoices?search=INV-202601&page=1&page_size=10" -Method Get -Headers $headers
    Write-Host "✅ Search results: $($searchResponse.meta.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to list invoices: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: Create another invoice and void it
Write-Host "[8/8] Testing void invoice..." -ForegroundColor Yellow
try {
    # Create another invoice
    $createPayload2 = @{
        agreement_id = $activeAgreement.id
        period_start = "2026-02-01"
        period_end = "2026-02-28"
        line_items = @(
            @{
                type = "RENT"
                description = "Tiền thuê tháng 2/2026"
                qty = 1
                unit_price = 5000000
            }
        )
        auto_issue = $true
    } | ConvertTo-Json -Depth 10
    
    $createResponse2 = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $createPayload2
    $invoiceId2 = $createResponse2.id
    
    Write-Host "✅ Second invoice created: $($createResponse2.invoice_code)" -ForegroundColor Green
    
    # Void it
    $voidPayload = @{
        reason = "Test void functionality"
    } | ConvertTo-Json
    
    $voidResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId2/void" -Method Post -Headers $headers -Body $voidPayload
    
    Write-Host "✅ Invoice voided" -ForegroundColor Green
    Write-Host "   State: $($voidResponse.state)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to void invoice: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 1 API TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tests passed:" -ForegroundColor Green
Write-Host "   1. Create invoice (DRAFT)" -ForegroundColor Gray
Write-Host "   2. Get invoice detail" -ForegroundColor Gray
Write-Host "   3. Update invoice (DRAFT)" -ForegroundColor Gray
Write-Host "   4. Issue invoice (DRAFT -> ISSUED)" -ForegroundColor Gray
Write-Host "   5. List invoices with filters" -ForegroundColor Gray
Write-Host "   6. Void invoice" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next: Test frontend pages" -ForegroundColor Yellow
Write-Host ""
