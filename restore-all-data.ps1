# ============================================================================
# RESTORE ALL DATA - Khôi phục toàn bộ dữ liệu cho các module đã hoàn thành
# ============================================================================
# Script này sẽ:
# 1. Chạy seed script hoàn chỉnh để khôi phục dữ liệu
# 2. Không xóa database hiện tại (chỉ thêm dữ liệu)
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  KHÔI PHỤC DỮ LIỆU - Restore All Data" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Modules sẽ được khôi phục:" -ForegroundColor Yellow
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
    Write-Host "   ⚠️  Backend đang chạy. Vui lòng STOP backend trước khi chạy seed!" -ForegroundColor Red
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

# Xác nhận từ user
Write-Host "⚠️  CẢNH BÁO:" -ForegroundColor Red
Write-Host "   Script này sẽ thêm dữ liệu mẫu vào database hiện tại" -ForegroundColor Yellow
Write-Host "   Nếu bạn muốn XÓA HẾT và tạo mới, hãy chạy: pnpm -C apps/backend prisma migrate reset" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Bạn có muốn tiếp tục? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Hủy bỏ" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Chạy seed script
Write-Host "🌱 Running seed script..." -ForegroundColor Cyan
Write-Host ""

Set-Location apps/backend

# Compile TypeScript seed file
Write-Host "📝 Compiling seed script..." -ForegroundColor Yellow
npx tsx prisma/seed-complete.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "  ✅ KHÔI PHỤC DỮ LIỆU THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Tất cả dữ liệu đã được khôi phục!" -ForegroundColor Green
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
    Write-Host "📋 Kiểm tra các trang:" -ForegroundColor Cyan
    Write-Host "   ✅ Listings (Tin đăng)" -ForegroundColor White
    Write-Host "   ✅ Bookings (Đặt chỗ)" -ForegroundColor White
    Write-Host "   ✅ Agreements (Hợp đồng)" -ForegroundColor White
    Write-Host "   ✅ Invoices (Hóa đơn)" -ForegroundColor White
    Write-Host "   ✅ Pricing Policies (Chính sách giá)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "  ❌ KHÔI PHỤC DỮ LIỆU THẤT BẠI!" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Có thể do:" -ForegroundColor Yellow
    Write-Host "   1. Database chưa được migrate" -ForegroundColor White
    Write-Host "   2. Backend đang chạy" -ForegroundColor White
    Write-Host "   3. Lỗi kết nối database" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Thử các bước sau:" -ForegroundColor Yellow
    Write-Host "   1. Stop backend nếu đang chạy" -ForegroundColor White
    Write-Host "   2. Chạy: pnpm -C apps/backend prisma migrate deploy" -ForegroundColor White
    Write-Host "   3. Chạy lại script này" -ForegroundColor White
    Write-Host ""
    exit 1
}

Set-Location ../..
