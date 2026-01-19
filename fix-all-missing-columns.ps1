# Fix All Missing Columns
# Date: 2026-01-19

Write-Host "Fixing all missing columns..." -ForegroundColor Yellow

Set-Location apps/backend

# Fix all missing columns in one go
$fixSql = @"
-- Fix agreements table
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_code VARCHAR UNIQUE;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_title VARCHAR;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_number VARCHAR;

-- Already done in previous migration
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR;
"@

$fixSql | Out-File -FilePath "fix_all.sql" -Encoding UTF8 -NoNewline
Get-Content "fix_all.sql" -Raw | npx prisma db execute --stdin
Remove-Item "fix_all.sql"

Write-Host "OK: All columns fixed" -ForegroundColor Green

Set-Location ../..
