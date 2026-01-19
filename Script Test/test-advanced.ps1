# M1 Advanced Test Script
# Test nâng cao: Multi-tenant isolation, Audit logs, Performance

$ErrorActionPreference = "Continue"
$BASE_URL = "http://localhost:3000/api/v1"
$PASS_COUNT = 0
$FAIL_COUNT = 0

function Write-Pass { param($msg) Write-Host "[PASS] $msg" -ForegroundColor Green; $script:PASS_COUNT++ }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:FAIL_COUNT++ }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Section { param($msg) Write-Host "`n========================================" -ForegroundColor Yellow; Write-Host "  $msg" -ForegroundColor Yellow; Write-Host "========================================`n" -ForegroundColor Yellow }

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$Token = "",
        [object]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        return @{ Success = $false; Error = $errorBody; StatusCode = $statusCode }
    }
}

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        URP M1 ADVANCED TEST SUITE                         ║
║                                                           ║
║  Testing: Multi-tenant, Audit, Performance                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Login users
Write-Info "Đăng nhập các tài khoản..."
$landlordLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "landlord@example.com"
    password = "Password123!"
}
$LANDLORD_TOKEN = $landlordLogin.Data.access_token

$tenantLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "tenant@example.com"
    password = "Password123!"
}
$TENANT_TOKEN = $tenantLogin.Data.access_token

$adminLogin = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "admin@example.com"
    password = "Password123!"
}
$ADMIN_TOKEN = $adminLogin.Data.access_token

# ============================================================================
# TEST 1: MULTI-TENANT ISOLATION
# ============================================================================
Write-Section "TEST 1: MULTI-TENANT ISOLATION"

# Get org_id for each user
$landlordProfile = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token $LANDLORD_TOKEN
$tenantProfile = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token $TENANT_TOKEN

$LANDLORD_ORG = $landlordProfile.Data.org_id
$TENANT_ORG = $tenantProfile.Data.org_id

Write-Info "Landlord org_id: $LANDLORD_ORG"
Write-Info "Tenant org_id: $TENANT_ORG"

# Test 1.1: Verify different orgs
if ($LANDLORD_ORG -ne $TENANT_ORG) {
    Write-Pass "Landlord và Tenant thuộc các org khác nhau"
} else {
    Write-Fail "Landlord và Tenant thuộc cùng org (vi phạm multi-tenant)"
}

# Test 1.2: Create config bundle in Landlord org
Write-Info "Test 1.2: Tạo config bundle trong Landlord org"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$createResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $ADMIN_TOKEN -Body @{
    bundle_id = "landlord_bundle_$timestamp"
    version = "1.0.0"
    config = @{ test = "landlord" }
}

if ($createResponse.Success) {
    $LANDLORD_BUNDLE_ID = $createResponse.Data.id
    Write-Pass "Tạo bundle trong Landlord org thành công"
} else {
    Write-Fail "Tạo bundle thất bại"
}

# Test 1.3: Tenant không thể thấy bundle của Landlord
Write-Info "Test 1.3: Tenant không thể thấy bundle của Landlord"
$tenantListResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles" -Token $TENANT_TOKEN

if ($tenantListResponse.Success) {
    $tenantBundles = $tenantListResponse.Data
    $foundLandlordBundle = $tenantBundles | Where-Object { $_.id -eq $LANDLORD_BUNDLE_ID }
    
    if (-not $foundLandlordBundle) {
        Write-Pass "Tenant không thấy bundle của Landlord (multi-tenant isolation OK)"
    } else {
        Write-Fail "Tenant có thể thấy bundle của Landlord (vi phạm isolation)"
    }
} else {
    Write-Fail "Tenant không thể list bundles"
}

# ============================================================================
# TEST 2: REQUEST ID TRACKING
# ============================================================================
Write-Section "TEST 2: REQUEST ID TRACKING"

