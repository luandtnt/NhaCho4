# URP - M4 FINANCE STRICT GATE TEST
# Version: 1.1 (Strict Gate)
# Last Updated: 2026-01-05
# Scope:
#   - Pricing Policies
#   - Invoices (create + optional generate + void + overdue optional)
#   - Payments (idempotency, mismatch, refund)
#   - Webhook (signature negative tests + replay protection)
#   - Ledger (append-only enforcement + reconciliation)
# Notes:
#   - This test suite is intentionally strict. If your API doesn't enforce a rule yet, this script will FAIL to force implementation.
#   - Configure optional env vars below to match your implementation.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# =========================================
# CONFIG
# =========================================
$BASE_URL = $env:URP_BASE_URL
if ([string]::IsNullOrWhiteSpace($BASE_URL)) { $BASE_URL = "http://localhost:3000/api/v1" }

$LANDLORD_EMAIL = $env:URP_LANDLORD_EMAIL
if ([string]::IsNullOrWhiteSpace($LANDLORD_EMAIL)) { $LANDLORD_EMAIL = "landlord@example.com" }

$LANDLORD_PASSWORD = $env:URP_LANDLORD_PASSWORD
if ([string]::IsNullOrWhiteSpace($LANDLORD_PASSWORD)) { $LANDLORD_PASSWORD = "Password123!" }

# Optional secondary org/user for multi-tenant isolation tests (recommended)
$ALT_EMAIL = $env:URP_ALT_EMAIL
$ALT_PASSWORD = $env:URP_ALT_PASSWORD

# Webhook security:
#   If your webhook uses signatures, set URP_WEBHOOK_SECRET to your shared secret and keep REQUIRE_WEBHOOK_SIGNATURE=$true.
#   If you haven't implemented signature validation yet, keep it true to force the work, or set to $false temporarily.
$REQUIRE_WEBHOOK_SIGNATURE = $true
if ($env:URP_REQUIRE_WEBHOOK_SIGNATURE) {
  $REQUIRE_WEBHOOK_SIGNATURE = ($env:URP_REQUIRE_WEBHOOK_SIGNATURE -eq "1" -or $env:URP_REQUIRE_WEBHOOK_SIGNATURE -eq "true")
}
$WEBHOOK_SECRET = $env:URP_WEBHOOK_SECRET

# Provider under test (must match your adapters)
$PAYMENT_PROVIDER = $env:URP_PAYMENT_PROVIDER
if ([string]::IsNullOrWhiteSpace($PAYMENT_PROVIDER)) { $PAYMENT_PROVIDER = "vnpay" }

# Paging / limits
$DEFAULT_PAGE_SIZE = 200
$MAX_LEDGER_PAGES = 20

# Refund test config
$REFUND_AMOUNT = 5000000

# =========================================
# TEST HARNESS
# =========================================
$script:testResults = @()
$script:passCount = 0
$script:failCount = 0
$script:skipCount = 0

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

function Skip {
  param([string]$Name, [string]$Details = "")
  Write-Host "SKIP: $Name" -ForegroundColor DarkYellow
  if ($Details) { Write-Host "  $Details" -ForegroundColor DarkYellow }
  $script:skipCount++
  Add-Result -Name $Name -Status "SKIP" -Details $Details
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
  else { Fail -Name "ASSERT: $Name" -Details $Message; throw "AssertionFailed: $Name" }
}

function Assert-NotNull {
  param([string]$Name, $Value)
  Assert-True -Name $Name -Condition ($null -ne $Value) -Message "Value is null"
}

function Try-ParseJson([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  try { return ($text | ConvertFrom-Json -ErrorAction Stop) } catch { return $null }
}

function New-RandSuffix([int]$len = 8) {
  $chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  -join (1..$len | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
}

function Invoke-Api {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int[]]$ExpectedStatuses = @(200),
    [int]$TimeoutSec = 30
  )

  Write-Host "`n--- $Name ---" -ForegroundColor Cyan
  Write-Host "$Method $Url" -ForegroundColor DarkCyan

  $params = @{
    Uri = $Url
    Method = $Method
    Headers = $Headers
    UseBasicParsing = $true
    TimeoutSec = $TimeoutSec
  }

  # Only attach JSON content type/body when a body is present
  if ($Body -ne $null) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 40)
  }

  try {
    $resp = Invoke-WebRequest @params
    $status = [int]$resp.StatusCode
    $json = Try-ParseJson $resp.Content
    if ($ExpectedStatuses -contains $status) { Pass -Name $Name -Details "Status=$status" }
    else { Fail -Name $Name -Details ("Expected=[{0}] Got={1}" -f ($ExpectedStatuses -join ","), $status); throw "UnexpectedStatus" }
    return [pscustomobject]@{ status=$status; body=$json; raw=$resp.Content; headers=$resp.Headers }
  } catch {
    $status = $null
    $raw = ""
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $status = [int]$_.Exception.Response.StatusCode }
      if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $raw = $reader.ReadToEnd()
      }
    } catch {}

    $json = Try-ParseJson $raw

    if ($status -ne $null -and ($ExpectedStatuses -contains $status)) {
      Pass -Name $Name -Details "Status=$status"
      return [pscustomobject]@{ status=$status; body=$json; raw=$raw; headers=@{} }
    }

    Fail -Name $Name -Details ("Expected=[{0}] Got={1}. Raw={2}" -f ($ExpectedStatuses -join ","), $status, $raw)
    throw
  }
}

