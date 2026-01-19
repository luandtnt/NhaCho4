

# =====================
# CONFIG
# =====================
$BASE_URL = "http://localhost:3000/api/v1"
$LANDLORD_EMAIL = "landlord@example.com"
$LANDLORD_PASSWORD = "Password123!"

# Toggles
$ENABLE_BOOKING_TESTS   = $true     # Holds/Bookings/Conflicts (Availability Engine)
$ENABLE_AGREEMENT_TESTS = $true     # Agreement Engine state transitions
$ENABLE_RBAC_NEGATIVE   = $true     # 401/403 checks
$ENABLE_CONFIG_NEGATIVE = $true     # invalid types should fail (if you validate against ConfigBundle)
$ENABLE_DESTRUCTIVE_CLEANUP = $false # if $true, attempt to delete nodes; default is safer (archive asset only)

# Expected status variants for "conflict" / "validation" across implementations
$EXPECT_CONFLICT_STATUSES   = @(409, 400, 422)
$EXPECT_VALIDATION_STATUSES = @(400, 422)
$EXPECT_NOT_FOUND_STATUSES  = @(404)

# Default types (override if your config uses different values)
# IMPORTANT: If your platform is config-driven, you should ensure these are valid in the ACTIVE ConfigBundle.
$ASSET_TYPE_DEFAULT   = "apartment_building"
$NODE_TYPE_BUILDING   = "building"
$NODE_TYPE_FLOOR      = "floor"
$NODE_TYPE_UNIT       = "unit"
$ALLOC_EXCLUSIVE      = "exclusive"
$ALLOC_CAPACITY       = "capacity"
$ALLOC_SLOT           = "slot"

# Time helpers
function Get-IsoUtc([datetime]$dt) {
  return $dt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

# =====================
# TEST HARNESS
# =====================
$script:testResults = @()
$script:passCount = 0
$script:failCount = 0

function Add-Result {
  param([string]$Name, [string]$Status, [string]$Details = "")
  $script:testResults += [pscustomobject]@{ Name = $Name; Status = $Status; Details = $Details }
}

function Pass {
  param([string]$Name, [string]$Details = "")
  Write-Host "PASS: $Name" -ForegroundColor Green
  $script:passCount++
  Add-Result -Name $Name -Status "PASS" -Details $Details
}

function Fail {
  param([string]$Name, [string]$Details = "")
  Write-Host "FAIL: $Name" -ForegroundColor Red
  if ($Details) { Write-Host "  $Details" -ForegroundColor DarkRed }
  $script:failCount++
  Add-Result -Name $Name -Status "FAIL" -Details $Details
}

function Section {
  param([string]$Title)
  Write-Host "`n========================================" -ForegroundColor Yellow
  Write-Host $Title -ForegroundColor Yellow
  Write-Host "========================================" -ForegroundColor Yellow
}

function Assert-True {
  param([string]$Name, [bool]$Condition, [string]$Message = "")
  if ($Condition) { Pass -Name "ASSERT: $Name" }
  else { Fail -Name "ASSERT: $Name" -Details $Message }
}

function Assert-NotNull {
  param([string]$Name, $Value)
  $ok = $null -ne $Value
  Assert-True -Name $Name -Condition $ok -Message "Value is null"
}

function Assert-Equal {
  param([string]$Name, $Actual, $Expected)
  $ok = ($Actual -eq $Expected)
  Assert-True -Name $Name -Condition $ok -Message "Expected='$Expected' Actual='$Actual'"
}

function Try-ParseJson([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  try { return ($text | ConvertFrom-Json -ErrorAction Stop) } catch { return $null }
}

function Invoke-Api {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int[]]$ExpectedStatuses = @(200)
  )

  Write-Host "`n--- $Name ---" -ForegroundColor Cyan
  Write-Host "$Method $Url" -ForegroundColor DarkCyan

  $params = @{
    Uri = $Url
    Method = $Method
    Headers = $Headers
    ContentType = "application/json"
    UseBasicParsing = $true
  }

  if ($Body -ne $null) {
    $params.Body = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    $resp = Invoke-WebRequest @params
    $status = [int]$resp.StatusCode
    $json = Try-ParseJson $resp.Content

    if ($ExpectedStatuses -contains $status) {
      Pass -Name $Name -Details "Status=$status"
      return [pscustomobject]@{ status = $status; body = $json; raw = $resp.Content; headers = $resp.Headers }
    } else {
      $snippet = $resp.Content
      if ($snippet -and $snippet.Length -gt 300) { $snippet = $snippet.Substring(0,300) }
      Fail -Name $Name -Details ("Expected=[{0}] Got={1} Body={2}" -f ($ExpectedStatuses -join ","), $status, $snippet)
      return [pscustomobject]@{ status = $status; body = $json; raw = $resp.Content; headers = $resp.Headers }
    }
  } catch {
    # Safe status extraction (works for HTTP errors and network errors)
    $status = $null
    $raw = ""
    $hdr = $null
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $status = [int]$_.Exception.Response.StatusCode
      }
    } catch {}

    try {
      if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $raw = $reader.ReadToEnd()
      }
      if ($_.Exception.Response -and $_.Exception.Response.Headers) { $hdr = $_.Exception.Response.Headers }
    } catch {}

    $json = Try-ParseJson $raw

    if ($status -ne $null -and ($ExpectedStatuses -contains $status)) {
      Pass -Name $Name -Details "Status=$status"
      return [pscustomobject]@{ status = $status; body = $json; raw = $raw; headers = $hdr }
    }

    $msg = $_.Exception.Message
    if ($status -eq $null) {
      Fail -Name $Name -Details "Network/Unknown error: $msg"
    } else {
      $snippet = $raw
      if ($snippet -and $snippet.Length -gt 300) { $snippet = $snippet.Substring(0,300) }
      Fail -Name $Name -Details ("Expected=[{0}] Got={1} Error={2} Body={3}" -f ($ExpectedStatuses -join ","), $status, $msg, $snippet)
    }
    return [pscustomobject]@{ status = $status; body = $json; raw = $raw; headers = $hdr }
  }
}

