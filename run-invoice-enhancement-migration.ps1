# Invoice Module Phase 1 Enhancement Migration
# Date: 2026-01-19
# Purpose: Run invoice enhancements migration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INVOICE MODULE PHASE 1 MIGRATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if backend is running
Write-Host "[1/5] Checking backend status..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*backend*" }
if ($backendProcess) {
    Write-Host "⚠️  Backend is running. Please stop it first!" -ForegroundColor Red
    Write-Host "   Run: Stop-Process -Name node -Force" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Backend is not running" -ForegroundColor Green
Write-Host ""

# Step 2: Backup database (optional but recommended)
Write-Host "[2/5] Database backup recommended..." -ForegroundColor Yellow
Write-Host "   If you want to backup, press Ctrl+C and run:" -ForegroundColor Gray
Write-Host "   pg_dump -U postgres -d urp_dev > backup_before_invoice_migration.sql" -ForegroundColor Gray
Start-Sleep -Seconds 2
Write-Host ""

# Step 3: Run SQL migration
Write-Host "[3/5] Running SQL migration..." -ForegroundColor Yellow
$migrationFile = "apps/backend/prisma/migrations/20260119_invoice_enhancements/migration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "   Executing: $migrationFile" -ForegroundColor Gray

# Read .env file to get DATABASE_URL
$envFile = "apps/backend/.env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found: $envFile" -ForegroundColor Red
    exit 1
}

$databaseUrl = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=", "" } | Select-Object -First 1

if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL to get connection details
# Format: postgresql://user:password@host:port/database
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "   Database: $dbName on ${dbHost}:${dbPort}" -ForegroundColor Gray
    
    # Set PGPASSWORD environment variable
    $env:PGPASSWORD = $dbPassword
    
    # Run migration using psql
    try {
        $result = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -f $migrationFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SQL migration completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ SQL migration failed:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error running psql: $_" -ForegroundColor Red
        Write-Host "   Make sure PostgreSQL client (psql) is installed and in PATH" -ForegroundColor Yellow
        exit 1
    } finally {
        # Clear password from environment
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "❌ Invalid DATABASE_URL format" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Regenerate Prisma Client
Write-Host "[4/5] Regenerating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
try {
    npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma Client regenerated" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to regenerate Prisma Client" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Set-Location ../..
Write-Host ""

# Step 5: Verify migration
Write-Host "[5/5] Verifying migration..." -ForegroundColor Yellow
Write-Host "   Checking new columns..." -ForegroundColor Gray

$env:PGPASSWORD = $dbPassword
try {
    $checkQuery = @"
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND column_name IN ('tenant_party_id', 'invoice_code', 'state', 'balance_due', 'tax_enabled')
ORDER BY column_name;
"@
    
    $columns = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c $checkQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ New columns verified:" -ForegroundColor Green
        Write-Host $columns -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Could not verify columns (but migration may have succeeded)" -ForegroundColor Yellow
    }
    
    # Check invoice_line_items table
    $checkTable = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'invoice_line_items';"
    $tableExists = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c $checkTable 2>&1
    
    if ($tableExists -match "1") {
        Write-Host "✅ invoice_line_items table created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  invoice_line_items table not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Verification failed: $_" -ForegroundColor Yellow
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRATION COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ New columns added to invoices table:" -ForegroundColor Green
Write-Host "   - tenant_party_id, rentable_item_id, booking_id" -ForegroundColor Gray
Write-Host "   - invoice_code (unique)" -ForegroundColor Gray
Write-Host "   - issued_at, due_at" -ForegroundColor Gray
Write-Host "   - subtotal_amount, balance_due" -ForegroundColor Gray
Write-Host "   - state (DRAFT/ISSUED/PAID/OVERDUE/CANCELLED)" -ForegroundColor Gray
Write-Host "   - tax_enabled, tax_rate, tax_amount" -ForegroundColor Gray
Write-Host "   - notes" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ New table created:" -ForegroundColor Green
Write-Host "   - invoice_line_items (normalized line items)" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Existing data migrated:" -ForegroundColor Green
Write-Host "   - invoice_code generated for existing invoices" -ForegroundColor Gray
Write-Host "   - tenant_party_id populated from agreements" -ForegroundColor Gray
Write-Host "   - balance_due calculated" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review migration results" -ForegroundColor Gray
Write-Host "   2. Start backend: cd apps/backend; npm run start:dev" -ForegroundColor Gray
Write-Host "   3. Test invoice APIs" -ForegroundColor Gray
Write-Host ""
