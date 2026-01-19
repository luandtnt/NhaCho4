# URP - M5 TENANT JOURNEY + OPS STRICT GATE TEST
# Version: 1.0 (Strict Gate)
# Last Updated: 2026-01-05
# Scope (M5):
#   - Tenant Portal: agreements, invoices, payments, tickets
#   - Maintenance Tickets: create, comment, assign, close, attachments
#   - Notifications: list, mark as read
#   - Reports: occupancy, revenue, tickets summary
#
# Philosophy:
#   - Strict. This script will FAIL if security/RBAC rules or core M5 endpoints are missing.
#   - Optional/variable parts are handled with explicit SKIP and clear reasons (e.g., attachment upload style).
#
# How to run:
#   powershell -ExecutionPolicy Bypass -File .\test-m5.ps1
#
# Required env vars (recommended):
#   URP_TENANT_EMAIL, URP_TENANT_PASSWORD
#   URP_LANDLORD_EMAIL, URP_LANDLORD_PASSWORD
#
# Optional env vars:
#   URP_BASE_URL (default http://localhost:3000/api/v1)
#   URP_PAYMENT_PROVIDER (default vnpay)
#   URP_ALT_TENANT_EMAIL, URP_ALT_TENANT_PASSWORD (cross-user isolation checks)
#   URP_LANDLORD_PARTY_ID, URP_TENANT_PARTY_ID (if /parties endpoints are not implemented)
#
# Notes:
#   - This script assumes M4 is implemented enough to create invoices/payments.
#   - If you don't have invoice generation yet, the script falls back to POST /invoices (if available).
#   - Tenant pay endpoint can vary by design; this script probes common patterns.

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

$TENANT_EMAIL = $env:URP_TENANT_EMAIL
if ([string]::IsNullOrWhiteSpace($TENANT_EMAIL)) { $TENANT_EMAIL = "tenant@example.com" }

$TENANT_PASSWORD = $env:URP_TENANT_PASSWORD
if ([string]::IsNullOrWhiteSpace($TENANT_PASSWORD)) { $TENANT_PASSWORD = "Password123!" }

$ALT_TENANT_EMAIL = $env:URP_ALT_TENANT_EMAIL
$ALT_TENANT_PASSWORD = $env:URP_ALT_TENANT_PASSWORD

$PAYMENT_PROVIDER = $env:URP_PAYMENT_PROVIDER
if ([string]::IsNullOrWhiteSpace($PAYMENT_PROVIDER)) { $PAYMENT_PROVIDER = "vnpay" }

# Paging
$DEFAULT_PAGE_SIZE = 50

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

  if ($Body -ne $null) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 40)
  }

  try {
    $resp = Invoke-WebRequest @params
    $status = [int]$resp.StatusCode
    $json = Try-ParseJson $resp.Content
    if ($ExpectedStatuses -contains $status) {
      Pass -Name $Name -Details "Status=$status"
    } else {
      Fail -Name $Name -Details ("Expected=[{0}] Got={1}" -f ($ExpectedStatuses -join ","), $status)
      throw "UnexpectedStatus"
    }
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
  # never throws
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
    return [pscustomobject]@{ ok=$true; status=[int]$resp.StatusCode; body=(Try-ParseJson $resp.Content); raw=$resp.Content; headers=$resp.Headers }
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
    return [pscustomobject]@{ ok=$false; status=$status; body=(Try-ParseJson $raw); raw=$raw; headers=@{} }
  }
}

function Get-AuthHeaders([string]$AccessToken) {
  return @{ "Authorization" = "Bearer $AccessToken" }
}

# =========================================
# DOMAIN HELPERS
# =========================================
function Get-PartyId-ByType {
  param([string]$PartyType, [hashtable]$Headers)

  $probe = Try-Api -Method "GET" -Url "$BASE_URL/parties?type=$PartyType&page=1&page_size=10" -Headers $Headers
  if ($probe.ok -and $probe.body) {
    $items = $null
    if ($probe.body.data) { $items = $probe.body.data } else { $items = $probe.body }
    if ($items -and $items.Count -gt 0 -and $items[0].id) { return $items[0].id }
  }
  return $null
}

# =========================================
# START
# =========================================
Section "URP M5 TENANT JOURNEY + OPS - STRICT GATE"

# -----------------------------------------
# AUTH
# -----------------------------------------
Section "AUTHENTICATION"