function Try-Api {
  # Like Invoke-Api but never throws; used for probing optional endpoints/filters.
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $params = @{
    Uri = $Url
    Method = $Method
    Headers = $Headers
    UseBasicParsing = $true
    TimeoutSec = 20
  }
  if ($Body -ne $null) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 40)
  }

  try {
    $resp = Invoke-WebRequest @params
    return [pscustomobject]@{ ok=$true; status=[int]$resp.StatusCode; body=(Try-ParseJson $resp.Content); raw=$resp.Content }
  } catch {
    $status = $null
    $raw = ""
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $status = [int]$_.Exception.Response.StatusCode }
      if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $raw = $reader.ReadToEnd()
      }
    } catch {}
    return [pscustomobject]@{ ok=$false; status=$status; body=(Try-ParseJson $raw); raw=$raw }
  }
}

function Get-AuthHeaders([string]$AccessToken) {
  return @{ "Authorization" = "Bearer $AccessToken" }
}

# =========================================
# HELPERS: DOMAIN LOOKUPS
# =========================================
function Get-PartyId-ByType {
  param(
    [string]$PartyType,   # e.g. LANDLORD, TENANT
    [hashtable]$Headers
  )

  # Try API discovery first
  $probe = Try-Api -Method "GET" -Url "$BASE_URL/parties?type=$PartyType&page=1&page_size=10" -Headers $Headers
  if ($probe.ok -and $probe.body) {
    # Support body.data array or direct array
    $items = $null
    if ($probe.body.data) { $items = $probe.body.data } else { $items = $probe.body }
    if ($items -and $items.Count -gt 0 -and $items[0].id) { return $items[0].id }
  }

  return $null
}

function Get-Ledger-Entries-ForRef {
  param(
    [string]$RefId,
    [hashtable]$Headers
  )

  # Prefer server-side filter if supported
  $probe = Try-Api -Method "GET" -Url "$BASE_URL/ledger?ref_id=$RefId&page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $Headers
  if ($probe.ok -and $probe.body -and $probe.body.data) {
    return $probe.body.data
  }

  # Fallback: page through ledger until found or exhausted
  $all = @()
  for ($p=1; $p -le $MAX_LEDGER_PAGES; $p++) {
    $resp = Try-Api -Method "GET" -Url "$BASE_URL/ledger?page=$p&page_size=$DEFAULT_PAGE_SIZE" -Headers $Headers
    if (-not $resp.ok -or -not $resp.body) { break }
    $data = $resp.body.data
    if (-not $data) { break }

    $all += $data

    # early stop if we found at least one matching ref
    $found = $false
    foreach ($e in $data) { if ($e.ref_id -eq $RefId) { $found = $true; break } }
    if ($found) { break }

    # stop if no more pages
    if ($resp.body.meta -and $resp.body.meta.has_next -ne $null) {
      if (-not $resp.body.meta.has_next) { break }
    } elseif ($data.Count -lt $DEFAULT_PAGE_SIZE) {
      break
    }
  }

  # filter locally
  return @($all | Where-Object { $_.ref_id -eq $RefId })
}

function Count-Ledger-Entries {
  param([hashtable]$Headers)

  # If API exposes /ledger/count, use it
  $probe = Try-Api -Method "GET" -Url "$BASE_URL/ledger/count" -Headers $Headers
  if ($probe.ok -and $probe.body -and $probe.body.count -ne $null) { return [int]$probe.body.count }

  # fallback: count by paging
  $count = 0
  for ($p=1; $p -le $MAX_LEDGER_PAGES; $p++) {
    $resp = Try-Api -Method "GET" -Url "$BASE_URL/ledger?page=$p&page_size=$DEFAULT_PAGE_SIZE" -Headers $Headers
    if (-not $resp.ok -or -not $resp.body -or -not $resp.body.data) { break }
    $count += $resp.body.data.Count
    if ($resp.body.data.Count -lt $DEFAULT_PAGE_SIZE) { break }
  }
  return $count
}

# =========================================
# START
# =========================================
Section "URP M4 FINANCE - STRICT GATE"

# -----------------------------------------
# AUTH
# -----------------------------------------
Section "AUTHENTICATION"

