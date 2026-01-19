# ============================================================================
# RESET & RESTORE MASSIVE - Tao 210 BDS (21 loai x 10 items)
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  RESET & RESTORE MASSIVE DATABASE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Du lieu se duoc tao:" -ForegroundColor Yellow
Write-Host "   - 21 loai hinh BDS" -ForegroundColor Green
Write-Host "   - 21 Pricing Policies" -ForegroundColor Green
Write-Host "   - 210 Rentable Items (21 x 10)" -ForegroundColor Green
Write-Host "   - 210 Listings" -ForegroundColor Green
Write-Host "   - ~50 Agreements" -ForegroundColor Green
Write-Host "   - ~100 Bookings" -ForegroundColor Green
Write-Host "   - ~150 Invoices" -ForegroundColor Green
Write-Host "   - Payments, Notifications, Leads..." -ForegroundColor Green
Write-Host ""

Write-Host "Thoi gian uoc tinh: 3-5 phut" -ForegroundColor Yellow
Write-Host ""

# Check backend
Write-Host "Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   Backend dang chay. Vui long STOP backend!" -ForegroundColor Red
    Write-Host ""
    $continue = Read-Host "Da stop backend chua? Go y de tiep tuc"
    if ($continue -ne "y") {
        Write-Host "Huy bo" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Backend da stop" -ForegroundColor Green
}
Write-Host ""

# Confirm
Write-Host "XAC NHAN:" -ForegroundColor Red
$confirm = Read-Host "Ban muon XOA HET database va tao 210 BDS? Go 'yes' de xac nhan"
if ($confirm -ne "yes") {
    Write-Host "Huy bo" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Reset database
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BUOC 1: RESET DATABASE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location apps/backend

Write-Host "Dang xoa database..." -ForegroundColor Yellow
pnpm prisma migrate reset --force --skip-seed

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Reset database that bai!" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host ""
Write-Host "Database da duoc reset!" -ForegroundColor Green
Write-Host ""

# Seed massive data
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BUOC 2: SEED MASSIVE DATA (210 BDS)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dang tao 210 bat dong san..." -ForegroundColor Yellow
Write-Host "Vui long doi 3-5 phut..." -ForegroundColor Yellow
Write-Host ""

npx tsx prisma/seed-massive.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "  MASSIVE SEEDING THANH CONG!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Da tao thanh cong:" -ForegroundColor Green
    Write-Host "   - 21 loai hinh BDS" -ForegroundColor White
    Write-Host "   - 210 Rentable Items" -ForegroundColor White
    Write-Host "   - 210 Listings" -ForegroundColor White
    Write-Host "   - ~50 Agreements" -ForegroundColor White
    Write-Host "   - ~100 Bookings" -ForegroundColor White
    Write-Host "   - ~150 Invoices" -ForegroundColor White
    Write-Host ""
    Write-Host "Dang nhap:" -ForegroundColor Cyan
    Write-Host "   landlord@example.com / Password123!" -ForegroundColor White
    Write-Host "   tenant@example.com / Password123!" -ForegroundColor White
    Write-Host ""
    Write-Host "Khoi dong:" -ForegroundColor Cyan
    Write-Host "   Backend:  pnpm -C apps/backend start:dev" -ForegroundColor White
    Write-Host "   Frontend: pnpm -C apps/frontend dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "SEED THAT BAI!" -ForegroundColor Red
    Write-Host ""
    Set-Location ../..
    exit 1
}

Set-Location ../..