$landlordLogin = Invoke-Api -Name "Login as Landlord" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$LANDLORD_EMAIL; password=$LANDLORD_PASSWORD } -ExpectedStatuses @(201,200)
Assert-NotNull -Name "Landlord access_token" -Value $landlordLogin.body.access_token
$landlordHeaders = Get-AuthHeaders -AccessToken $landlordLogin.body.access_token

$tenantLogin = Invoke-Api -Name "Login as Tenant" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$TENANT_EMAIL; password=$TENANT_PASSWORD } -ExpectedStatuses @(201,200)
Assert-NotNull -Name "Tenant access_token" -Value $tenantLogin.body.access_token
$tenantHeaders = Get-AuthHeaders -AccessToken $tenantLogin.body.access_token

$landlordMe = Invoke-Api -Name "Landlord: /auth/me" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $landlordHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "landlordMe.id" -Value $landlordMe.body.id
Assert-NotNull -Name "landlordMe.org_id" -Value $landlordMe.body.org_id

$tenantMe = Invoke-Api -Name "Tenant: /auth/me" -Method "GET" -Url "$BASE_URL/auth/me" -Headers $tenantHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "tenantMe.id" -Value $tenantMe.body.id
Assert-NotNull -Name "tenantMe.org_id" -Value $tenantMe.body.org_id

# -----------------------------------------
# RBAC SANITY
# -----------------------------------------
Section "RBAC SANITY (AUTH REQUIRED)"

Invoke-Api -Name "Tickets without auth => 401/403" -Method "GET" -Url "$BASE_URL/tickets?page=1&page_size=1" -ExpectedStatuses @(401,403)
Invoke-Api -Name "Tenant agreements without auth => 401/403" -Method "GET" -Url "$BASE_URL/tenant/agreements?page=1&page_size=1" -ExpectedStatuses @(401,403)
Invoke-Api -Name "Notifications without auth => 401/403" -Method "GET" -Url "$BASE_URL/notifications?page=1&page_size=1" -ExpectedStatuses @(401,403)

# Tenant endpoints should not be usable by landlord (strict)
Invoke-Api -Name "Landlord calling tenant agreements => 403" -Method "GET" -Url "$BASE_URL/tenant/agreements?page=1&page_size=1" -Headers $landlordHeaders -ExpectedStatuses @(403)
Invoke-Api -Name "Landlord calling tenant invoices => 403" -Method "GET" -Url "$BASE_URL/tenant/invoices?page=1&page_size=1" -Headers $landlordHeaders -ExpectedStatuses @(403)
Invoke-Api -Name "Landlord calling tenant tickets => 403" -Method "GET" -Url "$BASE_URL/tenant/tickets?page=1&page_size=1" -Headers $landlordHeaders -ExpectedStatuses @(403)

# -----------------------------------------
# SETUP: AGREEMENT + INVOICE (for Tenant Portal)
# -----------------------------------------
Section "SETUP: AGREEMENT + INVOICE (M4 dependency)"

$landlordPartyId = Get-PartyId-ByType -PartyType "LANDLORD" -Headers $landlordHeaders
$tenantPartyId = Get-PartyId-ByType -PartyType "TENANT" -Headers $landlordHeaders

if (-not $landlordPartyId) { $landlordPartyId = $env:URP_LANDLORD_PARTY_ID }
if (-not $tenantPartyId) { $tenantPartyId = $env:URP_TENANT_PARTY_ID }

if (-not $landlordPartyId) { $landlordPartyId = "00000000-0000-0000-0000-000000000001" }
if (-not $tenantPartyId) { $tenantPartyId = "00000000-0000-0000-0000-000000000002" }

$agreementRand = New-RandSuffix
$agreementResp = Try-Api -Method "POST" -Url "$BASE_URL/agreements" -Headers $landlordHeaders -Body @{
  landlord_party_id = $landlordPartyId
  tenant_party_id   = $tenantPartyId
  agreement_type    = "lease"
  start_at          = "2026-01-01T00:00:00Z"
  end_at            = "2026-12-31T23:59:59Z"
  terms_json        = @{ rent_amount = 12000000; deposit = 24000000; note = "M5 strict test $agreementRand" }
}

