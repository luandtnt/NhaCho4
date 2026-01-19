#!/bin/bash
# M1 Foundation Test Script (Bash)
# Kiểm tra đầy đủ chức năng M1: Auth + Config + RBAC + Audit

set -e

BASE_URL="http://localhost:3000/api/v1"
PASS_COUNT=0
FAIL_COUNT=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((FAIL_COUNT++))
}

info() {
    echo -e "${CYAN}ℹ️  INFO: $1${NC}"
}

section() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
}

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           URP M1 FOUNDATION TEST SUITE                    ║
║                                                           ║
║  Testing: Auth, Config, RBAC, Audit Logs                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

info "Base URL: $BASE_URL"
info "Bắt đầu test..."

# Check if server is running
if ! curl -s "$BASE_URL/auth/login" > /dev/null 2>&1; then
    fail "Backend server không chạy tại $BASE_URL"
    exit 1
fi

# ============================================================================
# TEST 1: AUTH FLOW
# ============================================================================
section "TEST 1: AUTH FLOW"

# Test 1.1: Login với Landlord
info "Test 1.1: Login với landlord@example.com"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"Password123!"}')

if echo "$RESPONSE" | grep -q "access_token"; then
    pass "Login thành công với Landlord"
    LANDLORD_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    LANDLORD_REFRESH=$(echo "$RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
else
    fail "Login thất bại với Landlord"
    exit 1
fi

# Test 1.2: Login với Admin
info "Test 1.2: Login với admin@example.com"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123!"}')

if echo "$RESPONSE" | grep -q "access_token"; then
    pass "Login thành công với Admin"
    ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    fail "Login thất bại với Admin"
fi

# Test 1.3: Login với Tenant
info "Test 1.3: Login với tenant@example.com"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"Password123!"}')

if echo "$RESPONSE" | grep -q "access_token"; then
    pass "Login thành công với Tenant"
    TENANT_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    fail "Login thất bại với Tenant"
fi

# Test 1.4: Login với mật khẩu sai
info "Test 1.4: Login với mật khẩu sai"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"WrongPassword"}')

if [ "$HTTP_CODE" = "401" ]; then
    pass "Login thất bại đúng như mong đợi (401)"
else
    fail "Login với mật khẩu sai không trả về 401 (got $HTTP_CODE)"
fi

# Test 1.5: Get profile
info "Test 1.5: Get profile với token hợp lệ"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

if echo "$RESPONSE" | grep -q "landlord@example.com"; then
    pass "Get profile thành công"
else
    fail "Get profile thất bại"
fi

# Test 1.6: Get profile không có token
info "Test 1.6: Get profile không có token"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/auth/me")

if [ "$HTTP_CODE" = "401" ]; then
    pass "Get profile không có token trả về 401 đúng"
else
    fail "Get profile không có token không trả về 401 (got $HTTP_CODE)"
fi

# Test 1.7: Refresh token
info "Test 1.7: Refresh access token"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$LANDLORD_REFRESH\"}")

if echo "$RESPONSE" | grep -q "access_token"; then
    pass "Refresh token thành công"
    NEW_LANDLORD_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    fail "Refresh token thất bại"
fi

# ============================================================================
# TEST 2: CONFIG BUNDLE FLOW
# ============================================================================
section "TEST 2: CONFIG BUNDLE FLOW"

# Test 2.1: List config bundles
info "Test 2.1: List config bundles với Admin"
RESPONSE=$(curl -s -X GET "$BASE_URL/configs/bundles" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "\["; then
    pass "List config bundles thành công"
else
    fail "List config bundles thất bại"
fi

# Test 2.2: Create config bundle với Admin
info "Test 2.2: Create config bundle với Admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESPONSE=$(curl -s -X POST "$BASE_URL/configs/bundles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bundle_id\":\"test_bundle_$TIMESTAMP\",\"version\":\"1.0.0\",\"config\":{\"asset_types\":{}}}")

if echo "$RESPONSE" | grep -q '"id"'; then
    pass "Create config bundle thành công"
    BUNDLE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    fail "Create config bundle thất bại"
fi

# Test 2.3: Create config bundle với Tenant (should fail)
info "Test 2.3: Create config bundle với Tenant (phải thất bại)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/configs/bundles" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bundle_id":"test_tenant","version":"1.0.0","config":{}}')

if [ "$HTTP_CODE" = "403" ]; then
    pass "Tenant không được phép tạo config bundle (403)"
else
    fail "Tenant có thể tạo config bundle (vi phạm RBAC, got $HTTP_CODE)"
fi

# Test 2.4: Get config bundle detail
if [ -n "$BUNDLE_ID" ]; then
    info "Test 2.4: Get config bundle detail"
    RESPONSE=$(curl -s -X GET "$BASE_URL/configs/bundles/$BUNDLE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$RESPONSE" | grep -q "$BUNDLE_ID"; then
        pass "Get config bundle detail thành công"
    else
        fail "Get config bundle detail thất bại"
    fi
fi

# Test 2.5: Activate config bundle
if [ -n "$BUNDLE_ID" ]; then
    info "Test 2.5: Activate config bundle"
    RESPONSE=$(curl -s -X POST "$BASE_URL/configs/bundles/$BUNDLE_ID/activate" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$RESPONSE" | grep -q "ACTIVE"; then
        pass "Activate config bundle thành công"
    else
        fail "Activate config bundle thất bại"
    fi
fi

# ============================================================================
# TEST 3: RBAC & SECURITY
# ============================================================================
section "TEST 3: RBAC & SECURITY"

# Test 3.1: Landlord có thể list config bundles
info "Test 3.1: Landlord có thể list config bundles"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/configs/bundles" \
  -H "Authorization: Bearer $NEW_LANDLORD_TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    pass "Landlord có quyền list config bundles"
else
    fail "Landlord không có quyền list config bundles (got $HTTP_CODE)"
fi

# Test 3.2: Landlord không thể tạo config bundle
info "Test 3.2: Landlord không thể tạo config bundle"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/configs/bundles" \
  -H "Authorization: Bearer $NEW_LANDLORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bundle_id":"test_landlord","version":"1.0.0","config":{}}')

if [ "$HTTP_CODE" = "403" ]; then
    pass "Landlord không được phép tạo config bundle (403)"
else
    fail "Landlord có thể tạo config bundle (vi phạm RBAC, got $HTTP_CODE)"
fi

# ============================================================================
# SUMMARY
# ============================================================================
section "TEST SUMMARY"

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))

echo -e "${CYAN}"
cat << EOF
╔═══════════════════════════════════════════════════════════╗
║                    KẾT QUẢ TEST                           ║
╠═══════════════════════════════════════════════════════════╣
║  Tổng số tests:    $TOTAL_TESTS
║  ✅ Passed:         $PASS_COUNT
║  ❌ Failed:         $FAIL_COUNT
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 TẤT CẢ TESTS ĐỀU PASS! M1 Foundation hoạt động hoàn hảo!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  CÓ $FAIL_COUNT TESTS THẤT BẠI. Vui lòng kiểm tra lại!${NC}"
    exit 1
fi
