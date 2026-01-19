# Test Invoice Module Phase 1 APIs - Simple Version
# Date: 2026-01-19

$baseUrl = "http://localhost:3000/api/v1"
$token = ""

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "INVOICE MODULE PHASE 1 API TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "[1/7] Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = "landlord@example.com"
        password = "Password123!"
    } | ConvertTo-Json) -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "OK: Login successful" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get active agreement
Write-Host "[2/7] Getting active agreement..." -ForegroundColor Yellow
try {
    $agreementsResponse = Invoke-RestMethod -Uri "$baseUrl/agreements?page=1&page_size=10" -Method Get -Headers $headers
    $activeAgreement = $agreementsResponse.data | Where-Object { $_.state -eq "ACTIVE" } | Select-Object -First 1
    
    if ($activeAgreement) {
        Write-Host "OK: Found active agreement: $($activeAgreement.id)" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No active agreement found" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to get agreements: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Create invoice (DRAFT)
Write-Host "[3/7] Creating invoice (DRAFT)..." -ForegroundColor Yellow
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
                description = "Tien thue thang 1/2026"
                qty = 1
                unit_price = 5000000
            },
            @{
                type = "SERVICE_FEE"
                description = "Phi dich vu"
                qty = 1
                unit_price = 500000
            }
        )
        tax_enabled = $false
        notes = "Hoa don test Phase 1"
        auto_issue = $false
    } | ConvertTo-Json -Depth 10
    
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $createPayload
    $invoiceId = $createResponse.id
    
    Write-Host "OK: Invoice created (DRAFT)" -ForegroundColor Green
    Write-Host "   ID: $invoiceId" -ForegroundColor Gray
    Write-Host "   Code: $($createResponse.invoice_code)" -ForegroundColor Gray
    Write-Host "   State: $($createResponse.state)" -ForegroundColor Gray
    Write-Host "   Total: $($createResponse.total_amount) VND" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to create invoice" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Get invoice detail
Write-Host "[4/7] Getting invoice detail..." -ForegroundColor Yellow
try {
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Get -Headers $headers
    
    Write-Host "OK: Invoice detail retrieved" -ForegroundColor Green
    Write-Host "   Code: $($detailResponse.invoice_code)" -ForegroundColor Gray
    Write-Host "   State: $($detailResponse.state)" -ForegroundColor Gray
    Write-Host "   Line items: $($detailResponse.line_items_table.Count)" -ForegroundColor Gray
    Write-Host "   Total: $($detailResponse.total_amount) VND" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get invoice detail" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Update invoice
Write-Host "[5/7] Updating invoice..." -ForegroundColor Yellow
try {
    $updatePayload = @{
        line_items = @(
            @{
                type = "RENT"
                description = "Tien thue thang 1/2026"
                qty = 1
                unit_price = 5000000
            },
            @{
                type = "SERVICE_FEE"
                description = "Phi dich vu"
                qty = 1
                unit_price = 500000
            },
            @{
                type = "PARKING"
                description = "Phi gui xe"
                qty = 1
                unit_price = 200000
            }
        )
        notes = "Hoa don test - Updated"
    } | ConvertTo-Json -Depth 10
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Patch -Headers $headers -Body $updatePayload
    
    Write-Host "OK: Invoice updated" -ForegroundColor Green
    Write-Host "   Line items: $($updateResponse.line_items_table.Count)" -ForegroundColor Gray
    Write-Host "   New total: $($updateResponse.total_amount) VND" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to update invoice" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Issue invoice
Write-Host "[6/7] Issuing invoice..." -ForegroundColor Yellow
try {
    $issuePayload = @{
        send_notification = $false
    } | ConvertTo-Json
    
    $issueResponse = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId/issue" -Method Post -Headers $headers -Body $issuePayload
    
    Write-Host "OK: Invoice issued" -ForegroundColor Green
    Write-Host "   State: $($issueResponse.state)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to issue invoice" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 7: List invoices
Write-Host "[7/7] Listing invoices..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/invoices?page=1&page_size=10" -Method Get -Headers $headers
    Write-Host "OK: Found $($listResponse.meta.total) invoices" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to list invoices" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 1 API TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests passed:" -ForegroundColor Green
Write-Host "  1. Create invoice (DRAFT)" -ForegroundColor Gray
Write-Host "  2. Get invoice detail" -ForegroundColor Gray
Write-Host "  3. Update invoice" -ForegroundColor Gray
Write-Host "  4. Issue invoice" -ForegroundColor Gray
Write-Host "  5. List invoices" -ForegroundColor Gray
Write-Host ""
Write-Host "Next: Test frontend pages" -ForegroundColor Yellow
Write-Host ""
