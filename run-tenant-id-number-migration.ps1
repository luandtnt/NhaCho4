# Add tenant_id_number to agreements table
# Lưu CCCD/Passport của tenant trong hợp đồng

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Add Tenant ID Number to Agreements" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Apply Prisma db push
Write-Host "[Step 1] Applying Prisma schema changes..." -ForegroundColor Yellow
Set-Location apps/backend
npx prisma db push
Write-Host "[SUCCESS] Schema updated!" -ForegroundColor Green
Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "[Step 2] Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "[SUCCESS] Prisma Client regenerated!" -ForegroundColor Green
Write-Host ""

Set-Location ../..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ MIGRATION COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New field added to agreements table:" -ForegroundColor Yellow
Write-Host "  - tenant_id_number (TEXT) ← CCCD/Passport của tenant" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart backend: cd apps/backend && npm run dev" -ForegroundColor White
Write-Host "2. Test CreateAgreementPage: http://localhost:5173/agreements/create" -ForegroundColor White
Write-Host "3. Nhập CCCD tenant khi tạo hợp đồng" -ForegroundColor White
Write-Host ""
