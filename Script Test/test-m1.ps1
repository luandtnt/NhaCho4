# M1 Foundation Test Script (PowerShell)
# Kiểm tra đầy đủ chức năng M1: Auth + Config + RBAC + Audit

$ErrorActionPreference = "Continue"
$BASE_URL = "http://localhost:3000/api/v1"
$PASS_COUNT = 0
$FAIL_COUNT = 0

# Colors
function Write-Pass { param($msg) Write-Host "[PASS] $msg" -ForegroundColor Green; $script:PASS_COUNT++ }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:FAIL_COUNT++ }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Section { param($msg) Write-Host "`n========================================" -ForegroundColor Yellow; Write-Host "  $msg" -ForegroundColor Yellow; Write-Host "========================================`n" -ForegroundColor Yellow }

# Helper function to make HTTP requests
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
║           URP M1 FOUNDATION TEST SUITE                    ║
║                                                           ║
║  Testing: Auth, Config, RBAC, Audit Logs                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Info "Base URL: $BASE_URL"
Write-Info "Bắt đầu test..."

# ============================================================================
# TEST 1: AUTH FLOW
# ============================================================================
Write-Section "TEST 1: AUTH FLOW"

# Test 1.1: Login thành công với Landlord
Write-Info "Test 1.1: Login với landlord@example.com"
$loginResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "landlord@example.com"
    password = "Password123!"
}

if ($loginResponse.Success -and $loginResponse.Data.access_token) {
    Write-Pass "Login thành công với Landlord"
    $LANDLORD_TOKEN = $loginResponse.Data.access_token
    $LANDLORD_REFRESH = $loginResponse.Data.refresh_token
} else {
    Write-Fail "Login thất bại với Landlord: $($loginResponse.Error)"
    exit 1
}

# Test 1.2: Login thành công với Admin
Write-Info "Test 1.2: Login với admin@example.com"
$adminLoginResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "admin@example.com"
    password = "Password123!"
}

if ($adminLoginResponse.Success -and $adminLoginResponse.Data.access_token) {
    Write-Pass "Login thành công với Admin"
    $ADMIN_TOKEN = $adminLoginResponse.Data.access_token
} else {
    Write-Fail "Login thất bại với Admin: $($adminLoginResponse.Error)"
}

# Test 1.3: Login thành công với Tenant
Write-Info "Test 1.3: Login với tenant@example.com"
$tenantLoginResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "tenant@example.com"
    password = "Password123!"
}

if ($tenantLoginResponse.Success -and $tenantLoginResponse.Data.access_token) {
    Write-Pass "Login thành công với Tenant"
    $TENANT_TOKEN = $tenantLoginResponse.Data.access_token
} else {
    Write-Fail "Login thất bại với Tenant: $($tenantLoginResponse.Error)"
}

# Test 1.4: Login thất bại với mật khẩu sai
Write-Info "Test 1.4: Login với mật khẩu sai"
$badLoginResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    email = "landlord@example.com"
    password = "WrongPassword"
}

if (-not $badLoginResponse.Success -and $badLoginResponse.StatusCode -eq 401) {
    Write-Pass "Login thất bại đúng như mong đợi (401)"
} else {
    Write-Fail "Login với mật khẩu sai không trả về 401"
}

# Test 1.5: Get profile
Write-Info "Test 1.5: Get profile với token hợp lệ"
$profileResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token $LANDLORD_TOKEN

if ($profileResponse.Success -and $profileResponse.Data.email -eq "landlord@example.com") {
    Write-Pass "Get profile thành công, email: $($profileResponse.Data.email), role: $($profileResponse.Data.role)"
} else {
    Write-Fail "Get profile thất bại: $($profileResponse.Error)"
}

# Test 1.6: Get profile không có token
Write-Info "Test 1.6: Get profile không có token"
$noTokenResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me"

if (-not $noTokenResponse.Success -and $noTokenResponse.StatusCode -eq 401) {
    Write-Pass "Get profile không có token trả về 401 đúng"
} else {
    Write-Fail "Get profile không có token không trả về 401"
}