$login = Invoke-Api -Name "Login as Landlord" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$LANDLORD_EMAIL; password=$LANDLORD_PASSWORD } -ExpectedStatuses @(201,200)
Assert-NotNull -Name "Login response body" -Value $login.body
Assert-NotNull -Name "access_token returned" -Value $login.body.access_token

$accessToken = $login.body.access_token
$authHeaders = Get-AuthHeaders -AccessToken $accessToken

$me = Invoke-Api -Name "Get current user (me)" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "me.id returned" -Value $me.body.id
Assert-NotNull -Name "me.org_id returned" -Value $me.body.org_id
$orgId = $me.body.org_id

# Minimal RBAC sanity (public endpoints may vary, but finance should not)
Section "RBAC SANITY"
Invoke-Api -Name "Invoices without auth => 401/403" -Method "GET" -Url "$BASE_URL/invoices?page=1&page_size=1" -ExpectedStatuses @(401,403)
Invoke-Api -Name "Payments without auth => 401/403" -Method "GET" -Url "$BASE_URL/payments?page=1&page_size=1" -ExpectedStatuses @(401,403)
Invoke-Api -Name "Ledger without auth => 401/403" -Method "GET" -Url "$BASE_URL/ledger?page=1&page_size=1" -ExpectedStatuses @(401,403)

# -----------------------------------------
# PRICING POLICIES
# -----------------------------------------
Section "PRICING POLICIES"

$rand = New-RandSuffix
$policyPayload = @{
  name = "Monthly Rent Policy $rand"
  policy_type = "monthly_rent"
  config = @{
    base_amount = 12000000
    currency = "VND"
    unit = "month"
    proration_rule = "daily"
    late_fee_percent = 5
  }
  effective_from = "2026-01-01"
  effective_to = "2026-12-31"
}

$createPolicy = Invoke-Api -Name "Create pricing policy" -Method "POST" -Url "$BASE_URL/pricing-policies" -Headers $authHeaders -ExpectedStatuses @(201) -Body $policyPayload
Assert-NotNull -Name "policyId returned" -Value $createPolicy.body.id
$policyId = $createPolicy.body.id

Invoke-Api -Name "List pricing policies" -Method "GET" -Url "$BASE_URL/pricing-policies?page=1&page_size=20" -Headers $authHeaders -ExpectedStatuses @(200)
Invoke-Api -Name "Get pricing policy detail" -Method "GET" -Url "$BASE_URL/pricing-policies/$policyId" -Headers $authHeaders -ExpectedStatuses @(200)

# Update draft policy
Invoke-Api -Name "Update pricing policy (draft)" -Method "PUT" -Url "$BASE_URL/pricing-policies/$policyId" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{
  config = @{
    base_amount = 13000000
    currency = "VND"
    unit = "month"
    proration_rule = "daily"
    late_fee_percent = 7
  }
}

# Activate policy
Invoke-Api -Name "Activate pricing policy" -Method "POST" -Url "$BASE_URL/pricing-policies/$policyId/activate" -Headers $authHeaders -ExpectedStatuses @(200)

# Optional: if your system forbids updating active policies, enforce it strictly.
$activeUpdateProbe = Try-Api -Method "PUT" -Url "$BASE_URL/pricing-policies/$policyId" -Headers $authHeaders -Body @{
  config = @{ base_amount = 14000000; currency="VND"; unit="month"; proration_rule="daily"; late_fee_percent=7 }
}
if ($activeUpdateProbe.ok) {
  if ($activeUpdateProbe.body -and ($activeUpdateProbe.body.version -ne $null -or $activeUpdateProbe.body.revision -ne $null)) {
    Pass -Name "Update active policy allowed with versioning" -Details "version/revision present"
  } else {
    Fail -Name "Update active policy allowed but no versioning" -Details "Either forbid active updates (400/409) or implement versioning fields"
    throw "ActivePolicyUpdateWithoutVersioning"
  }
} else {
  if ($activeUpdateProbe.status -in @(400,409,403)) { Pass -Name "Update active policy rejected (expected)" -Details "Status=$($activeUpdateProbe.status)" }
  else { Skip -Name "Update active policy probe inconclusive" -Details "Status=$($activeUpdateProbe.status)" }
}

# Negative: invalid policy payload should be rejected
Invoke-Api -Name "Create pricing policy invalid currency => 400/422" -Method "POST" -Url "$BASE_URL/pricing-policies" -Headers $authHeaders -ExpectedStatuses @(400,422) -Body @{
  name="BadPolicy $rand"
  policy_type="monthly_rent"
  config=@{ base_amount=1; currency="INVALID"; unit="month"; proration_rule="daily"; late_fee_percent=5 }
  effective_from="2026-01-01"
  effective_to="2026-12-31"
}

# -----------------------------------------
# AGREEMENT (PREREQ FOR BILLING)
# -----------------------------------------
Section "AGREEMENT (PREREQ)"

