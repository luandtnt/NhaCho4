# ========================================
# Regenerate Prisma Client
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Regenerating Prisma Client..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location apps/backend

Write-Host "`n[Step 1] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Prisma Client regenerated!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Restart backend: npm run dev" -ForegroundColor White
    Write-Host "2. Test Agreement APIs" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Failed to regenerate Prisma Client" -ForegroundColor Red
    exit 1
}

Set-Location ../..
