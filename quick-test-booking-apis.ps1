# Quick Test Booking APIs
# This script will guide you through testing step by step

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 QUICK TEST: Booking APIs (Phase 1)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if backend is running
Write-Host "Step 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start backend first:" -ForegroundColor Yellow
    Write-Host "  cd apps/backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Step 2: Get test data
Write-Host "Step 2: Getting test data from database..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please run this SQL query in your database client:" -ForegroundColor Cyan
Write-Host ""
$sqlQuery = @"
SELECT ri.id as rentable_item_id, ri.code, ri.property_category
FROM rentable_item ri
WHERE ri.property_category IN ('HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'VILLA_RESORT')
AND ri.status = 'AVAILABLE'
LIMIT 1;
"@
Write-Host $sqlQuery -ForegroundColor White

Write-Host ""
$rentableItemId = Read-Host "Enter rentable_item_id from SQL result"

if ([string]::IsNullOrWhiteSpace($rentableItemId)) {
    Write-Host "❌ No rentable_item_id provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Step 3: Test Check Availability (Public - No auth needed)
Write-Host "Step 3: Testing Check Availability API..." -ForegroundColor Yellow
Write-Host ""

$checkAvailabilityBody = @{
    rentable_item_id = $rentableItemId
    start_date = "2024-02-01T14:00:00Z"
    end_date = "2024-02-04T12:00:00Z"
    quantity = 1
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Cyan
Write-Host "POST http://localhost:3000/api/v1/bookings/check-availability" -ForegroundColor White
Write-Host $checkAvailabilityBody -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/check-availability" `
        -Method Post `
        -ContentType "application/json" `
        -Body $checkAvailabilityBody `
        -ErrorAction Stop
    
    Write-Host "✅ Check Availability Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
    
    if ($response.available) {
        Write-Host ""
        Write-Host "✅ Dates are AVAILABLE" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Dates are NOT AVAILABLE" -ForegroundColor Yellow
        Write-Host "Conflicting bookings found or capacity exceeded" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Check Availability Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Step 4: Test Calculate Price (Public - No auth needed)
Write-Host "Step 4: Testing Calculate Price API..." -ForegroundColor Yellow
Write-Host ""

$calculatePriceBody = @{
    rentable_item_id = $rentableItemId
    start_date = "2024-02-01T14:00:00Z"
    end_date = "2024-02-04T12:00:00Z"
    guests = @{
        adults = 2
        children = 1
    }
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Cyan
Write-Host "POST http://localhost:3000/api/v1/bookings/calculate-price" -ForegroundColor White
Write-Host $calculatePriceBody -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/calculate-price" `
        -Method Post `
        -ContentType "application/json" `
        -Body $calculatePriceBody `
        -ErrorAction Stop
    
    Write-Host "✅ Calculate Price Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
    
    Write-Host ""
    Write-Host "💰 Price Summary:" -ForegroundColor Cyan
    Write-Host "  Base Price: $($response.base_price) VND" -ForegroundColor White
    Write-Host "  Nights: $($response.nights)" -ForegroundColor White
    Write-Host "  Subtotal: $($response.subtotal) VND" -ForegroundColor White
    Write-Host "  Total: $($response.total) VND" -ForegroundColor Green
    
    # Save total for later
    $calculatedTotal = $response.total
} catch {
    Write-Host "❌ Calculate Price Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    $calculatedTotal = 0
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Step 5: Test Create Enhanced Booking (Requires auth)
Write-Host "Step 5: Testing Create Enhanced Booking API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This endpoint requires authentication." -ForegroundColor Yellow
Write-Host ""

$testAuth = Read-Host "Do you want to test Create Booking? (y/n)"

if ($testAuth -eq "y" -or $testAuth -eq "Y") {
    Write-Host ""
    Write-Host "Please login first to get access token:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "POST http://localhost:3000/api/v1/auth/login" -ForegroundColor White
    Write-Host 'Body: {"email": "tenant@example.com", "password": "password123"}' -ForegroundColor Gray
    Write-Host ""
    
    $token = Read-Host "Enter your access_token"
    
    if ([string]::IsNullOrWhiteSpace($token)) {
        Write-Host "⚠️  No token provided. Skipping Create Booking test." -ForegroundColor Yellow
    } else {
        Write-Host ""
        $listingId = Read-Host "Enter listing_id (optional, press Enter to skip)"
        
        $createBookingBody = @{
            rentable_item_id = $rentableItemId
            start_date = "2024-02-01T14:00:00Z"
            end_date = "2024-02-04T12:00:00Z"
            guests = @{
                adults = 2
                children = 1
            }
            contact = @{
                full_name = "Nguyen Van A"
                phone = "0912345678"
                email = "test@example.com"
                special_requests = "Late check-in please"
            }
            pricing = @{
                total = if ($calculatedTotal -gt 0) { $calculatedTotal } else { 10000000 }
                breakdown = @{
                    base_price = 9000000
                    service_fee = 1000000
                }
            }
            policies_accepted = $true
        }
        
        if (-not [string]::IsNullOrWhiteSpace($listingId)) {
            $createBookingBody.listing_id = $listingId
        }
        
        $createBookingBodyJson = $createBookingBody | ConvertTo-Json -Depth 5
        
        Write-Host ""
        Write-Host "Request:" -ForegroundColor Cyan
        Write-Host "POST http://localhost:3000/api/v1/bookings/create-enhanced" -ForegroundColor White
        Write-Host "Authorization: Bearer <token>" -ForegroundColor Gray
        Write-Host $createBookingBodyJson -ForegroundColor Gray
        Write-Host ""
        
        try {
            $headers = @{
                "Authorization" = "Bearer $token"
            }
            
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/create-enhanced" `
                -Method Post `
                -ContentType "application/json" `
                -Headers $headers `
                -Body $createBookingBodyJson `
                -ErrorAction Stop
            
            Write-Host "✅ Create Enhanced Booking Success!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Response:" -ForegroundColor Cyan
            $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
            
            Write-Host ""
            Write-Host "📋 Booking Summary:" -ForegroundColor Cyan
            Write-Host "  Booking ID: $($response.id)" -ForegroundColor White
            Write-Host "  Booking Code: $($response.booking_code)" -ForegroundColor White
            Write-Host "  Status: $($response.status)" -ForegroundColor $(if ($response.status -eq "CONFIRMED") { "Green" } else { "Yellow" })
            Write-Host "  Start: $($response.start_at)" -ForegroundColor White
            Write-Host "  End: $($response.end_at)" -ForegroundColor White
            
            if ($response.metadata.auto_confirmed) {
                Write-Host ""
                Write-Host "⚡ Instant Booking: Auto-confirmed!" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Create Enhanced Booking Failed!" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            if ($_.ErrorDetails) {
                Write-Host $_.ErrorDetails.Message -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "⚠️  Skipping Create Booking test." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST COMPLETE                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Phase 1 Backend APIs tested!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review test results above" -ForegroundColor White
Write-Host "  2. If all tests passed - Move to Phase 2 (Frontend)" -ForegroundColor White
Write-Host "  3. If any test failed - Check error messages and fix" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - TEST_PHASE1_GUIDE.md (detailed guide)" -ForegroundColor White
Write-Host "  - PHASE1_BACKEND_API_COMPLETE.md (API specs)" -ForegroundColor White
Write-Host ""