Write-Info "Test 2.1: Kiểm tra Request ID trong response headers"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/auth/me" `
        -Headers @{ "Authorization" = "Bearer $LANDLORD_TOKEN" } `
        -Method GET
    
    $requestId = $response.Headers["X-Request-Id"]
    
    if ($requestId) {
        Write-Pass "Request ID được trả về: $requestId"
    } else {
        Write-Fail "Request ID không có trong response headers"
    }
} catch {
    Write-Fail "Không thể kiểm tra Request ID"
}

# ============================================================================
# TEST 3: ERROR HANDLING
# ============================================================================
Write-Section "TEST 3: ERROR HANDLING"

# Test 3.1: Structured error response
Write-Info "Test 3.1: Kiểm tra cấu trúc error response"
$errorResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "invalid"
    password = "short"
}

if (-not $errorResponse.Success) {
    $errorData = $errorResponse.Error | ConvertFrom-Json
    
    if ($errorData.error_code -and $errorData.message) {
        Write-Pass "Error response có cấu trúc đúng (error_code, message)"
    } else {
        Write-Fail "Error response thiếu error_code hoặc message"
    }
} else {
    Write-Fail "Request không trả về error như mong đợi"
}

# Test 3.2: 404 for non-existent resource
Write-Info "Test 3.2: 404 cho resource không tồn tại"
$notFoundResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles/non-existent-id" -Token $ADMIN_TOKEN

if (-not $notFoundResponse.Success -and $notFoundResponse.StatusCode -eq 404) {
    Write-Pass "Trả về 404 cho resource không tồn tại"
} else {
    Write-Fail "Không trả về 404 cho resource không tồn tại"
}

# ============================================================================
# TEST 4: TOKEN EXPIRY & REFRESH
# ============================================================================
Write-Section "TEST 4: TOKEN LIFECYCLE"

# Test 4.1: Refresh token multiple times
Write-Info "Test 4.1: Refresh token nhiều lần"
$refreshToken = $landlordLogin.Data.refresh_token
$refreshCount = 0

for ($i = 1; $i -le 3; $i++) {
    $refreshResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/refresh" -Body @{
        refresh_token = $refreshToken
    }
    
    if ($refreshResponse.Success) {
        $refreshCount++
        $refreshToken = $refreshResponse.Data.refresh_token
    }
}

if ($refreshCount -eq 3) {
    Write-Pass "Refresh token 3 lần thành công"
} else {
    Write-Fail "Refresh token thất bại sau $refreshCount lần"
}

# Test 4.2: Logout invalidates refresh token
Write-Info "Test 4.2: Logout vô hiệu hóa refresh token"
$logoutResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/logout" -Token $LANDLORD_TOKEN

if ($logoutResponse.Success) {
    # Try to use the refresh token after logout
    $refreshAfterLogout = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/refresh" -Body @{
        refresh_token = $landlordLogin.Data.refresh_token
    }
    
    if (-not $refreshAfterLogout.Success) {
        Write-Pass "Refresh token bị vô hiệu hóa sau logout"
    } else {
        Write-Fail "Refresh token vẫn hoạt động sau logout"
    }
} else {
    Write-Fail "Logout thất bại"
}

# ============================================================================
# TEST 5: PERFORMANCE & LOAD
# ============================================================================
Write-Section "TEST 5: PERFORMANCE"

Write-Info "Test 5.1: Đo thời gian response của login"
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
    Write-Pass "Thời gian login trung bình: $([math]::Round($avgLoginTime, 2))ms (< 1s)"
} else {
    Write-Fail "Thời gian login trung bình: $([math]::Round($avgLoginTime, 2))ms (> 1s)"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Section "TEST SUMMARY"

$TOTAL_TESTS = $PASS_COUNT + $FAIL_COUNT

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                    KẾT QUẢ TEST                           ║
╠═══════════════════════════════════════════════════════════╣
║  Tổng số tests:    $TOTAL_TESTS                                        ║
║  ✅ Passed:         $PASS_COUNT                                        ║
║  ❌ Failed:         $FAIL_COUNT                                        ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $(if ($FAIL_COUNT -eq 0) { "Green" } else { "Yellow" })

if ($FAIL_COUNT -eq 0) {
    Write-Host "SUCCESS: TAT CA ADVANCED TESTS DEU PASS!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "WARNING: CO $FAIL_COUNT TESTS THAT BAI." -ForegroundColor Red
    exit 1
}