# =====================
# START
# =====================
Section "URP M3 PROPERTY OPS - STRICT GATE TEST SUITE"

# 0) RBAC / Auth negatives (minimal)
if ($ENABLE_RBAC_NEGATIVE) {
  Section "RBAC NEGATIVE (401 sanity checks)"
  Invoke-Api -Name "GET /assets without token => 401" -Method "GET" -Url "$BASE_URL/assets?page=1&page_size=1" -ExpectedStatuses @(401)
  Invoke-Api -Name "POST /assets without token => 401" -Method "POST" -Url "$BASE_URL/assets" -Body @{ asset_type="x"; name="x" } -ExpectedStatuses @(401)
}

# 1) Auth
Section "AUTHENTICATION"
$login = Invoke-Api -Name "Login as Landlord" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$LANDLORD_EMAIL; password=$LANDLORD_PASSWORD } -ExpectedStatuses @(201,200)
if (-not $login.body) { Write-Host "Cannot proceed without auth." -ForegroundColor Red; exit 1 }
$accessToken = $login.body.access_token
Assert-NotNull -Name "Access token exists" -Value $accessToken

$authHeaders = @{ "Authorization" = "Bearer $accessToken" }
$me = Invoke-Api -Name "Get current user profile" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "ME response body" -Value $me.body
$orgId = $me.body.org_id
Assert-NotNull -Name "org_id exists" -Value $orgId

# =====================
# ASSETS
# =====================
Section "ASSET MANAGEMENT"