if (-not ($agreementResp.ok -and $agreementResp.body -and $agreementResp.body.id)) {
  Fail -Name "Create agreement (setup)" -Details "M5 relies on agreement for tenant portal invoice/payment checks. Implement POST /agreements."
  throw "AgreementSetupFailed"
}
Pass -Name "Create agreement (setup)" -Details "Status=$($agreementResp.status)"
$agreementId = $agreementResp.body.id
Assert-NotNull -Name "agreementId" -Value $agreementId

# Create invoice (try generate first, then fallback to direct create)
$invoiceId = $null
$periodStart = "2026-01-01"
$periodEnd   = "2026-01-31"

$genInvoice = Try-Api -Method "POST" -Url "$BASE_URL/invoices/generate" -Headers $landlordHeaders -Body @{
  agreement_id = $agreementId
  period_start = $periodStart
  period_end   = $periodEnd
}

if ($genInvoice.ok -and $genInvoice.body -and $genInvoice.body.id) {
  Pass -Name "Generate invoice (engine)" -Details "Status=$($genInvoice.status)"
  $invoiceId = $genInvoice.body.id
} else {
  if ($genInvoice.status -in @(404,405)) {
    Skip -Name "Invoice generator not available; fallback to POST /invoices" -Details "Status=$($genInvoice.status)"
  } elseif ($genInvoice.status -ne $null -and $genInvoice.status -notin @(404,405)) {
    Fail -Name "Invoice generate failed unexpectedly" -Details "Status=$($genInvoice.status) Raw=$($genInvoice.raw)"
    throw "InvoiceGenerateFailed"
  }

  $createInvoice = Try-Api -Method "POST" -Url "$BASE_URL/invoices" -Headers $landlordHeaders -Body @{
    agreement_id = $agreementId
    period_start = $periodStart
    period_end   = $periodEnd
    currency     = "VND"
    line_items   = @(@{ description="Monthly rent - Jan 2026"; amount=12000000; quantity=1 })
    total_amount = 12000000
  }

  if ($createInvoice.ok -and $createInvoice.body -and $createInvoice.body.id) {
    Pass -Name "Create invoice (direct)" -Details "Status=$($createInvoice.status)"
    $invoiceId = $createInvoice.body.id
  } else {
    Fail -Name "Create invoice failed" -Details "Implement POST /invoices or /invoices/generate."
    throw "InvoiceCreateFailed"
  }
}
Assert-NotNull -Name "invoiceId" -Value $invoiceId

# -----------------------------------------
# TENANT PORTAL
# -----------------------------------------
Section "TENANT PORTAL (Tenant token must work)"

$tenantAgreements = Invoke-Api -Name "Tenant: list agreements" -Method "GET" -Url "$BASE_URL/tenant/agreements?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $tenantHeaders -ExpectedStatuses @(200)
$tenantAgreementFound = $false
$itemsA = if ($tenantAgreements.body.data) { $tenantAgreements.body.data } else { $tenantAgreements.body }
if ($itemsA) { foreach ($a in $itemsA) { if ($a.id -eq $agreementId) { $tenantAgreementFound = $true; break } } }
Assert-True -Name "Tenant can see newly created agreement" -Condition $tenantAgreementFound -Message "Agreement $agreementId not found in tenant agreements list"

$tenantInvoices = Invoke-Api -Name "Tenant: list invoices" -Method "GET" -Url "$BASE_URL/tenant/invoices?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $tenantHeaders -ExpectedStatuses @(200)
$tenantInvoiceFound = $false
$itemsI = if ($tenantInvoices.body.data) { $tenantInvoices.body.data } else { $tenantInvoices.body }
if ($itemsI) { foreach ($inv in $itemsI) { if ($inv.id -eq $invoiceId) { $tenantInvoiceFound = $true; break } } }
Assert-True -Name "Tenant can see invoice for their agreement" -Condition $tenantInvoiceFound -Message "Invoice $invoiceId not found in tenant invoices list"

Invoke-Api -Name "Tenant: list tickets" -Method "GET" -Url "$BASE_URL/tenant/tickets?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $tenantHeaders -ExpectedStatuses @(200) | Out-Null
Invoke-Api -Name "Tenant: list payments" -Method "GET" -Url "$BASE_URL/tenant/payments?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $tenantHeaders -ExpectedStatuses @(200) | Out-Null

# -----------------------------------------
# TENANT PAY (probing common patterns)
# -----------------------------------------
Section "TENANT PAYMENT (Pay invoice)"

