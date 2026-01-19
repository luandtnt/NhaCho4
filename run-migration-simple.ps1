# Simple PowerShell script - No psql required
# Just run this file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Walk-in Booking Migration (Simple)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run migration using Node.js
Write-Host "[1/3] Running migration..." -ForegroundColor Yellow
node apply-walk-in-migration.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "[2/3] Generating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
npx prisma generate
Set-Location ../..

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Done
Write-Host "[3/3] Complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart backend: cd apps/backend && npm run dev" -ForegroundColor White
Write-Host "  2. Test at: http://localhost:5173/quick-checkin" -ForegroundColor White
Write-Host ""