# Optional config-negative: invalid type should fail (only if you validate against ConfigBundle)
if ($ENABLE_CONFIG_NEGATIVE) {
  Invoke-Api -Name "Create asset with INVALID asset_type => validation fail" `
    -Method "POST" -Url "$BASE_URL/assets" -Headers $authHeaders `
    -Body @{ asset_type="__invalid_type__"; name="Invalid Asset"; address_json=@{}; attrs=@{} } `
    -ExpectedStatuses $EXPECT_VALIDATION_STATUSES
}

$assetName = "Sunrise Tower " + (Get-Date).ToString("yyyyMMdd-HHmmss")
$assetCreate = Invoke-Api -Name "Create asset" -Method "POST" -Url "$BASE_URL/assets" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  asset_type = $ASSET_TYPE_DEFAULT
  name = $assetName
  address_json = @{ street="456 Nguyen Trai"; district="Thanh Xuan"; city="Hanoi" }
  attrs = @{ year_built=2022; floors=20 }
}
$assetId = $assetCreate.body.id
Assert-NotNull -Name "assetId returned" -Value $assetId

$assetsList = Invoke-Api -Name "List assets" -Method "GET" -Url "$BASE_URL/assets?page=1&page_size=20" -Headers $authHeaders -ExpectedStatuses @(200)
# Assert list includes assetId if list uses items[]
if ($assetsList.body -and $assetsList.body.items) {
  $found = (($assetsList.body.items | Where-Object { $_.id -eq $assetId }) | Measure-Object).Count -gt 0
  Assert-True -Name "Assets list contains created asset" -Condition $found -Message "assetId=$assetId not found"
}

$assetDetail = Invoke-Api -Name "Get asset by ID" -Method "GET" -Url "$BASE_URL/assets/$assetId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Asset name matches" -Actual $assetDetail.body.name -Expected $assetName

$assetName2 = "$assetName - Updated"
Invoke-Api -Name "Update asset" -Method "PUT" -Url "$BASE_URL/assets/$assetId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  name = $assetName2
  attrs = @{ year_built=2022; floors=20; parking_spaces=50 }
}
$assetDetail2 = Invoke-Api -Name "Get asset after update" -Method "GET" -Url "$BASE_URL/assets/$assetId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Asset updated name persisted" -Actual $assetDetail2.body.name -Expected $assetName2

# =====================
# SPACE NODES (GRAPH)
# =====================
Section "SPACE NODE MANAGEMENT (GRAPH)"

# Create building node
$buildingCreate = Invoke-Api -Name "Create space node (building)" -Method "POST" -Url "$BASE_URL/space-nodes" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  asset_id = $assetId
  node_type = $NODE_TYPE_BUILDING
  name = "Building A"
  attrs = @{ description="Main building" }
}
$buildingId = $buildingCreate.body.id
Assert-NotNull -Name "buildingId returned" -Value $buildingId

# Create floor under building
$floorCreate = Invoke-Api -Name "Create space node (floor)" -Method "POST" -Url "$BASE_URL/space-nodes" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  asset_id = $assetId
  parent_id = $buildingId
  node_type = $NODE_TYPE_FLOOR
  name = "Floor 5"
  attrs = @{ floor_number = 5 }
}
$floorId = $floorCreate.body.id
Assert-NotNull -Name "floorId returned" -Value $floorId

# Create unit under floor
$unitCreate = Invoke-Api -Name "Create space node (unit)" -Method "POST" -Url "$BASE_URL/space-nodes" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  asset_id = $assetId
  parent_id = $floorId
  node_type = $NODE_TYPE_UNIT
  name = "Unit 501"
  attrs = @{ unit_number="501" }
}
$unitId = $unitCreate.body.id
Assert-NotNull -Name "unitId returned" -Value $unitId

# List nodes for asset
Invoke-Api -Name "List space nodes for asset" -Method "GET" -Url "$BASE_URL/space-nodes?asset_id=$assetId" -Headers $authHeaders -ExpectedStatuses @(200)

# Get node by ID and assert
$unitDetail = Invoke-Api -Name "Get space node by ID" -Method "GET" -Url "$BASE_URL/space-nodes/$unitId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Unit node name matches" -Actual $unitDetail.body.name -Expected "Unit 501"

# Update unit node
Invoke-Api -Name "Update space node" -Method "PUT" -Url "$BASE_URL/space-nodes/$unitId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  name = "Unit 501 - Premium"
  attrs = @{ unit_number="501"; premium=$true }
}
$unitDetail2 = Invoke-Api -Name "Get unit after update" -Method "GET" -Url "$BASE_URL/space-nodes/$unitId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Unit name updated persisted" -Actual $unitDetail2.body.name -Expected "Unit 501 - Premium"

# Tree (hierarchy)
$tree = Invoke-Api -Name "Get space node tree" -Method "GET" -Url "$BASE_URL/space-nodes/$buildingId/tree" -Headers $authHeaders -ExpectedStatuses @(200)
# Best-effort assertions depending on tree shape
if ($tree.body) {
  # If tree is { id, children: [...] }
  $rootId = $tree.body.id
  if ($rootId) {
    Assert-Equal -Name "Tree root is buildingId" -Actual $rootId -Expected $buildingId
  }
  if ($tree.body.children) {
    $hasFloor = (($tree.body.children | Where-Object { $_.id -eq $floorId }) | Measure-Object).Count -gt 0
    Assert-True -Name "Tree contains floor child" -Condition $hasFloor -Message "floorId=$floorId not found in tree.children"
  }
}

# Integrity negative: prevent cycles (set building parent to unit)
Invoke-Api -Name "Prevent cycles: set building parent to unit => fail" -Method "PUT" -Url "$BASE_URL/space-nodes/$buildingId" -Headers $authHeaders `
  -ExpectedStatuses $EXPECT_CONFLICT_STATUSES -Body @{ parent_id = $unitId }

# Integrity negative: cross-asset parenting should fail
$asset2Create = Invoke-Api -Name "Create second asset (for cross-asset test)" -Method "POST" -Url "$BASE_URL/assets" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  asset_type = $ASSET_TYPE_DEFAULT
  name = "CrossAsset Dummy " + (Get-Date).ToString("yyyyMMdd-HHmmss")
  address_json = @{ street="1 Test"; district="Test"; city="Hanoi" }
  attrs = @{}
}
$asset2Id = $asset2Create.body.id
Assert-NotNull -Name "asset2Id returned" -Value $asset2Id

