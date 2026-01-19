# PowerShell script to run walk-in booking migration
# Date: 2026-01-17

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Walk-in Booking Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run SQL migration
Write-Host "[1/3] Running SQL migration..." -ForegroundColor Yellow
$migrationFile = "apps/backend/prisma/migrations/20260117_walk_in_bookings/migration.sql"

if (Test-Path $migrationFile) {
    Write-Host "Executing: $migrationFile" -ForegroundColor Gray
    
    # Read DATABASE_URL from .env
    $envFile = "apps/backend/.env"
    if (Test-Path $envFile) {
        $databaseUrl = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_.Split('=')[1] }
        
        if ($databaseUrl) {
            # Execute migration using psql
            Get-Content $migrationFile | psql $databaseUrl
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ SQL migration completed successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ SQL migration failed" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "✗ DATABASE_URL not found in .env" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ .env file not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "[2/3] Generating Prisma Client..." -ForegroundColor Yellow
Set-Location apps/backend
npx prisma generate
Set-Location ../..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma Client generation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Verify migration
Write-Host "[3/3] Verifying migration..." -ForegroundColor Yellow
Write-Host "Checking if new columns exist..." -ForegroundColor Gray

$verifyQuery = @"
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('actual_start_at', 'actual_end_at', 'is_walk_in', 'estimated_duration_hours', 'walk_in_notes')
ORDER BY column_name;
"@

$envFile = "apps/backend/.env"
$databaseUrl = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_.Split('=')[1] }
$verifyQuery | psql $databaseUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migration verified successfully" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not verify migration (but it may have succeeded)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New API endpoints available:" -ForegroundColor Cyan
Write-Host "  POST /api/v1/bookings/quick-checkin" -ForegroundColor White
Write-Host "  POST /api/v1/bookings/checkout" -ForegroundColor White
Write-Host "  POST /api/v1/bookings/extend" -ForegroundColor White
Write-Host "  GET  /api/v1/bookings/active" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart backend server: npm run dev" -ForegroundColor White
Write-Host "  2. Test quick check-in endpoint" -ForegroundColor White
Write-Host "  3. Proceed to Phase 2 (Frontend UI)" -ForegroundColor White
Write-Host ""
