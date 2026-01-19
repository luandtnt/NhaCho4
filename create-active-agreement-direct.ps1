# Create ACTIVE Agreement Directly via Database
# Date: 2026-01-19

Write-Host "Creating ACTIVE agreement directly..." -ForegroundColor Yellow

Set-Location apps/backend

# Get rentable item ID from seed
$rentableItemId = "eec51027-f512-409a-a8ed-2bfd627f3f61"

# Create agreement directly in database
$sql = @"
INSERT INTO agreements (
  id, org_id, landlord_party_id, tenant_party_id, rentable_item_id,
  contract_code, contract_title, state, agreement_type,
  start_at, end_at, billing_day, payment_due_days,
  base_price, deposit_amount, service_fee, building_mgmt_fee,
  parking_fee_motorbike, internet_fee,
  electricity_billing, electricity_rate, water_billing, water_rate,
  payment_cycle, house_rules, allow_pets, allow_smoking, allow_guests,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '$rentableItemId',
  'AG-2026-TEST01',
  'Test Agreement for Invoice Module',
  'ACTIVE',
  'lease',
  '2026-01-01 00:00:00',
  '2026-12-31 23:59:59',
  1,
  5,
  5000000,
  10000000,
  500000,
  300000,
  100000,
  150000,
  'OWNER_RATE',
  3500,
  'OWNER_RATE',
  15000,
  'MONTHLY',
  'No pets, No smoking',
  false,
  false,
  true,
  NOW(),
  NOW()
) RETURNING id, contract_code, state;
"@

$sql | Out-File -FilePath "create_agreement.sql" -Encoding UTF8 -NoNewline
$result = Get-Content "create_agreement.sql" -Raw | npx prisma db execute --stdin
Remove-Item "create_agreement.sql"

Write-Host "OK: Agreement created directly in database" -ForegroundColor Green
Write-Host "   Contract Code: AG-2026-TEST01" -ForegroundColor Gray
Write-Host "   State: ACTIVE" -ForegroundColor Gray

Set-Location ../..

Write-Host ""
Write-Host "You can now test invoice APIs:" -ForegroundColor Yellow
Write-Host "  .\test-invoice-apis-simple.ps1" -ForegroundColor Gray
Write-Host ""