Invoke-Api -Name "Cross-asset: create node under asset2 but parent from asset1 => fail" -Method "POST" -Url "$BASE_URL/space-nodes" -Headers $authHeaders `
  -ExpectedStatuses $EXPECT_CONFLICT_STATUSES -Body @{
    asset_id = $asset2Id
    parent_id = $buildingId
    node_type = $NODE_TYPE_FLOOR
    name = "Invalid floor"
    attrs = @{}
  }

# Archive/delete asset2 (best-effort)
Invoke-Api -Name "Cleanup asset2 (archive/delete)" -Method "DELETE" -Url "$BASE_URL/assets/$asset2Id" -Headers $authHeaders -ExpectedStatuses @(200,204)

# =====================
# RENTABLE ITEMS
# =====================
Section "RENTABLE ITEM MANAGEMENT"

# Negative: invalid allocation_type should fail
Invoke-Api -Name "Create rentable item invalid allocation_type => fail" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders `
  -ExpectedStatuses $EXPECT_VALIDATION_STATUSES -Body @{
    space_node_id = $unitId
    code = "INVALID-ALLOC-" + (Get-Random)
    allocation_type = "__invalid__"
    attrs = @{}
  }

# Create exclusive rentable
$exclusiveCode = "UNIT-501-EX-" + (Get-Date).ToString("HHmmss")
$rentExclusive = Invoke-Api -Name "Create rentable item (exclusive)" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  space_node_id = $unitId
  code = $exclusiveCode
  allocation_type = $ALLOC_EXCLUSIVE
  attrs = @{ bedrooms=2; bathrooms=2; area_sqm=80 }
}
$rentExclusiveId = $rentExclusive.body.id
Assert-NotNull -Name "exclusive rentable_item_id" -Value $rentExclusiveId