$tenantPaymentId = $null
$idempotencyKey = "m5_tenant_pay_$((Get-Date).ToString('yyyyMMddHHmmss'))_$(New-RandSuffix)"

# Pattern A: POST /tenant/payments (recommended)
$payA = Try-Api -Method "POST" -Url "$BASE_URL/tenant/payments" -Headers $tenantHeaders -Body @{
  invoice_id = $invoiceId
  provider = $PAYMENT_PROVIDER
  amount = 12000000
  currency = "VND"
  idempotency_key = $idempotencyKey
}
if ($payA.ok -and $payA.body) {
  Pass -Name "Tenant pay invoice via POST /tenant/payments" -Details "Status=$($payA.status)"
  if ($payA.body.id) { $tenantPaymentId = $payA.body.id }
} else {
  # Pattern B: POST /tenant/invoices/{id}/pay (alternative)
  $payB = Try-Api -Method "POST" -Url "$BASE_URL/tenant/invoices/$invoiceId/pay" -Headers $tenantHeaders -Body @{
    provider = $PAYMENT_PROVIDER
    idempotency_key = $idempotencyKey
  }
  if ($payB.ok -and $payB.body) {
    Pass -Name "Tenant pay invoice via POST /tenant/invoices/:id/pay" -Details "Status=$($payB.status)"
    if ($payB.body.id) { $tenantPaymentId = $payB.body.id }
  } else {
    Fail -Name "Tenant pay invoice endpoint missing" -Details "Implement POST /tenant/payments OR POST /tenant/invoices/{id}/pay"
    throw "TenantPaymentMissing"
  }
}

# Idempotency — repeat must return same payment (strict)
if ($tenantPaymentId) {
  $payRepeat = Try-Api -Method "POST" -Url "$BASE_URL/tenant/payments" -Headers $tenantHeaders -Body @{
    invoice_id = $invoiceId
    provider = $PAYMENT_PROVIDER
    amount = 12000000
    currency = "VND"
    idempotency_key = $idempotencyKey
  }
  if ($payRepeat.ok -and $payRepeat.body -and $payRepeat.body.id -eq $tenantPaymentId) {
    Pass -Name "Tenant pay idempotency: same payment returned" -Details "paymentId=$tenantPaymentId"
  } else {
    $payRepeatB = Try-Api -Method "POST" -Url "$BASE_URL/tenant/invoices/$invoiceId/pay" -Headers $tenantHeaders -Body @{
      provider = $PAYMENT_PROVIDER
      idempotency_key = $idempotencyKey
    }
    if ($payRepeatB.ok -and $payRepeatB.body -and $payRepeatB.body.id -eq $tenantPaymentId) {
      Pass -Name "Tenant pay idempotency (alt endpoint): same payment returned" -Details "paymentId=$tenantPaymentId"
    } else {
      Fail -Name "Tenant pay idempotency not enforced" -Details "Same idempotency_key must return same payment"
      throw "TenantPayIdempotencyFailed"
    }
  }
} else {
  Skip -Name "Tenant payment idempotency assertion" -Details "No paymentId returned by tenant pay endpoint (return payment id for testability)"
}

# -----------------------------------------
# TICKETS (End-to-end)
# -----------------------------------------
Section "MAINTENANCE TICKETS (Tenant creates, Landlord handles)"

$ticketRand = New-RandSuffix
$ticketCreate = Invoke-Api -Name "Tenant: create ticket" -Method "POST" -Url "$BASE_URL/tickets" -Headers $tenantHeaders -ExpectedStatuses @(201) -Body @{
  title = "Broken AC - M5 $ticketRand"
  description = "AC not working. Strict test."
  category = "MAINTENANCE"
  priority = "HIGH"
}
Assert-NotNull -Name "ticketId" -Value $ticketCreate.body.id
$ticketId = $ticketCreate.body.id

Invoke-Api -Name "Tenant: get ticket detail" -Method "GET" -Url "$BASE_URL/tickets/$ticketId" -Headers $tenantHeaders -ExpectedStatuses @(200) | Out-Null
Invoke-Api -Name "Tenant: comment on ticket" -Method "POST" -Url "$BASE_URL/tickets/$ticketId/comment" -Headers $tenantHeaders -ExpectedStatuses @(200,201) -Body @{ comment = "Tenant comment: please fix ASAP" } | Out-Null