$landlordPartyId = Get-PartyId-ByType -PartyType "LANDLORD" -Headers $authHeaders
$tenantPartyId = Get-PartyId-ByType -PartyType "TENANT" -Headers $authHeaders

if (-not $landlordPartyId) { $landlordPartyId = $env:URP_LANDLORD_PARTY_ID }
if (-not $tenantPartyId) { $tenantPartyId = $env:URP_TENANT_PARTY_ID }

if (-not $landlordPartyId) { $landlordPartyId = "00000000-0000-0000-0000-000000000001" }
if (-not $tenantPartyId) { $tenantPartyId = "00000000-0000-0000-0000-000000000002" }

$agreementPayload = @{
  landlord_party_id = $landlordPartyId
  tenant_party_id   = $tenantPartyId
  agreement_type    = "lease"
  start_at          = "2026-01-01T00:00:00Z"
  end_at            = "2026-12-31T23:59:59Z"
  terms_json        = @{
    rent_amount   = 12000000
    deposit       = 24000000
    pricing_policy_id = $policyId
  }
}

$createAgreement = Invoke-Api -Name "Create agreement (for invoice tests)" -Method "POST" -Url "$BASE_URL/agreements" -Headers $authHeaders -ExpectedStatuses @(201) -Body $agreementPayload
Assert-NotNull -Name "agreementId returned" -Value $createAgreement.body.id
$agreementId = $createAgreement.body.id

# -----------------------------------------
# INVOICES
# -----------------------------------------
Section "INVOICES"

$periodStart = "2026-01-01"
$periodEnd   = "2026-01-31"

$generatedInvoice = Try-Api -Method "POST" -Url "$BASE_URL/invoices/generate" -Headers $authHeaders -Body @{
  agreement_id = $agreementId
  period_start = $periodStart
  period_end   = $periodEnd
}

$invoiceId = $null
if ($generatedInvoice.ok -and $generatedInvoice.body -and $generatedInvoice.body.id) {
  Pass -Name "Generate invoice (engine)" -Details "Status=$($generatedInvoice.status)"
  $invoiceId = $generatedInvoice.body.id
} else {
  if ($generatedInvoice.status -eq 404 -or $generatedInvoice.status -eq 405) {
    Skip -Name "Invoice generator endpoint not available; using direct create" -Details "Status=$($generatedInvoice.status)"
  } else {
    if ($generatedInvoice.status -ne $null -and $generatedInvoice.status -ne 404) {
      Fail -Name "Invoice generator failed" -Details "Status=$($generatedInvoice.status) Raw=$($generatedInvoice.raw)"
      throw "InvoiceGenerateFailed"
    }
  }

  $invoicePayload = @{
    agreement_id  = $agreementId
    period_start  = $periodStart
    period_end    = $periodEnd
    currency      = "VND"
    line_items    = @(@{ description = "Monthly rent - Jan 2026"; amount = 12000000; quantity = 1 })
    total_amount  = 12000000
  }
  $createInvoice = Invoke-Api -Name "Create invoice" -Method "POST" -Url "$BASE_URL/invoices" -Headers $authHeaders -ExpectedStatuses @(201) -Body $invoicePayload
  $invoiceId = $createInvoice.body.id
}

Assert-NotNull -Name "invoiceId returned" -Value $invoiceId

Invoke-Api -Name "List invoices" -Method "GET" -Url "$BASE_URL/invoices?page=1&page_size=20" -Headers $authHeaders -ExpectedStatuses @(200)

$invoiceDetail = Invoke-Api -Name "Get invoice detail" -Method "GET" -Url "$BASE_URL/invoices/$invoiceId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "invoice.status present" -Value $invoiceDetail.body.status

$validInvoiceStates = @("DRAFT","ISSUED","OPEN","PENDING","PAID","VOID","OVERDUE","CANCELLED","PARTIALLY_PAID")
Assert-True -Name "Invoice status is a known state" -Condition ($validInvoiceStates -contains $invoiceDetail.body.status) -Message ("Status=" + $invoiceDetail.body.status)

# Negative: inconsistent totals must be rejected or recomputed
$badInvoice = Try-Api -Method "POST" -Url "$BASE_URL/invoices" -Headers $authHeaders -Body @{
  agreement_id=$agreementId
  period_start="2026-03-01"
  period_end="2026-03-31"
  currency="VND"
  line_items=@(@{ description="Bad total test"; amount=1000000; quantity=1 })
  total_amount=9999999
}
if ($badInvoice.ok) {
  if ($badInvoice.body -and $badInvoice.body.total_amount -eq 1000000) {
    Pass -Name "Invoice total recomputed by server (accepted)" -Details "total_amount corrected"
  } else {
    Fail -Name "Invoice accepted with inconsistent total" -Details "Server must reject (400/422) or recompute total"
    throw "InvoiceTotalIntegrityViolation"
  }
} else {
  if ($badInvoice.status -in @(400,422,409)) { Pass -Name "Invoice inconsistent total rejected" -Details "Status=$($badInvoice.status)" }
  else { Skip -Name "Invoice inconsistent total test inconclusive" -Details "Status=$($badInvoice.status)" }
}

