# Simple Advanced Test - Multi-tenant & RBAC verification

$ErrorActionPreference = "Continue"
$BASE_URL = "http://localhost:3000/api/v1"
$PASS_COUNT = 0
$FAIL_COUNT = 0

function Write-Pass { param($msg) Write-Host "PASS: $msg" -ForegroundColor Green; $script:PASS_COUNT++ }
function Write-Fail { param($msg) Write-Host "FAIL: $msg" -ForegroundColor Red; $script:FAIL_COUNT++ }
function Write-Info { param($msg) Write-Host "INFO: $msg" -ForegroundColor Cyan }

function Invoke-ApiRequest {
    param([string]$Method, [string]$Uri, [string]$Token = "", [object]$Body = $null)
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $params = @{ Method = $Method; Uri = $Uri; Headers = $headers; ErrorAction = "Stop" }
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
        
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ Success = $false; StatusCode = $statusCode }
    }
}

Write-Host "`n=== URP M1 ADVANCED TESTS ===`n" -ForegroundColor Cyan

# Login users
Write-Info "Logging in users..."
$landlordLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{ email = "landlord@example.com"; password = "Password123!" }
$LANDLORD_TOKEN = $landlordLogin.Data.access_token

$tenantLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{ email = "tenant@example.com"; password = "Password123!" }
$TENANT_TOKEN = $tenantLogin.Data.access_token

$adminLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{ email = "admin@example.com"; password = "Password123!" }
$ADMIN_TOKEN = $adminLogin.Data.access_token

# TEST 1: Multi-tenant isolation
Write-Host "`n--- TEST 1: MULTI-TENANT ISOLATION ---`n" -ForegroundColor Yellow

$landlordProfile = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token $LANDLORD_TOKEN
$tenantProfile = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token $TENANT_TOKEN

$LANDLORD_ORG = $landlordProfile.Data.org_id
$TENANT_ORG = $tenantProfile.Data.org_id

Write-Info "Landlord org: $LANDLORD_ORG"
Write-Info "Tenant org: $TENANT_ORG"

if ($LANDLORD_ORG -ne $TENANT_ORG) {
    Write-Pass "Landlord and Tenant belong to different orgs"
} else {
    Write-Fail "Landlord and Tenant belong to same org"
}

# Create bundle in Landlord org
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$createResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $ADMIN_TOKEN -Body @{
    bundle_id = "landlord_bundle_$timestamp"
    version = "1.0.0"
    config = @{ test = "landlord" }
}

if ($createResponse.Success) {
    $LANDLORD_BUNDLE_ID = $createResponse.Data.id
    Write-Pass "Created bundle in Landlord org"
    
    # Tenant should not see this bundle
    $tenantListResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles" -Token $TENANT_TOKEN
    
    if ($tenantListResponse.Success) {
        $tenantBundles = $tenantListResponse.Data
        $foundLandlordBundle = $tenantBundles | Where-Object { $_.id -eq $LANDLORD_BUNDLE_ID }
        
        if (-not $foundLandlordBundle) {
            Write-Pass "Tenant cannot see Landlord's bundle (isolation OK)"
        } else {
            Write-Fail "Tenant can see Landlord's bundle (isolation FAIL)"
        }
    }
} else {
    Write-Fail "Failed to create bundle"
}

# TEST 2: Performance
Write-Host "`n--- TEST 2: PERFORMANCE ---`n" -ForegroundColor Yellow

$loginTimes = @()
for ($i = 1; $i -le 5; $i++) {
    $startTime = Get-Date
    $loginResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
        email = "landlord@example.com"
        password = "Password123!"
    }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    $loginTimes += $duration
}

$avgLoginTime = ($loginTimes | Measure-Object -Average).Average

if ($avgLoginTime -lt 1000) {
    Write-Pass "Average login time: $([math]::Round($avgLoginTime, 2))ms (< 1s)"
} else {
    Write-Fail "Average login time: $([math]::Round($avgLoginTime, 2))ms (> 1s)"
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$TOTAL_TESTS = $PASS_COUNT + $FAIL_COUNT
Write-Host "Total tests: $TOTAL_TESTS" -ForegroundColor White
Write-Host "Passed: $PASS_COUNT" -ForegroundColor Green
Write-Host "Failed: $FAIL_COUNT" -ForegroundColor Red

if ($FAIL_COUNT -eq 0) {
    Write-Host "`nALL ADVANCED TESTS PASSED!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n$FAIL_COUNT TESTS FAILED`n" -ForegroundColor Red
    exit 1
}
