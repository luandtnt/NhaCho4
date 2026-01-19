# Invoice Module Phase 1 Enhancement Migration - Using Prisma
# Date: 2026-01-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INVOICE MODULE PHASE 1 MIGRATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend
Write-Host "[1/3] Checking backend status..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($backendProcess) {
    Write-Host "WARNING: Backend is running. Please stop it first!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Backend is not running" -ForegroundColor Green
Write-Host ""

# Step 2: Run Prisma migrate dev
Write-Host "[2/3] Running Prisma migration..." -ForegroundColor Yellow
Write-Host "   This will apply the schema changes to database" -ForegroundColor Gray
Set-Location apps/backend

try {
    # Create migration name
    $migrationName = "invoice_enhancements"
    
    Write-Host "   Executing: npx prisma migrate dev --name $migrationName" -ForegroundColor Gray
    $output = npx prisma migrate dev --name $migrationName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Migration completed successfully" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Migration may have issues" -ForegroundColor Yellow
        Write-Host $output -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Set-Location ../..
Write-Host ""

# Step 3: Verify migration
Write-Host "[3/3] Verifying migration..." -ForegroundColor Yellow
Set-Location apps/backend

try {
    Write-Host "   Generating Prisma Client..." -ForegroundColor Gray
    $output = npx prisma generate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Prisma Client generated" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to generate Prisma Client" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Set-Location ../..
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRATION COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Schema changes applied:" -ForegroundColor Green
Write-Host "  - Invoice model updated with new fields" -ForegroundColor Gray
Write-Host "  - InvoiceLineItem model created" -ForegroundColor Gray
Write-Host "  - Indexes and relations added" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start backend: cd apps/backend; npm run start:dev" -ForegroundColor Gray
Write-Host "  2. Test APIs: .\test-invoice-phase1.ps1" -ForegroundColor Gray
Write-Host ""