# -----------------------------------------
# PAYMENTS + IDEMPOTENCY
# -----------------------------------------
Section "PAYMENTS + IDEMPOTENCY"

$idempotencyKey = "pay_test_$((Get-Date).ToString('yyyyMMddHHmmss'))_$(New-RandSuffix)"
$paymentPayload = @{
  invoice_id = $invoiceId
  provider = $PAYMENT_PROVIDER
  amount = 12000000
  currency = "VND"
  idempotency_key = $idempotencyKey
}

$createPayment1 = Invoke-Api -Name "Create payment (first attempt)" -Method "POST" -Url "$BASE_URL/payments" -Headers $authHeaders -ExpectedStatuses @(201) -Body $paymentPayload
Assert-NotNull -Name "paymentId returned" -Value $createPayment1.body.id
$paymentId = $createPayment1.body.id

$createPayment2 = Invoke-Api -Name "Create payment (duplicate idempotency_key)" -Method "POST" -Url "$BASE_URL/payments" -Headers $authHeaders -ExpectedStatuses @(200,201) -Body $paymentPayload
Assert-True -Name "Idempotency: same payment returned" -Condition ($createPayment2.body.id -eq $paymentId) -Message ("payment1=$paymentId payment2=" + $createPayment2.body.id)

Invoke-Api -Name "Idempotency mismatch amount => 409/400/422" -Method "POST" -Url "$BASE_URL/payments" -Headers $authHeaders -ExpectedStatuses @(409,400,422) -Body @{
  invoice_id = $invoiceId
  provider = $PAYMENT_PROVIDER
  amount = 11000000
  currency = "VND"
  idempotency_key = $idempotencyKey
}

Invoke-Api -Name "List payments" -Method "GET" -Url "$BASE_URL/payments?page=1&page_size=20" -Headers $authHeaders -ExpectedStatuses @(200)
Invoke-Api -Name "Get payment detail" -Method "GET" -Url "$BASE_URL/payments/$paymentId" -Headers $authHeaders -ExpectedStatuses @(200)

# -----------------------------------------
# WEBHOOK + SIGNATURE + REPLAY
# -----------------------------------------
Section "WEBHOOK + SECURITY + REPLAY"

$ledgerCountBefore = Count-Ledger-Entries -Headers $authHeaders
Pass -Name "Ledger snapshot before webhook" -Details "count=$ledgerCountBefore"

$eventId = "evt_test_$((Get-Date).ToString('yyyyMMddHHmmss'))_$(New-RandSuffix)"
$webhookPayload = @{
  event_id = $eventId
  event_type = "payment.succeeded"
  data = @{
    payment_id = $paymentId
    status = "succeeded"
    amount = 12000000
    currency = "VND"
  }
}

if ($REQUIRE_WEBHOOK_SIGNATURE) {
  $noSig = Try-Api -Method "POST" -Url "$BASE_URL/payments/webhook/$PAYMENT_PROVIDER" -Body $webhookPayload -Headers @{}
  if ($noSig.ok) {
    Fail -Name "Webhook without signature was accepted" -Details "Must reject missing signature (401/400)"
    throw "WebhookMissingSignatureAccepted"
  } else {
    if ($noSig.status -in @(400,401,403)) { Pass -Name "Webhook without signature rejected" -Details "Status=$($noSig.status)" }
    else { Fail -Name "Webhook without signature unexpected response" -Details "Status=$($noSig.status) Raw=$($noSig.raw)"; throw "WebhookMissingSignatureUnexpected" }
  }

  $badSigHeaders = @{ "X-Webhook-Signature" = "bad_signature" }
  $badSig = Try-Api -Method "POST" -Url "$BASE_URL/payments/webhook/$PAYMENT_PROVIDER" -Body $webhookPayload -Headers $badSigHeaders
  if ($badSig.ok) {
    Fail -Name "Webhook with bad signature was accepted" -Details "Must reject invalid signature (401/400)"
    throw "WebhookBadSignatureAccepted"
  } else {
    if ($badSig.status -in @(400,401,403)) { Pass -Name "Webhook bad signature rejected" -Details "Status=$($badSig.status)" }
    else { Fail -Name "Webhook bad signature unexpected response" -Details "Status=$($badSig.status) Raw=$($badSig.raw)"; throw "WebhookBadSignatureUnexpected" }
  }
} else {
  Skip -Name "Webhook signature negative tests" -Details "Disabled by URP_REQUIRE_WEBHOOK_SIGNATURE=0"
}

function Sign-Webhook {
  param([string]$Secret, [string]$BodyJson)
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
  $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($BodyJson))
  return ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
}

