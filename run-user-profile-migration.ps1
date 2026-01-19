# Run User Profile Migration
# Adds name, phone, emergency_contact, id_number to users table

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "User Profile Fields Migration" -ForegroundColor Cyan
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
Write-Host "New fields added to users table:" -ForegroundColor Yellow
Write-Host "  - name (TEXT)" -ForegroundColor White
Write-Host "  - phone (TEXT)" -ForegroundColor White
Write-Host "  - emergency_contact (TEXT)" -ForegroundColor White
Write-Host "  - id_number (TEXT) ← CCCD/Passport" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart backend: cd apps/backend && npm run dev" -ForegroundColor White
Write-Host "2. Test LandlordProfilePage: http://localhost:5173/landlord-profile" -ForegroundColor White
Write-Host "3. Update profile with CCCD number" -ForegroundColor White
Write-Host ""