# Negative: capacity=0 should fail (if capacity items require capacity > 0)
Invoke-Api -Name "Create capacity item with capacity=0 => fail" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders `
  -ExpectedStatuses $EXPECT_VALIDATION_STATUSES -Body @{
    space_node_id = $unitId
    code = "UNIT-501-CAP-0-" + (Get-Random)
    allocation_type = $ALLOC_CAPACITY
    capacity = 0
    attrs = @{}
  }

# Create capacity rentable
$capCode = "UNIT-501-CAP-" + (Get-Date).ToString("HHmmss")
$rentCap = Invoke-Api -Name "Create rentable item (capacity)" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  space_node_id = $unitId
  code = $capCode
  allocation_type = $ALLOC_CAPACITY
  capacity = 4
  attrs = @{ type="shared_room" }
}
$rentCapId = $rentCap.body.id
Assert-NotNull -Name "capacity rentable_item_id" -Value $rentCapId

# Optional: slot rentable (skip if your API doesn't support yet)
$slotCode = "UNIT-501-SLOT-" + (Get-Date).ToString("HHmmss")
$rentSlot = Invoke-Api -Name "Create rentable item (slot) (optional)" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders -ExpectedStatuses @(201, $EXPECT_VALIDATION_STATUSES[0]) -Body @{
  space_node_id = $unitId
  code = $slotCode
  allocation_type = $ALLOC_SLOT
  attrs = @{ slot_minutes=60 }
}
$rentSlotId = $rentSlot.body.id

# Duplicate code should fail (if unique)
Invoke-Api -Name "Duplicate rentable code => fail (if unique)" -Method "POST" -Url "$BASE_URL/rentable-items" -Headers $authHeaders `
  -ExpectedStatuses $EXPECT_CONFLICT_STATUSES -Body @{
    space_node_id = $unitId
    code = $exclusiveCode
    allocation_type = $ALLOC_EXCLUSIVE
    attrs = @{}
  }

# List rentable for unit
$rentList = Invoke-Api -Name "List rentable items for unit" -Method "GET" -Url "$BASE_URL/rentable-items?space_node_id=$unitId" -Headers $authHeaders -ExpectedStatuses @(200)
if ($rentList.body -and $rentList.body.items) {
  $hasExclusive = (($rentList.body.items | Where-Object { $_.id -eq $rentExclusiveId }) | Measure-Object).Count -gt 0
  Assert-True -Name "Rentable list contains exclusive" -Condition $hasExclusive -Message "exclusiveId=$rentExclusiveId not found"
}

# Get rentable by ID
$rentDetail = Invoke-Api -Name "Get rentable item by ID" -Method "GET" -Url "$BASE_URL/rentable-items/$rentExclusiveId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Rentable code matches" -Actual $rentDetail.body.code -Expected $exclusiveCode

# Update rentable
$exclusiveCode2 = "$exclusiveCode-PREMIUM"
Invoke-Api -Name "Update rentable item" -Method "PUT" -Url "$BASE_URL/rentable-items/$rentExclusiveId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  code = $exclusiveCode2
  attrs = @{ bedrooms=2; bathrooms=2; area_sqm=80; furnished=$true }
}
$rentDetail2 = Invoke-Api -Name "Get rentable after update" -Method "GET" -Url "$BASE_URL/rentable-items/$rentExclusiveId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Rentable updated code persisted" -Actual $rentDetail2.body.code -Expected $exclusiveCode2

# Availability endpoint (best-effort) - define time window
$from = Get-IsoUtc (Get-Date).AddDays(1)
$to   = Get-IsoUtc (Get-Date).AddDays(2)
Invoke-Api -Name "Get rentable availability (best-effort)" -Method "GET" -Url "$BASE_URL/rentable-items/$rentExclusiveId/availability?from=$from&to=$to" -Headers $authHeaders -ExpectedStatuses @(200,404)