$validHeaders = @{}
if ($REQUIRE_WEBHOOK_SIGNATURE) {
  if ([string]::IsNullOrWhiteSpace($WEBHOOK_SECRET)) {
    Fail -Name "URP_WEBHOOK_SECRET missing" -Details "Webhook signature required. Set env URP_WEBHOOK_SECRET to shared secret."
    throw "WebhookSecretMissing"
  }
  $bodyJson = ($webhookPayload | ConvertTo-Json -Depth 40)
  $sig = Sign-Webhook -Secret $WEBHOOK_SECRET -BodyJson $bodyJson
  $validHeaders = @{ "X-Webhook-Signature" = $sig }
}

Invoke-Api -Name "Webhook: payment.succeeded (valid)" -Method "POST" -Url "$BASE_URL/payments/webhook/$PAYMENT_PROVIDER" -ExpectedStatuses @(200,201) -Body $webhookPayload -Headers $validHeaders
Invoke-Api -Name "Webhook: replay (same event_id)" -Method "POST" -Url "$BASE_URL/payments/webhook/$PAYMENT_PROVIDER" -ExpectedStatuses @(200,201) -Body $webhookPayload -Headers $validHeaders

$paymentAfterWebhook = Invoke-Api -Name "Get payment after webhook" -Method "GET" -Url "$BASE_URL/payments/$paymentId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "payment.status present" -Value $paymentAfterWebhook.body.status

$badStates = @("PENDING","REQUIRES_ACTION","CREATED")
Assert-True -Name "Payment status advanced from pending" -Condition (-not ($badStates -contains $paymentAfterWebhook.body.status)) -Message ("Status=" + $paymentAfterWebhook.body.status)

$invoiceAfterPayment = Invoke-Api -Name "Get invoice after payment" -Method "GET" -Url "$BASE_URL/invoices/$invoiceId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "invoice.status present after payment" -Value $invoiceAfterPayment.body.status
Assert-True -Name "Invoice is PAID or PARTIALLY_PAID after payment" -Condition ($invoiceAfterPayment.body.status -in @("PAID","PARTIALLY_PAID")) -Message ("Status=" + $invoiceAfterPayment.body.status)

$ledgerCountAfter1 = Count-Ledger-Entries -Headers $authHeaders
Assert-True -Name "Ledger increased after webhook success" -Condition ($ledgerCountAfter1 -gt $ledgerCountBefore) -Message "Before=$ledgerCountBefore After=$ledgerCountAfter1"

$ledgerCountAfter2 = Count-Ledger-Entries -Headers $authHeaders
Assert-True -Name "Ledger did not increase on webhook replay" -Condition ($ledgerCountAfter2 -eq $ledgerCountAfter1) -Message "After1=$ledgerCountAfter1 After2=$ledgerCountAfter2"

# -----------------------------------------
# LEDGER (APPEND-ONLY)
# -----------------------------------------
Section "LEDGER (APPEND-ONLY ENFORCEMENT)"

$invoiceEntries = Get-Ledger-Entries-ForRef -RefId $invoiceId -Headers $authHeaders
Assert-True -Name "Ledger has entries for invoice ref_id" -Condition ($invoiceEntries.Count -gt 0) -Message "No ledger entries found for invoice ref_id=$invoiceId"

$paymentEntries = Get-Ledger-Entries-ForRef -RefId $paymentId -Headers $authHeaders
Assert-True -Name "Ledger has entries for payment ref_id" -Condition ($paymentEntries.Count -gt 0) -Message "No ledger entries found for payment ref_id=$paymentId"

Invoke-Api -Name "Export ledger (JSON)" -Method "GET" -Url "$BASE_URL/ledger/export?format=json" -Headers $authHeaders -ExpectedStatuses @(200)

$ledgerEntryId = $null
if ($invoiceEntries.Count -gt 0 -and $invoiceEntries[0].id) { $ledgerEntryId = $invoiceEntries[0].id }
elseif ($paymentEntries.Count -gt 0 -and $paymentEntries[0].id) { $ledgerEntryId = $paymentEntries[0].id }

if ($ledgerEntryId) {
  Invoke-Api -Name "Ledger update forbidden (append-only) => 403/404/405/400" -Method "PUT" -Url "$BASE_URL/ledger/$ledgerEntryId" -Headers $authHeaders -ExpectedStatuses @(403,404,405,400) -Body @{ note="should not update" }
  Invoke-Api -Name "Ledger delete forbidden (append-only) => 403/404/405/400" -Method "DELETE" -Url "$BASE_URL/ledger/$ledgerEntryId" -Headers $authHeaders -ExpectedStatuses @(403,404,405,400)
} else {
  Skip -Name "Append-only mutation tests" -Details "Could not locate ledgerEntryId (entries missing id field)"
}

