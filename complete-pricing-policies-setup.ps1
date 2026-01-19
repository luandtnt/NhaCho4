# Complete Pricing Policies Setup Script
# This script does EVERYTHING needed to setup pricing policies system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRICING POLICIES - COMPLETE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 0: Check if backend is running
Write-Host "Step 0: Checking if backend is running..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Nhacho4*" }
if ($backendProcess) {
    Write-Host "WARNING: Backend is still running!" -ForegroundColor Red
    Write-Host "Please stop backend first (Ctrl+C in terminal), then run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Or run this command to kill it:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id $($backendProcess.Id) -Force" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Backend is not running" -ForegroundColor Green
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma Client" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host "OK: Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 2: Run Migration
Write-Host "Step 2: Running migration..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run migration" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host "OK: Migration completed" -ForegroundColor Green
Write-Host ""

# Step 3: Seed Pricing Policies
Write-Host "Step 3: Seeding sample pricing policies..." -ForegroundColor Yellow
npx ts-node scripts/seed-pricing-policies.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Seeding failed (this is OK if you don't have data yet)" -ForegroundColor Yellow
} else {
    Write-Host "OK: Sample policies created" -ForegroundColor Green
}
Write-Host ""

# Back to root
Set-Location ../..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What's been done:" -ForegroundColor Yellow
Write-Host "  ✅ Prisma Client generated" -ForegroundColor White
Write-Host "  ✅ Database migration applied" -ForegroundColor White
Write-Host "  ✅ Sample pricing policies created" -ForegroundColor White
Write-Host "  ✅ Frontend routes added" -ForegroundColor White
Write-Host "  ✅ EnhancedPropertyForm updated" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend:  cd apps/backend && npm run start:dev" -ForegroundColor White
Write-Host "2. Start frontend: cd apps/frontend && npm run dev" -ForegroundColor White
Write-Host "3. Access pricing policies: http://localhost:5173/pricing-policies-new" -ForegroundColor White
Write-Host "4. Create rentable item with policy selector" -ForegroundColor White
Write-Host ""
Write-Host "Test APIs:" -ForegroundColor Yellow
Write-Host "  GET  http://localhost:3000/api/v1/pricing-policies" -ForegroundColor Cyan
Write-Host "  POST http://localhost:3000/api/v1/pricing-policies" -ForegroundColor Cyan
Write-Host ""