# =====================
# AVAILABILITY / BOOKINGS (OPTIONAL)
# =====================
if ($ENABLE_BOOKING_TESTS) {
  Section "AVAILABILITY ENGINE (HOLDS / BOOKINGS) - OPTIONAL"

  # Create hold
  $start = Get-IsoUtc (Get-Date).AddDays(2).Date.AddHours(10)
  $end   = Get-IsoUtc (Get-Date).AddDays(2).Date.AddHours(12)

  $hold = Invoke-Api -Name "Create hold (exclusive)" -Method "POST" -Url "$BASE_URL/holds" -Headers $authHeaders -ExpectedStatuses @(201,404) -Body @{
    rentable_item_id = $rentExclusiveId
    start_at = $start
    end_at = $end
    reason = "test_hold"
  }

  if ($hold.status -eq 404) {
    Write-Host "Holds endpoint not implemented. Skipping booking tests." -ForegroundColor Yellow
  } else {
    $holdId = $hold.body.id
    Assert-NotNull -Name "holdId returned" -Value $holdId

    # Create booking (may require holdId)
    $bookingBody = @{
      rentable_item_id = $rentExclusiveId
      start_at = $start
      end_at = $end
    }
    if ($holdId) { $bookingBody.hold_id = $holdId }

    $booking = Invoke-Api -Name "Create booking" -Method "POST" -Url "$BASE_URL/bookings" -Headers $authHeaders -ExpectedStatuses @(201) -Body $bookingBody
    $bookingId = $booking.body.id
    Assert-NotNull -Name "bookingId returned" -Value $bookingId

    # Confirm booking
    $confirm = Invoke-Api -Name "Confirm booking" -Method "POST" -Url "$BASE_URL/bookings/$bookingId/confirm" -Headers $authHeaders -ExpectedStatuses @(200,201)
    if ($confirm.body -and $confirm.body.status) {
      Assert-True -Name "Booking status is CONFIRMED-like" -Condition ($confirm.body.status -match "CONFIRM|CONFIRMED|ACTIVE") -Message ("status="+$confirm.body.status)
    }

    # Conflict booking: create another booking overlapping exclusive should fail
    Invoke-Api -Name "Create overlapping booking => conflict" -Method "POST" -Url "$BASE_URL/bookings" -Headers $authHeaders -ExpectedStatuses $EXPECT_CONFLICT_STATUSES -Body @{
      rentable_item_id = $rentExclusiveId
      start_at = $start
      end_at = $end
    }

    # Cancel booking
    Invoke-Api -Name "Cancel booking" -Method "POST" -Url "$BASE_URL/bookings/$bookingId/cancel" -Headers $authHeaders -ExpectedStatuses @(200,201)
  }
}

