# Test Booking APIs - Phase 1
# Run this after backend is running: npm run dev

$baseUrl = "http://localhost:3000/api/v1"
$token = "YOUR_ACCESS_TOKEN_HERE"  # Get from login

Write-Host "=== Testing Booking APIs ===" -ForegroundColor Green
Write-Host ""

# Test 1: Check Availability (Public - No auth needed)
Write-Host "1. Testing Check Availability..." -ForegroundColor Yellow
$checkAvailabilityBody = @{
    rentable_item_id = "YOUR_RENTABLE_ITEM_ID"
    start_date = "2024-01-20T14:00:00Z"
    end_date = "2024-01-23T12:00:00Z"
    quantity = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bookings/check-availability" `
        -Method Post `
        -ContentType "application/json" `
        -Body $checkAvailabilityBody
    
    Write-Host "✅ Check Availability Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Check Availability Failed:" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Test 2: Calculate Price (Public - No auth needed)
Write-Host "2. Testing Calculate Price..." -ForegroundColor Yellow
$calculatePriceBody = @{
    rentable_item_id = "YOUR_RENTABLE_ITEM_ID"
    start_date = "2024-01-20T14:00:00Z"
    end_date = "2024-01-23T12:00:00Z"
    guests = @{
        adults = 2
        children = 1
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bookings/calculate-price" `
        -Method Post `
        -ContentType "application/json" `
        -Body $calculatePriceBody
    
    Write-Host "✅ Calculate Price Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Calculate Price Failed:" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Test 3: Create Enhanced Booking (Requires auth)
Write-Host "3. Testing Create Enhanced Booking..." -ForegroundColor Yellow
$createBookingBody = @{
    rentable_item_id = "YOUR_RENTABLE_ITEM_ID"
    listing_id = "YOUR_LISTING_ID"
    start_date = "2024-01-20T14:00:00Z"
    end_date = "2024-01-23T12:00:00Z"
    guests = @{
        adults = 2
        children = 1
    }
    contact = @{
        full_name = "Nguyen Van A"
        phone = "0912345678"
        email = "test@example.com"
        special_requests = "Late check-in"
    }
    pricing = @{
        total = 12650000
        breakdown = @{
            base_price = 10500000
            cleaning_fee = 200000
            service_fee = 1150000
        }
    }
    policies_accepted = $true
} | ConvertTo-Json -Depth 5

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/bookings/create-enhanced" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $createBookingBody
    
    Write-Host "✅ Create Enhanced Booking Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Create Enhanced Booking Failed:" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Replace YOUR_RENTABLE_ITEM_ID with actual ID from database"
Write-Host "2. Replace YOUR_LISTING_ID with actual listing ID"
Write-Host "3. Get access token from login and replace YOUR_ACCESS_TOKEN_HERE"
Write-Host "4. Run: .\test-booking-apis.ps1"
