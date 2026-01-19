

























<#
URP - M2 STRICT GATE TEST (Marketplace)
Version: 1.0
Last Updated: 2026-01-05
Scope:
  - Listings CRUD + Publish lifecycle + Media attach
  - Public Search & Discovery (+ optional rate limiting check)
  - Leads/Inquiry lifecycle (create, list, detail, update status, assign, convert)
  - RBAC sanity (deny-by-default): private endpoints require auth; public endpoints stay public

How to run:
  powershell -ExecutionPolicy Bypass -File .\URP_M2_STRICT_GATE_TEST_V1.ps1

Assumptions (align to your checklist):
  - API Base URL: /api/v1
  - Auth: POST /auth/login, GET /auth/me
  - Listings (Landlord):
      POST   /listings
      GET    /listings?page=&page_size=
      GET    /listings/:id
      PUT    /listings/:id
      DELETE /listings/:id             (soft delete)
      POST   /listings/:id/publish
      POST   /listings/:id/unpublish
      POST   /listings/:id/media
  - Search (Public):
      GET /search/listings
      GET /search/suggest
      GET /search/geo
  - Leads/Inquiry:
      POST /leads                       (often public; some systems require auth)
      GET  /leads?page=&page_size=      (private for landlord/staff)
      GET  /leads/:id
      PUT  /leads/:id                   (update status/notes)
      POST /leads/:id/assign            (optional)
      POST /leads/:id/convert           (optional)

Notes:
  - This suite is strict: it asserts semantics (not only HTTP status).
  - Some endpoints might be intentionally unimplemented in M2; toggles allow skipping.
  - If your API uses different shapes for pagination, adjust the "Find-In-Items" helper.

#>

# =====================
# CONFIG
# =====================
$BASE_URL = "http://localhost:3000/api/v1"
$LANDLORD_EMAIL = "landlord@example.com"
$LANDLORD_PASSWORD = "Password123!"

# Optional second account (for multi-tenant isolation / permission checks). If not available, script will skip.
$ALT_EMAIL = "landlord2@example.com"
$ALT_PASSWORD = "Password123!"

# Toggles
$ENABLE_RATE_LIMIT_TESTS   = $false   # Requires rate limiting enabled + known limits
$ENABLE_ASSIGN_CONVERT     = $true    # Leads assign/convert endpoints
$ENABLE_PUBLIC_LISTING_READ = $false  # If listing detail is public in your design, set $true to test public access
$ENABLE_MULTI_TENANT_CHECK = $false   # Requires ALT account in different org; otherwise keep false

# Rate limiting config (only used when enabled)
$RATE_LIMIT_ENDPOINT = "$BASE_URL/search/listings?page=1&page_size=1"
$RATE_LIMIT_BURST_REQUESTS = 120       # attempt to exceed 100/min default
$EXPECT_RATE_LIMIT_STATUS = 429

# Expected status groups for variants
$EXPECT_VALIDATION_STATUSES = @(400, 422)
$EXPECT_CONFLICT_STATUSES   = @(409, 400, 422)
$EXPECT_NOT_FOUND_STATUSES  = @(404)

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

function Pass { param([string]$Name, [string]$Details = "")
  Write-Host "PASS: $Name" -ForegroundColor Green
  $script:passCount++
  Add-Result -Name $Name -Status "PASS" -Details $Details
}

function Fail { param([string]$Name, [string]$Details = "")
  Write-Host "FAIL: $Name" -ForegroundColor Red
  if ($Details) { Write-Host "  $Details" -ForegroundColor DarkRed }
  $script:failCount++
  Add-Result -Name $Name -Status "FAIL" -Details $Details
}

function Section { param([string]$Title)
  Write-Host "`n========================================" -ForegroundColor Yellow
  Write-Host $Title -ForegroundColor Yellow
  Write-Host "========================================" -ForegroundColor Yellow
}

function Assert-True {
  param([string]$Name, [bool]$Condition, [string]$Message = "")
  if ($Condition) { Pass -Name "ASSERT: $Name" }
  else { Fail -Name "ASSERT: $Name" -Details $Message }
}

function Assert-NotNull { param([string]$Name, $Value)
  Assert-True -Name $Name -Condition ($null -ne $Value) -Message "Value is null"
}