# =====================
# AGREEMENTS (OPTIONAL)
# =====================
if ($ENABLE_AGREEMENT_TESTS) {
  Section "AGREEMENT ENGINE - OPTIONAL"

  $agr = Invoke-Api -Name "Create agreement draft" -Method "POST" -Url "$BASE_URL/agreements" -Headers $authHeaders -ExpectedStatuses @(201,404) -Body @{
    type = "lease"
    rentable_item_id = $rentExclusiveId
    title = "Lease Agreement Test"
    parties = @(
      @{ role="landlord"; party_id = $me.body.party_id },
      @{ role="tenant";   party_id = $me.body.party_id } # placeholder for test only; replace with real tenant party in real tests
    )
    terms = @{ currency="VND"; deposit_amount=1000000 }
  }

  if ($agr.status -eq 404) {
    Write-Host "Agreements endpoint not implemented. Skipping agreement tests." -ForegroundColor Yellow
  } else {
    $agrId = $agr.body.id
    Assert-NotNull -Name "agreementId returned" -Value $agrId

    # Negative: activate directly from draft should fail in strict state machines (but allow pass if you don't enforce yet)
    Invoke-Api -Name "Activate agreement directly from draft => fail (or allowed if loose)" -Method "POST" -Url "$BASE_URL/agreements/$agrId/activate" -Headers $authHeaders `
      -ExpectedStatuses @($EXPECT_CONFLICT_STATUSES + @(200,201))

    # Review (if exists)
    Invoke-Api -Name "Review agreement" -Method "POST" -Url "$BASE_URL/agreements/$agrId/review" -Headers $authHeaders -ExpectedStatuses @(200,201,404)

    # Sign (stub)
    Invoke-Api -Name "Sign agreement (stub)" -Method "POST" -Url "$BASE_URL/agreements/$agrId/sign" -Headers $authHeaders -ExpectedStatuses @(200,201,404) -Body @{
      signer = "landlord"
      signature = "stub"
    }

    # Activate (should succeed if workflow allows)
    $act = Invoke-Api -Name "Activate agreement" -Method "POST" -Url "$BASE_URL/agreements/$agrId/activate" -Headers $authHeaders -ExpectedStatuses @(200,201)
    if ($act.body -and $act.body.state) {
      Assert-True -Name "Agreement state is ACTIVE-like" -Condition ($act.body.state -match "ACTIVE|EFFECTIVE") -Message ("state="+$act.body.state)
    }

    # Extend (optional)
    Invoke-Api -Name "Extend agreement (optional)" -Method "POST" -Url "$BASE_URL/agreements/$agrId/extend" -Headers $authHeaders -ExpectedStatuses @(200,201,404) -Body @{
      extend_months = 1
    }

    # Terminate
    Invoke-Api -Name "Terminate agreement" -Method "POST" -Url "$BASE_URL/agreements/$agrId/terminate" -Headers $authHeaders -ExpectedStatuses @(200,201)
  }
}

# =====================
# DELETE RULES & CLEANUP
# =====================
Section "DELETE RULES & CLEANUP"

# Deleting a node with children should fail (floor has a child unit)
Invoke-Api -Name "Try delete space node with children => fail" -Method "DELETE" -Url "$BASE_URL/space-nodes/$floorId" -Headers $authHeaders -ExpectedStatuses $EXPECT_CONFLICT_STATUSES

# Delete rentable items (soft delete acceptable)
Invoke-Api -Name "Delete rentable item (capacity)" -Method "DELETE" -Url "$BASE_URL/rentable-items/$rentCapId" -Headers $authHeaders -ExpectedStatuses @(200,204)
Invoke-Api -Name "Delete rentable item (exclusive)" -Method "DELETE" -Url "$BASE_URL/rentable-items/$rentExclusiveId" -Headers $authHeaders -ExpectedStatuses @(200,204)
if ($rentSlotId) {
  Invoke-Api -Name "Delete rentable item (slot) (if created)" -Method "DELETE" -Url "$BASE_URL/rentable-items/$rentSlotId" -Headers $authHeaders -ExpectedStatuses @(200,204)
}

if ($ENABLE_DESTRUCTIVE_CLEANUP) {
  # WARNING: Use only if your system allows deleting nodes without historical constraints.
  Invoke-Api -Name "Delete unit node (optional)" -Method "DELETE" -Url "$BASE_URL/space-nodes/$unitId" -Headers $authHeaders -ExpectedStatuses @(200,204,409)
  Invoke-Api -Name "Delete floor node (optional)" -Method "DELETE" -Url "$BASE_URL/space-nodes/$floorId" -Headers $authHeaders -ExpectedStatuses @(200,204,409)
  Invoke-Api -Name "Delete building node (optional)" -Method "DELETE" -Url "$BASE_URL/space-nodes/$buildingId" -Headers $authHeaders -ExpectedStatuses @(200,204,409)
}

# Archive/Delete asset (prefer archive behavior)
Invoke-Api -Name "Delete/Archive asset" -Method "DELETE" -Url "$BASE_URL/assets/$assetId" -Headers $authHeaders -ExpectedStatuses @(200,204)

# =====================
# SUMMARY
# =====================
Section "TEST SUMMARY"
$total = $script:passCount + $script:failCount
Write-Host "Total Tests (including ASSERT): $total" -ForegroundColor White
Write-Host "Passed: $script:passCount" -ForegroundColor Green
Write-Host "Failed: $script:failCount" -ForegroundColor Red

if ($script:failCount -gt 0) {
  Write-Host "`nFailed items:" -ForegroundColor Red
  foreach ($r in $script:testResults) {
    if ($r.Status -eq "FAIL") {
      $details = if ($r.Details) { " :: " + $r.Details } else { "" }
      Write-Host (" - " + $r.Name + $details) -ForegroundColor Red
    }
  }
  exit 1
} else {
  Write-Host "`nALL TESTS PASSED ✅" -ForegroundColor Green
  exit 0
}