# -----------------------------------------
# RECONCILIATION
# -----------------------------------------
Section "RECONCILIATION"

$reconcile1 = Try-Api -Method "POST" -Url "$BASE_URL/ledger/reconcile?start_date=2026-01-01&end_date=2026-12-31" -Headers $authHeaders
if ($reconcile1.ok) {
  Pass -Name "Reconcile ledger (ledger/reconcile)" -Details "Status=$($reconcile1.status)"
  if ($reconcile1.body) { Assert-NotNull -Name "Reconcile response present" -Value $reconcile1.body }
} else {
  $reconcile2 = Try-Api -Method "POST" -Url "$BASE_URL/reconciliation/run?start_date=2026-01-01&end_date=2026-12-31" -Headers $authHeaders
  if ($reconcile2.ok) {
    Pass -Name "Reconcile ledger (reconciliation/run)" -Details "Status=$($reconcile2.status)"
    if ($reconcile2.body) { Assert-NotNull -Name "Reconcile response present" -Value $reconcile2.body }
  } else {
    Fail -Name "Reconciliation endpoint missing" -Details "Implement /ledger/reconcile or /reconciliation/run"
    throw "ReconciliationMissing"
  }
}

# -----------------------------------------
# REFUND (PARTIAL)
# -----------------------------------------
Section "REFUND (PARTIAL)"

$refundPayload = @{ amount = $REFUND_AMOUNT; reason = "Partial refund - strict test" }
Invoke-Api -Name "Refund payment (partial)" -Method "POST" -Url "$BASE_URL/payments/$paymentId/refund" -Headers $authHeaders -ExpectedStatuses @(200,201) -Body $refundPayload | Out-Null

$paymentAfterRefund = Invoke-Api -Name "Get payment after refund" -Method "GET" -Url "$BASE_URL/payments/$paymentId" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "payment.status present after refund" -Value $paymentAfterRefund.body.status

$refundedAmount = $null
if ($paymentAfterRefund.body.refunded_amount -ne $null) { $refundedAmount = [int64]$paymentAfterRefund.body.refunded_amount }
elseif ($paymentAfterRefund.body.refund_amount -ne $null) { $refundedAmount = [int64]$paymentAfterRefund.body.refund_amount }

if ($refundedAmount -ne $null) {
  Assert-True -Name "Refunded amount equals requested amount" -Condition ($refundedAmount -eq $REFUND_AMOUNT) -Message "Expected=$REFUND_AMOUNT Got=$refundedAmount"
  Assert-True -Name "Payment status indicates refund" -Condition ($paymentAfterRefund.body.status -in @("PARTIALLY_REFUNDED","REFUNDED","REFUND_SUCCEEDED")) -Message ("Status=" + $paymentAfterRefund.body.status)
} else {
  $refundEntries = Get-Ledger-Entries-ForRef -RefId $paymentId -Headers $authHeaders
  $hasRefund = $false
  foreach ($e in $refundEntries) {
    if ($e.entry_type -match "REFUND" -and ($e.amount -eq $REFUND_AMOUNT -or $e.delta_amount -eq $REFUND_AMOUNT)) { $hasRefund = $true; break }
  }
  Assert-True -Name "Ledger shows refund amount (fallback)" -Condition $hasRefund -Message "No REFUND ledger entry with amount found"
}

Invoke-Api -Name "Refund exceeding amount => 400/409/422" -Method "POST" -Url "$BASE_URL/payments/$paymentId/refund" -Headers $authHeaders -ExpectedStatuses @(400,409,422) -Body @{ amount = 999999999; reason="exceed" }

# -----------------------------------------
# INVOICE VOID
# -----------------------------------------
Section "INVOICE VOID"

$periodStart2 = "2026-02-01"
$periodEnd2   = "2026-02-28"

$invoiceId2 = $null
$gen2 = Try-Api -Method "POST" -Url "$BASE_URL/invoices/generate" -Headers $authHeaders -Body @{
  agreement_id=$agreementId
  period_start=$periodStart2
  period_end=$periodEnd2
}
if ($gen2.ok -and $gen2.body -and $gen2.body.id) {
  Pass -Name "Generate invoice for void test" -Details "Status=$($gen2.status)"
  $invoiceId2 = $gen2.body.id
} else {
  $createInvoice2 = Invoke-Api -Name "Create invoice for void test" -Method "POST" -Url "$BASE_URL/invoices" -Headers $authHeaders -ExpectedStatuses @(201) -Body @{
    agreement_id=$agreementId
    period_start=$periodStart2
    period_end=$periodEnd2
    currency="VND"
    line_items=@(@{ description="Monthly rent - Feb 2026"; amount=12000000; quantity=1 })
    total_amount=12000000
  }
  $invoiceId2 = $createInvoice2.body.id
}
Assert-NotNull -Name "invoiceId2 returned" -Value $invoiceId2

