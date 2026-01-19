# Run All M1 Tests
# Chạy tất cả test suites cho M1 Foundation

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           URP M1 - RUN ALL TESTS                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n[1/3] Kiểm tra backend server..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ErrorAction Stop
    Write-Host "✅ Backend server đang chạy`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server không chạy!" -ForegroundColor Red
    Write-Host "Vui lòng chạy: pnpm -C apps/backend dev`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "[2/3] Chạy Basic Tests..." -ForegroundColor Yellow
Write-Host "=" * 60

& "$PSScriptRoot\test-m1.ps1"
$basicTestResult = $LASTEXITCODE

Write-Host "`n[3/3] Chạy Advanced Tests..." -ForegroundColor Yellow
Write-Host "=" * 60

& "$PSScriptRoot\test-advanced.ps1"
$advancedTestResult = $LASTEXITCODE

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "TỔNG KẾT TẤT CẢ TESTS" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($basicTestResult -eq 0 -and $advancedTestResult -eq 0) {
    Write-Host "`n🎉 TẤT CẢ TESTS ĐỀU PASS!" -ForegroundColor Green
    Write-Host "   ✅ Basic Tests: PASS" -ForegroundColor Green
    Write-Host "   ✅ Advanced Tests: PASS" -ForegroundColor Green
    Write-Host "`nM1 Foundation đã sẵn sàng cho production!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  MỘT SỐ TESTS THẤT BẠI" -ForegroundColor Red
    if ($basicTestResult -ne 0) {
        Write-Host "   ❌ Basic Tests: FAIL" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Basic Tests: PASS" -ForegroundColor Green
    }
    
    if ($advancedTestResult -ne 0) {
        Write-Host "   ❌ Advanced Tests: FAIL" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Advanced Tests: PASS" -ForegroundColor Green
    }
    
    Write-Host "`nVui lòng kiểm tra lại các tests thất bại.`n" -ForegroundColor Yellow
    exit 1
}
