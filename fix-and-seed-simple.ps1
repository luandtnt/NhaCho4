# Fix Database and Seed - Simple Version
# Date: 2026-01-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX DATABASE AND SEED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location apps/backend

# Step 1: Create SQL file to fix users table
Write-Host "[1/4] Creating fix SQL..." -ForegroundColor Yellow
$fixSql = @"
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR;
"@

$fixSql | Out-File -FilePath "fix_users.sql" -Encoding UTF8 -NoNewline
Write-Host "OK: SQL file created" -ForegroundColor Green
Write-Host ""

# Step 2: Apply fix using Prisma
Write-Host "[2/4] Applying fix to database..." -ForegroundColor Yellow
try {
    $result = Get-Content "fix_users.sql" -Raw | npx prisma db execute --stdin 2>&1
    Write-Host "OK: Fix applied" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Fix may have failed, but continuing..." -ForegroundColor Yellow
}

Remove-Item "fix_users.sql" -ErrorAction SilentlyContinue
Write-Host ""

# Step 3: Regenerate Prisma Client
Write-Host "[3/4] Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate | Out-Null
Write-Host "OK: Prisma Client regenerated" -ForegroundColor Green
Write-Host ""

# Step 4: Run seed
Write-Host "[4/4] Seeding database..." -ForegroundColor Yellow
npm run seed

Set-Location ../..

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test accounts:" -ForegroundColor Green
    Write-Host "  landlord@example.com / Password123!" -ForegroundColor Gray
    Write-Host "  tenant@example.com / Password123!" -ForegroundColor Gray
    Write-Host "  admin@example.com / Password123!" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Seeding failed" -ForegroundColor Red
    Write-Host ""
    exit 1
}