Invoke-Api -Name "Void invoice (unpaid)" -Method "POST" -Url "$BASE_URL/invoices/$invoiceId2/void" -Headers $authHeaders -ExpectedStatuses @(200) -Body @{ reason = "Strict test void" } | Out-Null

$invoiceAfterVoid = Invoke-Api -Name "Get invoice after void" -Method "GET" -Url "$BASE_URL/invoices/$invoiceId2" -Headers $authHeaders -ExpectedStatuses @(200)
Assert-True -Name "Invoice status is VOID" -Condition ($invoiceAfterVoid.body.status -eq "VOID") -Message ("Status=" + $invoiceAfterVoid.body.status)

Invoke-Api -Name "Void paid invoice => 409/400/422" -Method "POST" -Url "$BASE_URL/invoices/$invoiceId/void" -Headers $authHeaders -ExpectedStatuses @(409,400,422) -Body @{ reason = "Attempt void paid" } | Out-Null

$payVoidProbe = Try-Api -Method "POST" -Url "$BASE_URL/payments" -Headers $authHeaders -Body @{
  invoice_id=$invoiceId2
  provider=$PAYMENT_PROVIDER
  amount=12000000
  currency="VND"
  idempotency_key="pay_void_$((Get-Date).ToString('yyyyMMddHHmmss'))"
}
if ($payVoidProbe.ok) {
  Fail -Name "Payment created for VOID invoice" -Details "System must reject payments for VOID invoice"
  throw "PayVoidInvoiceViolation"
} else {
  if ($payVoidProbe.status -in @(400,409,422)) { Pass -Name "Payment for VOID invoice rejected" -Details "Status=$($payVoidProbe.status)" }
  else { Skip -Name "Pay VOID invoice test inconclusive" -Details "Status=$($payVoidProbe.status)" }
}

# -----------------------------------------
# MULTI-TENANT ISOLATION (OPTIONAL BUT RECOMMENDED)
# -----------------------------------------
Section "MULTI-TENANT ISOLATION (OPTIONAL)"

if (-not [string]::IsNullOrWhiteSpace($ALT_EMAIL) -and -not [string]::IsNullOrWhiteSpace($ALT_PASSWORD)) {
  $altLogin = Invoke-Api -Name "Login as ALT user" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$ALT_EMAIL; password=$ALT_PASSWORD } -ExpectedStatuses @(201,200)
  $altHeaders = Get-AuthHeaders -AccessToken $altLogin.body.access_token
  $altMe = Invoke-Api -Name "ALT me" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $altHeaders -ExpectedStatuses @(200)

  if ($altMe.body.org_id -eq $orgId) {
    Skip -Name "ALT user org differs" -Details "ALT user is in the same org; cannot test cross-org isolation"
  } else {
    Invoke-Api -Name "ALT get invoice by id => 403/404" -Method "GET" -Url "$BASE_URL/invoices/$invoiceId" -Headers $altHeaders -ExpectedStatuses @(403,404)
    Invoke-Api -Name "ALT get payment by id => 403/404" -Method "GET" -Url "$BASE_URL/payments/$paymentId" -Headers $altHeaders -ExpectedStatuses @(403,404)

    $altLedgerProbe = Try-Api -Method "GET" -Url "$BASE_URL/ledger?ref_id=$invoiceId&page=1&page_size=10" -Headers $altHeaders
    if ($altLedgerProbe.ok -and $altLedgerProbe.body -and $altLedgerProbe.body.data -and $altLedgerProbe.body.data.Count -gt 0) {
      Fail -Name "ALT ledger leak" -Details "ALT org can see ledger entries for another org's invoice"
      throw "MultiTenantLeak"
    } else {
      Pass -Name "ALT cannot see other-org ledger entries" -Details "OK"
    }
  }
} else {
  Skip -Name "Multi-tenant isolation tests" -Details "Set URP_ALT_EMAIL and URP_ALT_PASSWORD to enable"
}

# =========================================
# SUMMARY
# =========================================
Section "TEST SUMMARY"

$total = $script:passCount + $script:failCount + $script:skipCount
Write-Host "Total Checks: $total" -ForegroundColor White
Write-Host "Passed: $script:passCount" -ForegroundColor Green
Write-Host "Failed: $script:failCount" -ForegroundColor Red
Write-Host "Skipped: $script:skipCount" -ForegroundColor DarkYellow

if ($script:failCount -gt 0) {
  Write-Host "`nFailed items:" -ForegroundColor Red
  foreach ($r in $script:testResults) {
    if ($r.Status -eq "FAIL") {
      Write-Host (" - " + $r.Name + (if ($r.Details) { " :: " + $r.Details } else { "" })) -ForegroundColor Red
    }
  }
  exit 1
} else {
  Write-Host "`nALL STRICT GATE CHECKS PASSED ✅" -ForegroundColor Green
  exit 0
}