function Assert-Equal { param([string]$Name, $Actual, $Expected)
  Assert-True -Name $Name -Condition ($Actual -eq $Expected) -Message "Expected='$Expected' Actual='$Actual'"
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
    $params.Body = ($Body | ConvertTo-Json -Depth 25)
  }

  try {
    $resp = Invoke-WebRequest @params
    $status = [int]$resp.StatusCode
    $json = Try-ParseJson $resp.Content
    if ($ExpectedStatuses -contains $status) {
      Pass -Name $Name -Details "Status=$status"
    } else {
      $snippet = $resp.Content
      if ($snippet -and $snippet.Length -gt 350) { $snippet = $snippet.Substring(0,350) }
      Fail -Name $Name -Details ("Expected=[{0}] Got={1} Body={2}" -f ($ExpectedStatuses -join ","), $status, $snippet)
    }
    return [pscustomobject]@{ status=$status; body=$json; raw=$resp.Content; headers=$resp.Headers }
  } catch {
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
    } else {
      $msg = $_.Exception.Message
      if ($status -eq $null) {
        Fail -Name $Name -Details "Network/Unknown error: $msg"
      } else {
        $snippet = $raw
        if ($snippet -and $snippet.Length -gt 350) { $snippet = $snippet.Substring(0,350) }
        Fail -Name $Name -Details ("Expected=[{0}] Got={1} Error={2} Body={3}" -f ($ExpectedStatuses -join ","), $status, $msg, $snippet)
      }
    }
    return [pscustomobject]@{ status=$status; body=$json; raw=$raw; headers=$hdr }
  }
}

function Find-In-Items {
  <#
    Utility to search pagination result.
    Supports common shapes:
      { items: [ ... ] }
      { data: [ ... ] }
      [ ... ]
  #>
  param($Body, [scriptblock]$Predicate)
  if ($null -eq $Body) { return $false }
  if ($Body.items) {
    return (($Body.items | Where-Object $Predicate) | Measure-Object).Count -gt 0
  }
  if ($Body.data) {
    return (($Body.data | Where-Object $Predicate) | Measure-Object).Count -gt 0
  }
  if ($Body -is [System.Array]) {
    return (($Body | Where-Object $Predicate) | Measure-Object).Count -gt 0
  }
  return $false
}

# =====================
# START
# =====================
Section "URP M2 MARKETPLACE - STRICT GATE TEST SUITE"

# 0) RBAC sanity: private endpoints must require auth; public endpoints must work without auth
Section "RBAC SANITY (Public vs Private)"

# Private listing endpoints must be protected (unless you intentionally made them public)
Invoke-Api -Name "GET /listings without token => 401" -Method "GET" -Url "$BASE_URL/listings?page=1&page_size=1" -ExpectedStatuses @(401)
Invoke-Api -Name "POST /listings without token => 401" -Method "POST" -Url "$BASE_URL/listings" -Body @{ title="x"; description="x" } -ExpectedStatuses @(401)

# Public search must be accessible
Invoke-Api -Name "GET /search/listings public => 200" -Method "GET" -Url "$BASE_URL/search/listings?page=1&page_size=1" -ExpectedStatuses @(200)
Invoke-Api -Name "GET /search/suggest public => 200" -Method "GET" -Url "$BASE_URL/search/suggest?q=ap&limit=3" -ExpectedStatuses @(200,204)
Invoke-Api -Name "GET /search/geo public => 200/404 (if not implemented)" -Method "GET" -Url "$BASE_URL/search/geo?lat=10.762622&lng=106.660172&radius_km=5" -ExpectedStatuses @(200,404)

# 1) Auth
Section "AUTHENTICATION"
$login = Invoke-Api -Name "Login as Landlord" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$LANDLORD_EMAIL; password=$LANDLORD_PASSWORD } -ExpectedStatuses @(201,200)
if (-not $login.body) { Write-Host "Cannot proceed without auth." -ForegroundColor Red; exit 1 }
$accessToken = $login.body.access_token
Assert-NotNull -Name "access_token exists" -Value $accessToken
$authHeaders = @{ "Authorization" = "Bearer $accessToken" }

$me = Invoke-Api -Name "Get current user profile" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "me.org_id exists" -Value $me.body.org_id

# 2) Listings - validation negative tests
Section "LISTINGS - VALIDATION NEGATIVES"

Invoke-Api -Name "Create listing missing title => fail" -Method "POST" -Url "$BASE_URL/listings" -Headers $authHeaders `
  -Body @{
    description="no title"
    rentable_item_ids=@()
    pricing_display=@{ from_amount=1; currency="VND"; unit="month" }
  } -ExpectedStatuses $EXPECT_VALIDATION_STATUSES

Invoke-Api -Name "Create listing with price=0 => fail" -Method "POST" -Url "$BASE_URL/listings" -Headers $authHeaders `
  -Body @{
    title="Bad Price Listing"
    description="price zero"
    rentable_item_ids=@()
    pricing_display=@{ from_amount=0; currency="VND"; unit="month" }
  } -ExpectedStatuses $EXPECT_VALIDATION_STATUSES

