# ============================================================================
# RESET & RESTORE - Xóa hết database và tạo mới với dữ liệu đầy đủ
# ============================================================================
# Script này sẽ:
# 1. XÓA HẾT database hiện tại
# 2. Chạy lại tất cả migrations
# 3. Seed dữ liệu đầy đủ cho tất cả modules
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Red
Write-Host "  ⚠️  RESET & RESTORE DATABASE - XÓA HẾT VÀ TẠO MỚI" -ForegroundColor Red
Write-Host "============================================================================" -ForegroundColor Red
Write-Host ""

Write-Host "⚠️  CẢNH BÁO NGHIÊM TRỌNG:" -ForegroundColor Red
Write-Host "   Script này sẽ XÓA HẾT dữ liệu trong database!" -ForegroundColor Red
Write-Host "   Tất cả dữ liệu hiện tại sẽ bị mất!" -ForegroundColor Red
Write-Host ""

Write-Host "📦 Sau khi reset, các module sau sẽ được khôi phục:" -ForegroundColor Yellow
Write-Host "   ✅ Listings (tin đăng)" -ForegroundColor Green
Write-Host "   ✅ Assets & Space Nodes (tài sản)" -ForegroundColor Green
Write-Host "   ✅ Rentable Items (căn cho thuê)" -ForegroundColor Green
Write-Host "   ✅ Bookings (đặt chỗ)" -ForegroundColor Green
Write-Host "   ✅ Agreements (hợp đồng)" -ForegroundColor Green
Write-Host "   ✅ Pricing Policies (chính sách giá)" -ForegroundColor Green
Write-Host "   ✅ Invoices (hóa đơn)" -ForegroundColor Green
Write-Host ""

# Kiểm tra backend có đang chạy không
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Backend đang chạy. Vui lòng STOP backend trước!" -ForegroundColor Red
    Write-Host "   💡 Chạy lệnh: Ctrl+C trong terminal backend" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Bạn đã stop backend chưa? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Hủy bỏ. Vui lòng stop backend và chạy lại script." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✅ Backend đã stop" -ForegroundColor Green
}
Write-Host ""

# Xác nhận 2 lần
Write-Host "⚠️  XÁC NHẬN LẦN 1:" -ForegroundColor Red
$confirm1 = Read-Host "Bạn CHẮC CHẮN muốn XÓA HẾT database? (yes/no)"
if ($confirm1 -ne "yes") {
    Write-Host "❌ Hủy bỏ" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "⚠️  XÁC NHẬN LẦN 2:" -ForegroundColor Red
$confirm2 = Read-Host "Gõ 'DELETE ALL' để xác nhận"
if ($confirm2 -ne "DELETE ALL") {
    Write-Host "❌ Hủy bỏ" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Bước 1: Reset database
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BƯỚC 1: RESET DATABASE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location apps/backend

Write-Host "🗑️  Đang xóa database và chạy lại migrations..." -ForegroundColor Yellow
pnpm prisma migrate reset --force --skip-seed

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Reset database thất bại!" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host ""
Write-Host "✅ Database đã được reset thành công!" -ForegroundColor Green
Write-Host ""

# Bước 2: Seed dữ liệu
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BƯỚC 2: SEED DỮ LIỆU" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌱 Đang seed dữ liệu cho tất cả modules..." -ForegroundColor Yellow
Write-Host ""

npx tsx prisma/seed-complete.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "  ✅ RESET & RESTORE THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Database đã được reset và khôi phục đầy đủ!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Dữ liệu đã được tạo:" -ForegroundColor Cyan
    Write-Host "   ✅ 3 Listings (tin đăng)" -ForegroundColor White
    Write-Host "   ✅ 1 Asset với 3 units (tài sản)" -ForegroundColor White
    Write-Host "   ✅ 3 Rentable Items (căn cho thuê)" -ForegroundColor White
    Write-Host "   ✅ 3 Bookings (đặt chỗ)" -ForegroundColor White
    Write-Host "   ✅ 2 Agreements (hợp đồng)" -ForegroundColor White
    Write-Host "   ✅ 2 Pricing Policies (chính sách giá)" -ForegroundColor White
    Write-Host "   ✅ 3 Invoices (hóa đơn)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Thông tin đăng nhập:" -ForegroundColor Cyan
    Write-Host "   Landlord: landlord@example.com / Password123!" -ForegroundColor White
    Write-Host "   Tenant:   tenant@example.com / Password123!" -ForegroundColor White
    Write-Host "   Admin:    admin@example.com / Password123!" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Bước tiếp theo:" -ForegroundColor Cyan
    Write-Host "   1. Khởi động backend:  pnpm -C apps/backend start:dev" -ForegroundColor White
    Write-Host "   2. Khởi động frontend: pnpm -C apps/frontend dev" -ForegroundColor White
    Write-Host "   3. Truy cập: http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Kiểm tra các module:" -ForegroundColor Cyan
    Write-Host "   ✅ Listings - http://localhost:5173/listings" -ForegroundColor White
    Write-Host "   ✅ Bookings - http://localhost:5173/bookings" -ForegroundColor White
    Write-Host "   ✅ Agreements - http://localhost:5173/agreements" -ForegroundColor White
    Write-Host "   ✅ Invoices - http://localhost:5173/invoices" -ForegroundColor White
    Write-Host "   ✅ Pricing Policies - http://localhost:5173/pricing-policies" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "  ❌ SEED DỮ LIỆU THẤT BẠI!" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vui lòng kiểm tra lỗi ở trên và thử lại" -ForegroundColor Yellow
    Write-Host ""
    Set-Location ../..
    exit 1
}

Set-Location ../..
