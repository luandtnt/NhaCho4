# Fix Database and Seed
# Date: 2026-01-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX DATABASE AND SEED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we can connect to database
Write-Host "[1/5] Checking database connection..." -ForegroundColor Yellow
Set-Location apps/backend

try {
    $dbCheck = npx prisma db execute --stdin 2>&1 <<< "SELECT 1;"
    Write-Host "OK: Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Cannot connect to database" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host ""

# Step 2: Apply missing columns to users table
Write-Host "[2/5] Fixing users table..." -ForegroundColor Yellow

$fixSql = @"
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR;

-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('name', 'phone', 'emergency_contact', 'id_number');
"@

# Save SQL to temp file
$fixSql | Out-File -FilePath "temp_fix.sql" -Encoding UTF8

try {
    # Try to execute using npx prisma db execute
    $result = Get-Content "temp_fix.sql" | npx prisma db execute --stdin 2>&1
    Write-Host "OK: Users table fixed" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not fix users table automatically" -ForegroundColor Yellow
    Write-Host "   Trying alternative method..." -ForegroundColor Gray
}

# Clean up temp file
Remove-Item "temp_fix.sql" -ErrorAction SilentlyContinue

Write-Host ""

# Step 3: Regenerate Prisma Client
Write-Host "[3/5] Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate | Out-Null
    Write-Host "OK: Prisma Client regenerated" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to regenerate Prisma Client" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host ""

# Step 4: Clear existing data (optional)
Write-Host "[4/5] Clearing existing data..." -ForegroundColor Yellow
$clearSql = @"
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE listing_rentable_items CASCADE;
TRUNCATE TABLE listings CASCADE;
TRUNCATE TABLE invoice_line_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE ledger_entries CASCADE;
TRUNCATE TABLE agreements CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE booking_price_snapshots CASCADE;
TRUNCATE TABLE rentable_items CASCADE;
TRUNCATE TABLE space_nodes CASCADE;
TRUNCATE TABLE assets CASCADE;
TRUNCATE TABLE parties CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE config_bundles CASCADE;
TRUNCATE TABLE organizations CASCADE;
"@

$clearSql | Out-File -FilePath "temp_clear.sql" -Encoding UTF8

try {
    Get-Content "temp_clear.sql" | npx prisma db execute --stdin 2>&1 | Out-Null
    Write-Host "OK: Existing data cleared" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not clear data (may be empty already)" -ForegroundColor Yellow
}

Remove-Item "temp_clear.sql" -ErrorAction SilentlyContinue
Write-Host ""

# Step 5: Run seed
Write-Host "[5/5] Seeding database..." -ForegroundColor Yellow
try {
    npm run seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Seeding failed" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
} catch {
    Write-Host "ERROR: Seeding failed: $_" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Set-Location ../..
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor Green
Write-Host "  Landlord: landlord@example.com / Password123!" -ForegroundColor Gray
Write-Host "  Tenant: tenant@example.com / Password123!" -ForegroundColor Gray
Write-Host "  Admin: admin@example.com / Password123!" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start backend: cd apps/backend; npm run dev" -ForegroundColor Gray
Write-Host "  2. Test APIs: .\test-invoice-apis-simple.ps1" -ForegroundColor Gray
Write-Host ""