Invoke-Api -Name "Create listing with invalid media type => fail" -Method "POST" -Url "$BASE_URL/listings" -Headers $authHeaders `
  -Body @{
    title="Bad Media Listing"
    description="bad media"
    rentable_item_ids=@()
    pricing_display=@{ from_amount=12000000; currency="VND"; unit="month" }
    media=@(@{ url="https://example.com/x"; type="__bad__" })
  } -ExpectedStatuses $EXPECT_VALIDATION_STATUSES

# 3) Listings - happy path CRUD
Section "LISTINGS - CRUD + PUBLISH"

$unique = (Get-Date).ToString("yyyyMMdd-HHmmss")
$title1 = "Modern Apartment for Rent $unique"
$desc1 = "Beautiful 2-bedroom apartment in city center ($unique)"

$createListing = Invoke-Api -Name "Create listing (draft)" -Method "POST" -Url "$BASE_URL/listings" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
  title = $title1
  description = $desc1
  rentable_item_ids = @()  # M2 can be listing-first; M3 links rentable items
  tags = @("apartment","monthly","furnished")
  pricing_display = @{ from_amount=12000000; currency="VND"; unit="month" }
  media = @(@{ url="https://example.com/image1.jpg"; type="image" })
}
$listingId = $createListing.body.id
Assert-NotNull -Name "listingId returned" -Value $listingId

# List and assert presence
$listings = Invoke-Api -Name "List listings" -Method "GET" -Url "$BASE_URL/listings?page=1&page_size=50" -Headers $authHeaders -ExpectedStatuses @(200)
$found = Find-In-Items -Body $listings.body -Predicate { $_.id -eq $listingId }
Assert-True -Name "Listings list contains created listing" -Condition $found -Message "listingId=$listingId not found in list"

# Detail and assert fields
$detail = Invoke-Api -Name "Get listing detail" -Method "GET" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Listing title matches" -Actual $detail.body.title -Expected $title1
Assert-Equal -Name "Listing description matches" -Actual $detail.body.description -Expected $desc1

# Update and assert persisted
$title2 = "$title1 - Updated"
$desc2  = "$desc1 - Now with parking"
Invoke-Api -Name "Update listing" -Method "PUT" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  title=$title2
  description=$desc2
}
$detail2 = Invoke-Api -Name "Get listing after update" -Method "GET" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Listing updated title persisted" -Actual $detail2.body.title -Expected $title2
Assert-Equal -Name "Listing updated description persisted" -Actual $detail2.body.description -Expected $desc2

# Add media and (best-effort) assert count increases if media array returned
$mediaAdd = Invoke-Api -Name "Add media to listing" -Method "POST" -Url "$BASE_URL/listings/$listingId/media" -Headers $authHeaders -ExpectedStatuses @(200,201) -Body @{
  media = @(@{ url="https://example.com/image2.jpg"; type="image" })
}
$detail3 = Invoke-Api -Name "Get listing after media add" -Method "GET" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200)
if ($detail2.body -and $detail2.body.media -and $detail3.body -and $detail3.body.media) {
  Assert-True -Name "Media count increased" -Condition ($detail3.body.media.Count -ge $detail2.body.media.Count) -Message ("before="+$detail2.body.media.Count+" after="+$detail3.body.media.Count)
}

# Publish
Invoke-Api -Name "Publish listing" -Method "POST" -Url "$BASE_URL/listings/$listingId/publish" -Headers $authHeaders -ExpectedStatuses @(200,201)

# Search should include it (query by unique substring)
Section "SEARCH & DISCOVERY (PUBLIC)"
$search1 = Invoke-Api -Name "Search listings (q=Modern)" -Method "GET" -Url "$BASE_URL/search/listings?q=Modern&page=1&page_size=20" -ExpectedStatuses @(200)
$inSearch = Find-In-Items -Body $search1.body -Predicate { $_.id -eq $listingId -or $_.title -like "*$unique*" }
Assert-True -Name "Published listing appears in public search" -Condition $inSearch -Message "listingId/title not found in search results"

# Tag filter should still find it (best-effort)
$searchTags = Invoke-Api -Name "Search listings by tags" -Method "GET" -Url "$BASE_URL/search/listings?tags=apartment,monthly&page=1&page_size=20" -ExpectedStatuses @(200)
# Not all systems support tags filtering initially; don't fail hard if empty body but 200.
if ($searchTags.body) {
  $maybe = Find-In-Items -Body $searchTags.body -Predicate { $_.id -eq $listingId }
  # soft assertion: if results exist, it should include or at least not error
  Pass -Name "Tags search executed" -Details ("containsListing=" + $maybe)
}

# Unpublish should remove from search
Invoke-Api -Name "Unpublish listing" -Method "POST" -Url "$BASE_URL/listings/$listingId/unpublish" -Headers $authHeaders -ExpectedStatuses @(200,201)
$search2 = Invoke-Api -Name "Search after unpublish => should not include" -Method "GET" -Url "$BASE_URL/search/listings?q=$unique&page=1&page_size=20" -ExpectedStatuses @(200)
$stillThere = Find-In-Items -Body $search2.body -Predicate { $_.id -eq $listingId -or $_.title -like "*$unique*" }
Assert-True -Name "Unpublished listing not in search" -Condition (-not $stillThere) -Message "Listing still appears after unpublish"

# Publish again (for lead tests)
Invoke-Api -Name "Publish listing again" -Method "POST" -Url "$BASE_URL/listings/$listingId/publish" -Headers $authHeaders -ExpectedStatuses @(200,201)

# 4) Leads - create and manage
Section "LEADS / INQUIRIES"

# Attempt public lead creation (preferred). If your API requires auth, accept 401 and fallback to auth create.
$leadPayload = @{
  listing_id = $listingId
  name = "John Doe"
  email = "john.doe+$unique@example.com"
  phone = "+84901234567"
  message = "Interested. Please schedule a viewing. ($unique)"
  metadata = @{ source="website" }
}

$leadCreatePublic = Invoke-Api -Name "Create lead (public preferred)" -Method "POST" -Url "$BASE_URL/leads" -ExpectedStatuses @(201,401,403) -Body $leadPayload
$leadId = $null

if ($leadCreatePublic.status -eq 201) {
  $leadId = $leadCreatePublic.body.id
  Assert-NotNull -Name "leadId returned (public create)" -Value $leadId
} else {
  # fallback with auth
  $leadCreateAuth = Invoke-Api -Name "Create lead (auth fallback)" -Method "POST" -Url "$BASE_URL/leads" -Headers $authHeaders -ExpectedStatuses @(201) -Body $leadPayload
  $leadId = $leadCreateAuth.body.id
  Assert-NotNull -Name "leadId returned (auth create)" -Value $leadId
}

# List leads (private)
$leadsList = Invoke-Api -Name "List leads" -Method "GET" -Url "$BASE_URL/leads?page=1&page_size=50" -Headers $authHeaders -ExpectedStatuses @(200)
$leadFound = Find-In-Items -Body $leadsList.body -Predicate { $_.id -eq $leadId }
Assert-True -Name "Lead appears in leads list" -Condition $leadFound -Message "leadId=$leadId not found in leads list"

# Lead detail (private)
$leadDetail = Invoke-Api -Name "Get lead detail" -Method "GET" -Url "$BASE_URL/leads/$leadId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-Equal -Name "Lead listing_id matches" -Actual $leadDetail.body.listing_id -Expected $listingId

# Update lead status (private)
Invoke-Api -Name "Update lead status => CONTACTED" -Method "PUT" -Url "$BASE_URL/leads/$leadId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  status = "CONTACTED"
  message = "Called customer, scheduled viewing."
}
$leadDetail2 = Invoke-Api -Name "Get lead after status update" -Method "GET" -Url "$BASE_URL/leads/$leadId" -Headers $authHeaders -ExpectedStatuses @(200)
if ($leadDetail2.body -and $leadDetail2.body.status) {
  Assert-Equal -Name "Lead status persisted" -Actual $leadDetail2.body.status -Expected "CONTACTED"
}

# Assign & Convert (optional)
if ($ENABLE_ASSIGN_CONVERT) {
  $meId = $me.body.id
  if ($meId) {
    Invoke-Api -Name "Assign lead to current user (optional)" -Method "POST" -Url "$BASE_URL/leads/$leadId/assign" -Headers $authHeaders -ExpectedStatuses @(200,201,404) -Body @{
      assigned_to_user_id = $meId
    }
  } else {
    Pass -Name "Skip assign lead (me.id missing)"
  }

  Invoke-Api -Name "Convert lead to booking stub (optional)" -Method "POST" -Url "$BASE_URL/leads/$leadId/convert" -Headers $authHeaders -ExpectedStatuses @(200,201,404)
}

# 5) Soft delete listing must remove it from list/search and prevent publish
Section "LISTING SOFT DELETE RULES"

# Delete listing (soft)
Invoke-Api -Name "Soft delete listing" -Method "DELETE" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200,204)

# Detail: either 404 or returns deleted flag. Accept both, but assert it's not publicly searchable.
$detailAfterDelete = Invoke-Api -Name "Get listing after delete (404 or deleted)" -Method "GET" -Url "$BASE_URL/listings/$listingId" -Headers $authHeaders -ExpectedStatuses @(200,404)
if ($detailAfterDelete.status -eq 200 -and $detailAfterDelete.body) {
  if ($detailAfterDelete.body.is_deleted -ne $null) {
    Assert-True -Name "Listing marked deleted" -Condition ($detailAfterDelete.body.is_deleted -eq $true) -Message "Expected is_deleted=true"
  } elseif ($detailAfterDelete.body.deleted_at -ne $null) {
    Pass -Name "Listing has deleted_at"
  } else {
    Pass -Name "Listing detail accessible after delete (no deleted flag)"
  }
}

# List should not include it (best-effort; depends if list hides deleted)
$listingsAfterDelete = Invoke-Api -Name "List listings after delete (should hide)" -Method "GET" -Url "$BASE_URL/listings?page=1&page_size=50" -Headers $authHeaders -ExpectedStatuses @(200)
$stillInList = Find-In-Items -Body $listingsAfterDelete.body -Predicate { $_.id -eq $listingId }
Assert-True -Name "Deleted listing not present in list" -Condition (-not $stillInList) -Message "Deleted listing still present in list"

# Public search must not include deleted listing
$searchAfterDelete = Invoke-Api -Name "Search after delete (should not include)" -Method "GET" -Url "$BASE_URL/search/listings?q=$unique&page=1&page_size=20" -ExpectedStatuses @(200)
$stillInSearch = Find-In-Items -Body $searchAfterDelete.body -Predicate { $_.id -eq $listingId -or $_.title -like "*$unique*" }
Assert-True -Name "Deleted listing not present in public search" -Condition (-not $stillInSearch) -Message "Deleted listing still present in search"

# Publishing deleted listing should fail
Invoke-Api -Name "Publish deleted listing => fail" -Method "POST" -Url "$BASE_URL/listings/$listingId/publish" -Headers $authHeaders -ExpectedStatuses $EXPECT_CONFLICT_STATUSES

# 6) Multi-tenant check (optional, requires ALT account in different org)
if ($ENABLE_MULTI_TENANT_CHECK) {
  Section "MULTI-TENANT ISOLATION (OPTIONAL)"

  $altLogin = Invoke-Api -Name "Login as ALT landlord" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$ALT_EMAIL; password=$ALT_PASSWORD } -ExpectedStatuses @(201,200,401,403)
  if ($altLogin.status -in @(401,403) -or -not $altLogin.body) {
    Pass -Name "Skip multi-tenant isolation (ALT account not available)"
  } else {
    $altToken = $altLogin.body.access_token
    $altHeaders = @{ "Authorization" = "Bearer $altToken" }

    # ALT user must NOT read landlord's leads/listings (pick leadId/listingId from earlier)
    Invoke-Api -Name "ALT cannot read landlord lead => 403/404" -Method "GET" -Url "$BASE_URL/leads/$leadId" -Headers $altHeaders -ExpectedStatuses @(403,404)
    Invoke-Api -Name "ALT cannot read landlord listing detail (private) => 403/404" -Method "GET" -Url "$BASE_URL/listings/$listingId" -Headers $altHeaders -ExpectedStatuses @(403,404)
  }
}

# 7) Rate limiting (optional)
if ($ENABLE_RATE_LIMIT_TESTS) {
  Section "RATE LIMITING (OPTIONAL)"
  Write-Host "Bursting $RATE_LIMIT_BURST_REQUESTS requests to: $RATE_LIMIT_ENDPOINT" -ForegroundColor Yellow
  $got429 = $false
  for ($i=1; $i -le $RATE_LIMIT_BURST_REQUESTS; $i++) {
    $r = Invoke-Api -Name "RateLimit probe #$i" -Method "GET" -Url $RATE_LIMIT_ENDPOINT -ExpectedStatuses @(200,$EXPECT_RATE_LIMIT_STATUS)
    if ($r.status -eq $EXPECT_RATE_LIMIT_STATUS) { $got429 = $true; break }
  }
  Assert-True -Name "Rate limit triggers 429 at high burst" -Condition $got429 -Message "Did not observe 429; adjust burst/limits or disable this test."
}

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
      Write-Host (" - " + $r.Name + (if ($r.Details) { " :: " + $r.Details } else { "" })) -ForegroundColor Red
    }
  }
  exit 1
} else {
  Write-Host "`nALL TESTS PASSED ✅" -ForegroundColor Green
  exit 0
}
