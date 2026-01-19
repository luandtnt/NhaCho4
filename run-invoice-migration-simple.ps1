# Invoice Module Phase 1 Enhancement Migration - Simple Version
# Date: 2026-01-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INVOICE MODULE PHASE 1 MIGRATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend
Write-Host "[1/4] Checking backend status..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($backendProcess) {
    Write-Host "WARNING: Backend is running. Please stop it first!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Backend is not running" -ForegroundColor Green
Write-Host ""

# Step 2: Read DATABASE_URL from .env
Write-Host "[2/4] Reading database configuration..." -ForegroundColor Yellow
$envFile = "apps/backend/.env"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found: $envFile" -ForegroundColor Red
    exit 1
}

$databaseUrl = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=", "" } | Select-Object -First 1

if (-not $databaseUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "OK: Database configuration loaded" -ForegroundColor Green
    Write-Host "   Database: $dbName" -ForegroundColor Gray
    Write-Host "   Host: $dbHost" -ForegroundColor Gray
    Write-Host "   Port: $dbPort" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Invalid DATABASE_URL format" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Run SQL migration
Write-Host "[3/4] Running SQL migration..." -ForegroundColor Yellow
$migrationFile = "apps/backend/prisma/migrations/20260119_invoice_enhancements/migration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "   Executing: $migrationFile" -ForegroundColor Gray

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $dbPassword

try {
    $output = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -f $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: SQL migration completed successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: SQL migration failed" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to run psql: $_" -ForegroundColor Red
    Write-Host "   Make sure PostgreSQL client (psql) is installed and in PATH" -ForegroundColor Yellow
    exit 1
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Write-Host ""

# Step 4: Regenerate Prisma Client
Write-Host "[4/4] Regenerating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
try {
    $output = npx prisma generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Prisma Client regenerated" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to regenerate Prisma Client" -ForegroundColor Red
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
Write-Host "MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New columns added to invoices table:" -ForegroundColor Green
Write-Host "  - tenant_party_id, rentable_item_id, booking_id" -ForegroundColor Gray
Write-Host "  - invoice_code (unique)" -ForegroundColor Gray
Write-Host "  - issued_at, due_at" -ForegroundColor Gray
Write-Host "  - subtotal_amount, balance_due" -ForegroundColor Gray
Write-Host "  - state, tax_enabled, tax_rate, tax_amount" -ForegroundColor Gray
Write-Host "  - notes" -ForegroundColor Gray
Write-Host ""
Write-Host "New table created:" -ForegroundColor Green
Write-Host "  - invoice_line_items" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review migration results" -ForegroundColor Gray
Write-Host "  2. Start backend" -ForegroundColor Gray
Write-Host "  3. Test invoice APIs" -ForegroundColor Gray
Write-Host ""
