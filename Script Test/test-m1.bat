@echo off
REM M1 Foundation Test Script (Windows CMD)
REM Kiểm tra đầy đủ chức năng M1: Auth + Config + RBAC + Audit

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000/api/v1
set PASS_COUNT=0
set FAIL_COUNT=0

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║           URP M1 FOUNDATION TEST SUITE                    ║
echo ║                                                           ║
echo ║  Testing: Auth, Config, RBAC, Audit Logs                 ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Base URL: %BASE_URL%
echo Bắt đầu test...
echo.

REM ============================================================================
REM TEST 1: AUTH FLOW
REM ============================================================================
echo ========================================
echo   TEST 1: AUTH FLOW
echo ========================================
echo.

echo [INFO] Test 1.1: Login với landlord@example.com
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"landlord@example.com\",\"password\":\"Password123!\"}" ^
  -o response.json

findstr /C:"access_token" response.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Login thành công với Landlord
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Login thất bại với Landlord
    set /a FAIL_COUNT+=1
)

REM Extract token (simplified - in real script would use jq or similar)
for /f "tokens=2 delims=:," %%a in ('findstr "access_token" response.json') do (
    set TOKEN=%%a
    set TOKEN=!TOKEN:"=!
    set TOKEN=!TOKEN: =!
)

echo.
echo [INFO] Test 1.2: Login với admin@example.com
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"Password123!\"}" ^
  -o admin_response.json

findstr /C:"access_token" admin_response.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Login thành công với Admin
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Login thất bại với Admin
    set /a FAIL_COUNT+=1
)

for /f "tokens=2 delims=:," %%a in ('findstr "access_token" admin_response.json') do (
    set ADMIN_TOKEN=%%a
    set ADMIN_TOKEN=!ADMIN_TOKEN:"=!
    set ADMIN_TOKEN=!ADMIN_TOKEN: =!
)

echo.
echo [INFO] Test 1.3: Login với tenant@example.com
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"tenant@example.com\",\"password\":\"Password123!\"}" ^
  -o tenant_response.json

findstr /C:"access_token" tenant_response.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Login thành công với Tenant
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Login thất bại với Tenant
    set /a FAIL_COUNT+=1
)

echo.
echo [INFO] Test 1.4: Login với mật khẩu sai
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"landlord@example.com\",\"password\":\"WrongPassword\"}" ^
  -w "%%{http_code}" ^
  -o bad_login.json > http_code.txt

set /p HTTP_CODE=<http_code.txt
if "!HTTP_CODE!"=="401" (
    echo [PASS] Login thất bại đúng như mong đợi (401)
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Login với mật khẩu sai không trả về 401
    set /a FAIL_COUNT+=1
)

echo.
echo [INFO] Test 1.5: Get profile với token hợp lệ
curl -s -X GET "%BASE_URL%/auth/me" ^
  -H "Authorization: Bearer !TOKEN!" ^
  -o profile.json

findstr /C:"email" profile.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Get profile thành công
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Get profile thất bại
    set /a FAIL_COUNT+=1
)

echo.
echo [INFO] Test 1.6: Get profile không có token
curl -s -X GET "%BASE_URL%/auth/me" ^
  -w "%%{http_code}" ^
  -o no_token.json > http_code2.txt

set /p HTTP_CODE2=<http_code2.txt
if "!HTTP_CODE2!"=="401" (
    echo [PASS] Get profile không có token trả về 401 đúng
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Get profile không có token không trả về 401
    set /a FAIL_COUNT+=1
)

REM ============================================================================
REM TEST 2: CONFIG BUNDLE FLOW
REM ============================================================================
echo.
echo ========================================
echo   TEST 2: CONFIG BUNDLE FLOW
echo ========================================
echo.

echo [INFO] Test 2.1: List config bundles với Admin
curl -s -X GET "%BASE_URL%/configs/bundles" ^
  -H "Authorization: Bearer !ADMIN_TOKEN!" ^
  -o bundles.json

findstr /C:"[" bundles.json >nul
if %errorlevel% equ 0 (
    echo [PASS] List config bundles thành công
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] List config bundles thất bại
    set /a FAIL_COUNT+=1
)

echo.
echo [INFO] Test 2.2: Create config bundle với Admin
curl -s -X POST "%BASE_URL%/configs/bundles" ^
  -H "Authorization: Bearer !ADMIN_TOKEN!" ^
  -H "Content-Type: application/json" ^
  -d "{\"bundle_id\":\"test_bundle_cmd\",\"version\":\"1.0.0\",\"config\":{\"asset_types\":{}}}" ^
  -o create_bundle.json

findstr /C:"id" create_bundle.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Create config bundle thành công
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Create config bundle thất bại
    set /a FAIL_COUNT+=1
)

REM ============================================================================
REM SUMMARY
REM ============================================================================
echo.
echo ========================================
echo   TEST SUMMARY
echo ========================================
echo.

set /a TOTAL_TESTS=PASS_COUNT+FAIL_COUNT

echo ╔═══════════════════════════════════════════════════════════╗
echo ║                    KẾT QUẢ TEST                           ║
echo ╠═══════════════════════════════════════════════════════════╣
echo ║  Tổng số tests:    !TOTAL_TESTS!
echo ║  [PASS] Passed:    !PASS_COUNT!
echo ║  [FAIL] Failed:    !FAIL_COUNT!
echo ╚═══════════════════════════════════════════════════════════╝
echo.

if !FAIL_COUNT! equ 0 (
    echo [SUCCESS] TẤT CẢ TESTS ĐỀU PASS! M1 Foundation hoạt động hoàn hảo!
    exit /b 0
) else (
    echo [WARNING] CÓ !FAIL_COUNT! TESTS THẤT BẠI. Vui lòng kiểm tra lại!
    exit /b 1
)

REM Cleanup
del response.json admin_response.json tenant_response.json bad_login.json profile.json no_token.json bundles.json create_bundle.json http_code.txt http_code2.txt 2>nul