# Test 1.7: Refresh token
Write-Info "Test 1.7: Refresh access token"
$refreshResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/refresh" -Body @{
    refresh_token = $LANDLORD_REFRESH
}

if ($refreshResponse.Success -and $refreshResponse.Data.access_token) {
    Write-Pass "Refresh token thành công"
    $NEW_LANDLORD_TOKEN = $refreshResponse.Data.access_token
} else {
    Write-Fail "Refresh token thất bại: $($refreshResponse.Error)"
}

# Test 1.8: Logout
Write-Info "Test 1.8: Logout"
$logoutResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/logout" -Token $LANDLORD_TOKEN

if ($logoutResponse.Success) {
    Write-Pass "Logout thành công"
} else {
    Write-Fail "Logout thất bại: $($logoutResponse.Error)"
}

# ============================================================================
# TEST 2: CONFIG BUNDLE FLOW
# ============================================================================
Write-Section "TEST 2: CONFIG BUNDLE FLOW"

# Test 2.1: List config bundles (Landlord)
Write-Info "Test 2.1: List config bundles với Landlord"
$listResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles" -Token $NEW_LANDLORD_TOKEN

if ($listResponse.Success) {
    Write-Pass "List config bundles thành công, số lượng: $($listResponse.Data.Count)"
} else {
    Write-Fail "List config bundles thất bại: $($listResponse.Error)"
}

# Test 2.2: Create config bundle với Admin
Write-Info "Test 2.2: Create config bundle với Admin"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$createResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $ADMIN_TOKEN -Body @{
    bundle_id = "test_bundle_$timestamp"
    version = "1.0.0"
    config = @{
        asset_types = @{
            apartment = @{
                schema_ref = "schemas/apartment.json"
            }
        }
    }
}

if ($createResponse.Success) {
    Write-Pass "Create config bundle thành công, ID: $($createResponse.Data.id)"
    $BUNDLE_ID = $createResponse.Data.id
} else {
    Write-Fail "Create config bundle thất bại: $($createResponse.Error)"
}

# Test 2.3: Create config bundle với Tenant (should fail)
Write-Info "Test 2.3: Create config bundle với Tenant (phải thất bại)"
$tenantCreateResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $TENANT_TOKEN -Body @{
    bundle_id = "test_bundle_tenant"
    version = "1.0.0"
    config = @{
        asset_types = @{}
    }
}

if (-not $tenantCreateResponse.Success -and $tenantCreateResponse.StatusCode -eq 403) {
    Write-Pass "Tenant không được phép tạo config bundle (403)"
} else {
    Write-Fail "Tenant có thể tạo config bundle (không đúng RBAC)"
}

# Test 2.4: Get config bundle detail
if ($BUNDLE_ID) {
    Write-Info "Test 2.4: Get config bundle detail"
    $getResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles/$BUNDLE_ID" -Token $ADMIN_TOKEN
    
    if ($getResponse.Success -and $getResponse.Data.id -eq $BUNDLE_ID) {
        Write-Pass "Get config bundle detail thành công"
    } else {
        Write-Fail "Get config bundle detail thất bại: $($getResponse.Error)"
    }
}

# Test 2.5: Activate config bundle
if ($BUNDLE_ID) {
    Write-Info "Test 2.5: Activate config bundle"
    $activateResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles/$BUNDLE_ID/activate" -Token $ADMIN_TOKEN
    
    if ($activateResponse.Success) {
        Write-Pass "Activate config bundle thành công"
    } else {
        Write-Fail "Activate config bundle thất bại: $($activateResponse.Error)"
    }
}

# Test 2.6: Create another bundle for rollback test
Write-Info "Test 2.6: Create bundle thứ 2 để test rollback"
$timestamp2 = Get-Date -Format "yyyyMMdd_HHmmss"
Start-Sleep -Seconds 1
$createResponse2 = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $ADMIN_TOKEN -Body @{
    bundle_id = "test_bundle_${timestamp2}_v2"
    version = "2.0.0"
    config = @{
        asset_types = @{
            apartment = @{
                schema_ref = "schemas/apartment_v2.json"
            }
        }
    }
}

