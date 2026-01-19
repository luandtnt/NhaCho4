# ============================================================================
# Add Landlord Isolation - Migration & Seed
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  ADD LANDLORD ISOLATION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Thay doi:" -ForegroundColor Yellow
Write-Host "   - Them landlord_party_id vao rentable_items" -ForegroundColor Green
Write-Host "   - Them landlord_party_id vao listings" -ForegroundColor Green
Write-Host "   - Moi landlord chi thay du lieu cua minh" -ForegroundColor Green
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
$confirm = Read-Host "Ban muon RESET database va seed lai data? Go 'yes' de xac nhan"
if ($confirm -ne "yes") {
    Write-Host "Huy bo" -ForegroundColor Red
    exit 0
}
Write-Host ""

Set-Location apps/backend

# Reset database
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BUOC 1: RESET DATABASE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dang reset database..." -ForegroundColor Yellow
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

# Seed data
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  BUOC 2: SEED DATA (210 BDS + 5 LANDLORDS + 10 TENANTS)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dang seed data..." -ForegroundColor Yellow
Write-Host "Vui long doi 3-5 phut..." -ForegroundColor Yellow
Write-Host ""

npx tsx prisma/seed-massive.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "  THANH CONG!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Da them landlord isolation:" -ForegroundColor Green
    Write-Host "   - Moi landlord chi thay ~42 properties cua minh" -ForegroundColor White
    Write-Host "   - Moi tenant chi thay ~5 bookings/agreements/invoices cua minh" -ForegroundColor White
    Write-Host ""
    Write-Host "Dang nhap de test:" -ForegroundColor Cyan
    Write-Host "   landlord@example.com / Password123!" -ForegroundColor White
    Write-Host "   landlord1@example.com / Password123!" -ForegroundColor White
    Write-Host "   tenant@example.com / Password123!" -ForegroundColor White
    Write-Host "   tenant1@example.com / Password123!" -ForegroundColor White
    Write-Host ""
    Write-Host "Khoi dong:" -ForegroundColor Cyan
    Write-Host "   Backend:  pnpm -C apps/backend start:dev" -ForegroundColor White
    Write-Host "   Frontend: pnpm -C apps/frontend dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Seed that bai!" -ForegroundColor Red
    Write-Host ""
    Set-Location ../..
    exit 1
}

Set-Location ../..