Invoke-Api -Name "Tenant: assign ticket => 403" -Method "POST" -Url "$BASE_URL/tickets/$ticketId/assign" -Headers $tenantHeaders -ExpectedStatuses @(403) -Body @{ assigned_to_user_id = $tenantMe.body.id } | Out-Null

Invoke-Api -Name "Landlord: list tickets" -Method "GET" -Url "$BASE_URL/tickets?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $landlordHeaders -ExpectedStatuses @(200) | Out-Null
Invoke-Api -Name "Landlord: get ticket detail" -Method "GET" -Url "$BASE_URL/tickets/$ticketId" -Headers $landlordHeaders -ExpectedStatuses @(200) | Out-Null

$assignA = Try-Api -Method "POST" -Url "$BASE_URL/tickets/$ticketId/assign" -Headers $landlordHeaders -Body @{ assigned_to_user_id = $landlordMe.body.id }
if ($assignA.ok) {
  Pass -Name "Landlord: assign ticket (assigned_to_user_id)" -Details "Status=$($assignA.status)"
} else {
  $assignB = Try-Api -Method "POST" -Url "$BASE_URL/tickets/$ticketId/assign" -Headers $landlordHeaders -Body @{ assigned_to = $landlordMe.body.id }
  if ($assignB.ok) {
    Pass -Name "Landlord: assign ticket (assigned_to)" -Details "Status=$($assignB.status)"
  } else {
    Fail -Name "Landlord: assign ticket failed" -Details "Support assigned_to_user_id (preferred) or assigned_to"
    throw "TicketAssignFailed"
  }
}

$ticketDetailAfterAssign = Invoke-Api -Name "Verify ticket after assign" -Method "GET" -Url "$BASE_URL/tickets/$ticketId" -Headers $landlordHeaders -ExpectedStatuses @(200)
$assignedOk = $false
if ($ticketDetailAfterAssign.body.assigned_to_user_id -eq $landlordMe.body.id) { $assignedOk = $true }
elseif ($ticketDetailAfterAssign.body.assigned_to -eq $landlordMe.body.id) { $assignedOk = $true }
Assert-True -Name "Ticket assigned_to reflects landlord user id" -Condition $assignedOk -Message "assigned_to(_user_id) not set to landlord"

Invoke-Api -Name "Landlord: close ticket" -Method "POST" -Url "$BASE_URL/tickets/$ticketId/close" -Headers $landlordHeaders -ExpectedStatuses @(200) -Body @{ resolution = "Resolved by strict test" } | Out-Null

Invoke-Api -Name "Tenant: close ticket => 403" -Method "POST" -Url "$BASE_URL/tickets/$ticketId/close" -Headers $tenantHeaders -ExpectedStatuses @(403) -Body @{ resolution = "Tenant attempt - should be forbidden" } | Out-Null

Invoke-Api -Name "Comment after close => 409/400" -Method "POST" -Url "$BASE_URL/tickets/$ticketId/comment" -Headers $tenantHeaders -ExpectedStatuses @(409,400) -Body @{ comment = "Comment after close" } | Out-Null

$attachProbe = Try-Api -Method "POST" -Url "$BASE_URL/tickets/$ticketId/attachments" -Headers $tenantHeaders -Body @{ url = "https://example.com/photo.jpg"; file_name = "photo.jpg" }
if ($attachProbe.ok) {
  Pass -Name "Ticket attachment added (ref style)" -Details "Status=$($attachProbe.status)"
} else {
  if ($attachProbe.status -in @(404,405)) { Skip -Name "Ticket attachments endpoint missing" -Details "Implement POST /tickets/{id}/attachments" }
  elseif ($attachProbe.status -in @(415)) { Skip -Name "Ticket attachments require multipart" -Details "Update test when multipart implemented" }
  else { Fail -Name "Ticket attachment unexpected response" -Details "Status=$($attachProbe.status) Raw=$($attachProbe.raw)"; throw "TicketAttachmentUnexpected" }
}

# -----------------------------------------
# NOTIFICATIONS
# -----------------------------------------
Section "NOTIFICATIONS (List + Mark Read)"

