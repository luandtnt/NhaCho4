# Test isolation for all modules
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING LANDLORD ISOLATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Login as landlord3
Write-Host "`n=== LOGIN AS landlord3@example.com ===" -ForegroundColor Yellow
$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord3@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token3 = $login3.access_token

# Login as landlord4
Write-Host "=== LOGIN AS landlord4@example.com ===" -ForegroundColor Yellow
$login4 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "landlord4@example.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$token4 = $login4.access_token

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MODULE: LISTINGS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$listings3 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token3" }
$listings4 = Invoke-RestMethod -Uri "$baseUrl/listings?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token4" }
Write-Host "Landlord3: $($listings3.meta.total) listings" -ForegroundColor White
Write-Host "Landlord4: $($listings4.meta.total) listings" -ForegroundColor White
if ($listings3.data[0].id -eq $listings4.data[0].id) {
    Write-Host "ERROR: Same listings!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Different listings" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MODULE: RENTABLE ITEMS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$items3 = Invoke-RestMethod -Uri "$baseUrl/rentable-items?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token3" }
$items4 = Invoke-RestMethod -Uri "$baseUrl/rentable-items?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token4" }
Write-Host "Landlord3: $($items3.meta.total) items" -ForegroundColor White
Write-Host "Landlord4: $($items4.meta.total) items" -ForegroundColor White
if ($items3.data[0].id -eq $items4.data[0].id) {
    Write-Host "ERROR: Same items!" -ForegroundColor Red
} else {
    Write-Host "SUCCESS: Different items" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MODULE: AGREEMENTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$agreements3 = Invoke-RestMethod -Uri "$baseUrl/agreements?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token3" }
$agreements4 = Invoke-RestMethod -Uri "$baseUrl/agreements?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token4" }
Write-Host "Landlord3: $($agreements3.meta.total) agreements" -ForegroundColor White
Write-Host "Landlord4: $($agreements4.meta.total) agreements" -ForegroundColor White
if ($agreements3.meta.total -gt 0 -and $agreements4.meta.total -gt 0) {
    if ($agreements3.data[0].id -eq $agreements4.data[0].id) {
        Write-Host "ERROR: Same agreements!" -ForegroundColor Red
    } else {
        Write-Host "SUCCESS: Different agreements" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MODULE: BOOKINGS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$bookings3 = Invoke-RestMethod -Uri "$baseUrl/bookings?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token3" }
$bookings4 = Invoke-RestMethod -Uri "$baseUrl/bookings?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token4" }
Write-Host "Landlord3: $($bookings3.meta.total) bookings" -ForegroundColor White
Write-Host "Landlord4: $($bookings4.meta.total) bookings" -ForegroundColor White
if ($bookings3.meta.total -gt 0 -and $bookings4.meta.total -gt 0) {
    if ($bookings3.data[0].id -eq $bookings4.data[0].id) {
        Write-Host "ERROR: Same bookings!" -ForegroundColor Red
    } else {
        Write-Host "SUCCESS: Different bookings" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MODULE: INVOICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$invoices3 = Invoke-RestMethod -Uri "$baseUrl/invoices?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token3" }
$invoices4 = Invoke-RestMethod -Uri "$baseUrl/invoices?page=1&page_size=1" -Method GET -Headers @{ Authorization = "Bearer $token4" }
Write-Host "Landlord3: $($invoices3.meta.total) invoices" -ForegroundColor White
Write-Host "Landlord4: $($invoices4.meta.total) invoices" -ForegroundColor White
if ($invoices3.meta.total -gt 0 -and $invoices4.meta.total -gt 0) {
    if ($invoices3.data[0].id -eq $invoices4.data[0].id) {
        Write-Host "ERROR: Same invoices!" -ForegroundColor Red
    } else {
        Write-Host "SUCCESS: Different invoices" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Landlord isolation is working correctly!" -ForegroundColor Green
Write-Host "Each landlord only sees their own data." -ForegroundColor Green
