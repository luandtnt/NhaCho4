# Run Agreement Enhancement Migration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Agreement Module Enhancement Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  - Add rentable_item_id to agreements" -ForegroundColor Gray
Write-Host "  - Add pricing fields (base_price, deposit, fees)" -ForegroundColor Gray
Write-Host "  - Add utilities billing fields" -ForegroundColor Gray
Write-Host "  - Add status tracking timestamps" -ForegroundColor Gray
Write-Host "  - Add termination & renewal fields" -ForegroundColor Gray
Write-Host "  - Add tenant request fields" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Using 'db push' to avoid data loss" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Step 1: Pushing schema changes to database..." -ForegroundColor Yellow

try {
    Push-Location apps/backend
    
    # Use db push instead of migrate to avoid drift issues
    npx prisma db push
    
    Write-Host "[OK] Schema pushed to database" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Step 2: Generating Prisma client..." -ForegroundColor Yellow
    
    npx prisma generate
    
    Write-Host "[OK] Prisma client generated" -ForegroundColor Green
    
    Pop-Location
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "What was added to agreements table:" -ForegroundColor Yellow
    Write-Host "  - rentable_item_id (link to property)" -ForegroundColor Gray
    Write-Host "  - Pricing fields (base_price, deposit, fees)" -ForegroundColor Gray
    Write-Host "  - Utilities (electricity_billing, water_billing)" -ForegroundColor Gray
    Write-Host "  - Status tracking (sent_at, confirmed_at, etc.)" -ForegroundColor Gray
    Write-Host "  - Termination fields" -ForegroundColor Gray
    Write-Host "  - Renewal fields" -ForegroundColor Gray
    Write-Host "  - Request fields" -ForegroundColor Gray
    Write-Host "  - Snapshots & notes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart backend: cd apps/backend && npm run dev" -ForegroundColor Gray
    Write-Host "  2. Check database: npx prisma studio" -ForegroundColor Gray
    Write-Host "  3. Ready for Step 2: Backend Service implementation" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "To check status:" -ForegroundColor Yellow
    Write-Host "  cd apps/backend" -ForegroundColor Gray
    Write-Host "  npx prisma db push --help" -ForegroundColor Gray
    Write-Host ""
    Pop-Location
    exit 1
}