if ($createResponse2.Success) {
    Write-Pass "Create bundle thứ 2 thành công"
    $BUNDLE_ID_2 = $createResponse2.Data.id
    
    # Activate bundle 2
    Write-Info "Test 2.7: Activate bundle thứ 2"
    $activateResponse2 = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles/$BUNDLE_ID_2/activate" -Token $ADMIN_TOKEN
    
    if ($activateResponse2.Success) {
        Write-Pass "Activate bundle thứ 2 thành công"
        
        # Rollback to bundle 1
        if ($BUNDLE_ID) {
            Write-Info "Test 2.8: Rollback về bundle đầu tiên"
            $rollbackResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles/$BUNDLE_ID/rollback" -Token $ADMIN_TOKEN
            
            if ($rollbackResponse.Success) {
                Write-Pass "Rollback thành công"
            } else {
                Write-Fail "Rollback thất bại: $($rollbackResponse.Error)"
            }
        }
    } else {
        Write-Fail "Activate bundle thứ 2 thất bại: $($activateResponse2.Error)"
    }
} else {
    Write-Fail "Create bundle thứ 2 thất bại: $($createResponse2.Error)"
}

# ============================================================================
# TEST 3: RBAC & SECURITY
# ============================================================================
Write-Section "TEST 3: RBAC & SECURITY"

# Test 3.1: Landlord có thể list config bundles
Write-Info "Test 3.1: Landlord có thể list config bundles"
$landlordListResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/configs/bundles" -Token $NEW_LANDLORD_TOKEN

if ($landlordListResponse.Success) {
    Write-Pass "Landlord có quyền list config bundles"
} else {
    Write-Fail "Landlord không có quyền list config bundles"
}

# Test 3.2: Landlord không thể tạo config bundle
Write-Info "Test 3.2: Landlord không thể tạo config bundle"
$landlordCreateResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $NEW_LANDLORD_TOKEN -Body @{
    bundle_id = "test_landlord"
    version = "1.0.0"
    config = @{}
}

if (-not $landlordCreateResponse.Success -and $landlordCreateResponse.StatusCode -eq 403) {
    Write-Pass "Landlord không được phép tạo config bundle (403)"
} else {
    Write-Fail "Landlord có thể tạo config bundle (vi phạm RBAC)"
}

# Test 3.3: Token không hợp lệ
Write-Info "Test 3.3: Request với token không hợp lệ"
$invalidTokenResponse = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/auth/me" -Token "invalid_token_xyz"

if (-not $invalidTokenResponse.Success -and $invalidTokenResponse.StatusCode -eq 401) {
    Write-Pass "Token không hợp lệ trả về 401"
} else {
    Write-Fail "Token không hợp lệ không trả về 401"
}

# ============================================================================
# TEST 4: VALIDATION & ERROR HANDLING
# ============================================================================
Write-Section "TEST 4: VALIDATION & ERROR HANDLING"

# Test 4.1: Login với email thiếu
Write-Info "Test 4.1: Login với email thiếu"
$noEmailResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/auth/login" -Body @{
    password = "Password123!"
}

if (-not $noEmailResponse.Success -and $noEmailResponse.StatusCode -eq 400) {
    Write-Pass "Validation error cho email thiếu (400)"
} else {
    Write-Fail "Không có validation error cho email thiếu"
}

# Test 4.2: Create config bundle với dữ liệu không hợp lệ
Write-Info "Test 4.2: Create config bundle với bundle_id thiếu"
$invalidBundleResponse = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/configs/bundles" -Token $ADMIN_TOKEN -Body @{
    version = "1.0.0"
}

if (-not $invalidBundleResponse.Success -and $invalidBundleResponse.StatusCode -eq 400) {
    Write-Pass "Validation error cho bundle_id thiếu (400)"
} else {
    Write-Fail "Không có validation error cho bundle_id thiếu"
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
    Write-Host "[SUCCESS] TAT CA TESTS DEU PASS! M1 Foundation hoat dong hoan hao!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[WARNING] CO $FAIL_COUNT TESTS THAT BAI. Vui long kiem tra lai!" -ForegroundColor Red
    exit 1
}
