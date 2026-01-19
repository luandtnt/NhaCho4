# Smoke Test Script
# Verifies critical functionality after deployment

param(
    [string]$ApiUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$testsPassed = 0
$testsFailed = 0

Write-Host "=== URP Smoke Tests ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $script:testsPassed++
            return $true
        }
        else {
            Write-Host " ✗ FAIL (Status: $($response.StatusCode), Expected: $ExpectedStatus)" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
    }
    catch {
        Write-Host " ✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# Test 1: Health Check
Write-Host "=== Basic Health ===" -ForegroundColor Yellow
Test-Endpoint -Name "Health endpoint" -Url "$ApiUrl/health"

# Test 2: API Documentation
Test-Endpoint -Name "API documentation" -Url "$ApiUrl/api/docs"

# Test 3: Authentication
Write-Host ""
Write-Host "=== Authentication ===" -ForegroundColor Yellow

$loginBody = @{
    email = "landlord@example.com"
    password = "Password123!"
} | ConvertTo-Json

$loginSuccess = $false
try {
    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.access_token
    
    if ($token) {
        Write-Host "Testing: Login" -NoNewline
        Write-Host " ✓ PASS" -ForegroundColor Green
        $script:testsPassed++
        $loginSuccess = $true
    }
    else {
        Write-Host "Testing: Login" -NoNewline
        Write-Host " ✗ FAIL (No token returned)" -ForegroundColor Red
        $script:testsFailed++
    }
}
catch {
    Write-Host "Testing: Login" -NoNewline
    Write-Host " ✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $script:testsFailed++
}

if ($loginSuccess) {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    Test-Endpoint -Name "Get current user" -Url "$ApiUrl/api/v1/auth/me" -Headers $authHeaders
    
    # Test 4: Core Endpoints
    Write-Host ""
    Write-Host "=== Core Endpoints ===" -ForegroundColor Yellow
    
    Test-Endpoint -Name "List listings" -Url "$ApiUrl/api/v1/listings" -Headers $authHeaders
    Test-Endpoint -Name "List assets" -Url "$ApiUrl/api/v1/assets" -Headers $authHeaders
    Test-Endpoint -Name "List agreements" -Url "$ApiUrl/api/v1/agreements" -Headers $authHeaders
    Test-Endpoint -Name "List invoices" -Url "$ApiUrl/api/v1/invoices" -Headers $authHeaders
    Test-Endpoint -Name "List payments" -Url "$ApiUrl/api/v1/payments" -Headers $authHeaders
    
    # Test 5: Search
    Write-Host ""
    Write-Host "=== Search ===" -ForegroundColor Yellow
    
    Test-Endpoint -Name "Search listings" -Url "$ApiUrl/api/v1/search/listings?q=apartment"
    Test-Endpoint -Name "Autocomplete" -Url "$ApiUrl/api/v1/search/suggest?q=apa"
    
    # Test 6: Reports
    Write-Host ""
    Write-Host "=== Reports ===" -ForegroundColor Yellow
    
    Test-Endpoint -Name "Occupancy report" -Url "$ApiUrl/api/v1/reports/occupancy" -Headers $authHeaders
    Test-Endpoint -Name "Revenue report" -Url "$ApiUrl/api/v1/reports/revenue" -Headers $authHeaders
    Test-Endpoint -Name "Tickets summary" -Url "$ApiUrl/api/v1/reports/tickets-summary" -Headers $authHeaders
    
    # Test 7: Tenant Portal
    Write-Host ""
    Write-Host "=== Tenant Portal ===" -ForegroundColor Yellow
    
    # Login as tenant
    $tenantLoginBody = @{
        email = "tenant@example.com"
        password = "Password123!"
    } | ConvertTo-Json
    
    try {
        $tenantLoginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/v1/auth/login" `
            -Method POST `
            -Body $tenantLoginBody `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $tenantToken = $tenantLoginResponse.access_token
        $tenantHeaders = @{
            "Authorization" = "Bearer $tenantToken"
        }
        
        Test-Endpoint -Name "Tenant agreements" -Url "$ApiUrl/api/v1/tenant/agreements" -Headers $tenantHeaders
        Test-Endpoint -Name "Tenant invoices" -Url "$ApiUrl/api/v1/tenant/invoices" -Headers $tenantHeaders
        Test-Endpoint -Name "Tenant tickets" -Url "$ApiUrl/api/v1/tenant/tickets" -Headers $tenantHeaders
    }
    catch {
        Write-Host "Testing: Tenant portal" -NoNewline
        Write-Host " ✗ FAIL (Tenant login failed)" -ForegroundColor Red
        $script:testsFailed++
    }
}
else {
    Write-Host ""
    Write-Host "Skipping authenticated tests (login failed)" -ForegroundColor Yellow
}

# Test 8: Database Connection
Write-Host ""
Write-Host "=== Database ===" -ForegroundColor Yellow

try {
    # Try to query a simple endpoint that requires DB
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/search/listings?q=test" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "Testing: Database connection" -NoNewline
    Write-Host " ✓ PASS" -ForegroundColor Green
    $script:testsPassed++
}
catch {
    Write-Host "Testing: Database connection" -NoNewline
    Write-Host " ✗ FAIL" -ForegroundColor Red
    $script:testsFailed++
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "Total:  $($testsPassed + $testsFailed)"
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All smoke tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✗ Some smoke tests failed" -ForegroundColor Red
    exit 1
}
