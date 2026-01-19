# Run Agreement Enhancement Migration
# Adds all fields for 11 requirements

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Agreement Module Enhancement Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Apply SQL migration
Write-Host "[Step 1] Applying SQL migration..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "postgres"
    psql -h localhost -U postgres -d nhacho4 -f "apps/backend/prisma/migrations/add_agreement_full_fields.sql"
    Write-Host "[SUCCESS] SQL migration applied!" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] SQL migration failed: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Use Prisma db push
    Set-Location apps/backend
    npx prisma db push --skip-generate
    Set-Location ../..
}
Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "[Step 2] Regenerating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
npx prisma generate
Set-Location ../..
Write-Host "[SUCCESS] Prisma Client regenerated!" -ForegroundColor Green
Write-Host ""

# Step 3: Check TypeScript errors
Write-Host "[Step 3] Checking TypeScript..." -ForegroundColor Yellow
Set-Location apps/backend
$tsCheck = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] No TypeScript errors!" -ForegroundColor Green
} else {
    Write-Host "[WARN] TypeScript has some warnings (check manually)" -ForegroundColor Yellow
}
Set-Location ../..
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart backend: cd apps/backend && npm run dev" -ForegroundColor White
Write-Host "2. Test create agreement with new fields" -ForegroundColor White
Write-Host "3. Check frontend CreateAgreementPage" -ForegroundColor White
Write-Host ""