$notifList = Invoke-Api -Name "List notifications" -Method "GET" -Url "$BASE_URL/notifications?page=1&page_size=$DEFAULT_PAGE_SIZE" -Headers $tenantHeaders -ExpectedStatuses @(200)
$firstNotifId = $null
$itemsN = if ($notifList.body.data) { $notifList.body.data } else { $notifList.body }
if ($itemsN -and $itemsN.Count -gt 0 -and $itemsN[0].id) { $firstNotifId = $itemsN[0].id }

if ($firstNotifId) {
  $markReadA = Try-Api -Method "PUT" -Url "$BASE_URL/notifications/$firstNotifId/read" -Headers $tenantHeaders -Body @{}
  if ($markReadA.ok) {
    Pass -Name "Mark notification as read (PUT /notifications/:id/read)" -Details "Status=$($markReadA.status)"
  } else {
    $markReadB = Try-Api -Method "PATCH" -Url "$BASE_URL/notifications/$firstNotifId" -Headers $tenantHeaders -Body @{ is_read = $true }
    if ($markReadB.ok) {
      Pass -Name "Mark notification as read (PATCH /notifications/:id)" -Details "Status=$($markReadB.status)"
    } else {
      Fail -Name "Mark notification as read missing" -Details "Implement PUT /notifications/{id}/read or PATCH /notifications/{id}"
      throw "NotificationMarkReadMissing"
    }
  }
} else {
  Skip -Name "Mark notification as read" -Details "No notifications available to mark read"
}

# -----------------------------------------
# REPORTS (landlord-only)
# -----------------------------------------
Section "REPORTS (Landlord allowed, Tenant forbidden)"

Invoke-Api -Name "Landlord: occupancy report" -Method "GET" -Url "$BASE_URL/reports/occupancy?start_date=2026-01-01&end_date=2026-12-31" -Headers $landlordHeaders -ExpectedStatuses @(200) | Out-Null
Invoke-Api -Name "Landlord: revenue report" -Method "GET" -Url "$BASE_URL/reports/revenue?start_date=2026-01-01&end_date=2026-12-31" -Headers $landlordHeaders -ExpectedStatuses @(200) | Out-Null
Invoke-Api -Name "Landlord: tickets summary report" -Method "GET" -Url "$BASE_URL/reports/tickets-summary" -Headers $landlordHeaders -ExpectedStatuses @(200) | Out-Null

Invoke-Api -Name "Tenant: occupancy report => 403" -Method "GET" -Url "$BASE_URL/reports/occupancy?start_date=2026-01-01&end_date=2026-12-31" -Headers $tenantHeaders -ExpectedStatuses @(403) | Out-Null
Invoke-Api -Name "Tenant: revenue report => 403" -Method "GET" -Url "$BASE_URL/reports/revenue?start_date=2026-01-01&end_date=2026-12-31" -Headers $tenantHeaders -ExpectedStatuses @(403) | Out-Null
Invoke-Api -Name "Tenant: tickets summary => 403" -Method "GET" -Url "$BASE_URL/reports/tickets-summary" -Headers $tenantHeaders -ExpectedStatuses @(403) | Out-Null

# -----------------------------------------
# OPTIONAL: Cross-user isolation
# -----------------------------------------
Section "CROSS-USER ISOLATION (OPTIONAL)"

if (-not [string]::IsNullOrWhiteSpace($ALT_TENANT_EMAIL) -and -not [string]::IsNullOrWhiteSpace($ALT_TENANT_PASSWORD)) {
  $altLogin = Invoke-Api -Name "Login as ALT Tenant" -Method "POST" -Url "$BASE_URL/auth/login" -Body @{ email=$ALT_TENANT_EMAIL; password=$ALT_TENANT_PASSWORD } -ExpectedStatuses @(201,200)
  $altHeaders = Get-AuthHeaders -AccessToken $altLogin.body.access_token

  Invoke-Api -Name "ALT tenant cannot read other tenant ticket => 403/404" -Method "GET" -Url "$BASE_URL/tickets/$ticketId" -Headers $altHeaders -ExpectedStatuses @(403,404) | Out-Null
  Pass -Name "Cross-user isolation enabled" -Details "ALT tenant configured"
} else {
  Skip -Name "Cross-user isolation tests" -Details "Set URP_ALT_TENANT_EMAIL and URP_ALT_TENANT_PASSWORD to enable"
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
  Write-Host "`nALL M5 STRICT GATE CHECKS PASSED ✅" -ForegroundColor Green
  exit 0
}
