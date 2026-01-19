@echo off
REM Run All M1 Tests (Windows CMD)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║           URP M1 - RUN ALL TESTS                          ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/2] Kiểm tra backend server...
curl -s http://localhost:3000/api/v1/auth/login >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend server không chạy!
    echo Vui lòng chạy: pnpm -C apps/backend dev
    exit /b 1
)
echo ✅ Backend server đang chạy
echo.

echo [2/2] Chạy Basic Tests...
echo ============================================================
call "%~dp0test-m1.bat"
set BASIC_RESULT=%errorlevel%

echo.
echo ============================================================
echo TỔNG KẾT
echo ============================================================

if %BASIC_RESULT% equ 0 (
    echo.
    echo 🎉 TẤT CẢ TESTS ĐỀU PASS!
    echo    ✅ Basic Tests: PASS
    echo.
    echo M1 Foundation đã sẵn sàng!
    exit /b 0
) else (
    echo.
    echo ⚠️  MỘT SỐ TESTS THẤT BẠI
    echo    ❌ Basic Tests: FAIL
    echo.
    exit /b 1
)
