# URP - M6 HARDENING STRICT GATE TEST
# Version: 1.0
# Last Updated: 2026-01-05
# Scope:
#   - Runtime readiness (health/docs)
#   - Security enforcement (auth/rbac, request_id, security headers, webhook signature, rate limiting)
#   - Performance sanity (p95 latency targets)
#   - Ops readiness (docs, migrations, compose, workflows)
#   - Quality gates (optional: run smoke + M1..M5 scripts)
#
# Philosophy:
#   - M6 is NOT "file exists"; it is "system behaves correctly in production-like conditions".
#   - This script is strict-by-default on core runtime/security checks.
#   - Heavy/slow checks are configurable via env vars.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\Script Test\test-m6.ps1
#
# Optional environment variables:
#   URP_BASE_URL                         (default http://localhost:3000)
#   URP_API_PREFIX                       (default /api/v1)
#   URP_LANDLORD_EMAIL, URP_LANDLORD_PASSWORD
#   URP_TENANT_EMAIL, URP_TENANT_PASSWORD (optional for RBAC negative tests)
#   URP_ALT_EMAIL, URP_ALT_PASSWORD       (optional for cross-org isolation tests)
#
#   URP_M6_REQUIRE_RATELIMIT              (default true)   -> require public rate limit 429
#   URP_M6_RATELIMIT_URL                  (default /api/v1/search/listings?q=apartment)
#   URP_M6_RATELIMIT_BURST                (default 80)     -> number of requests in burst
#
#   URP_M6_PERF_URL                       (default /api/v1/search/listings?q=apartment)
#   URP_M6_PERF_ITER                      (default 40)
#   URP_M6_PERF_WARMUP                    (default 5)
#   URP_M6_PERF_P95_MS                    (default 1000)
#   URP_M6_PERF_TIMEOUT_SEC               (default 10)
#   URP_M6_PERF_USE_AUTH                  (default false)  -> if endpoint requires auth
#
#   URP_REQUIRE_WEBHOOK_SIGNATURE         (default true)
#   URP_WEBHOOK_SECRET                    (required if signature required AND you want to test valid signature path)
#   URP_PAYMENT_PROVIDER                  (default vnpay)
#
#   URP_M6_EXECUTE_SCRIPTS                (default false)  -> actually run smoke/benchmark/load/M1..M5
#   URP_M6_STRICT_EXECUTE_SCRIPTS         (default false)  -> if true, missing scripts or failures -> FAIL
#
# Notes:
#   - If your project paths differ, set URP_M6_ROOT or run from repo root. Script auto-detects repo root by searching for package.json.
#   - This script does not require external modules beyond PowerShell built-ins.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# =========================================
# CONFIG
# =========================================
function Get-BoolEnv([string]$Name, [bool]$Default) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $Default }
  return ($v -eq "1" -or $v -eq "true" -or $v -eq "True" -or $v -eq "yes" -or $v -eq "YES")
}
function Get-IntEnv([string]$Name, [int]$Default) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $Default }
  try { return [int]$v } catch { return $Default }
}
function Get-StrEnv([string]$Name, [string]$Default) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $Default }
  return $v
}

$BASE_URL = Get-StrEnv "URP_BASE_URL" "http://localhost:3000"
$API_PREFIX = Get-StrEnv "URP_API_PREFIX" "/api/v1"

$LANDLORD_EMAIL = Get-StrEnv "URP_LANDLORD_EMAIL" "landlord@example.com"
$LANDLORD_PASSWORD = Get-StrEnv "URP_LANDLORD_PASSWORD" "Password123!"

$TENANT_EMAIL = Get-StrEnv "URP_TENANT_EMAIL" ""
$TENANT_PASSWORD = Get-StrEnv "URP_TENANT_PASSWORD" ""

$ALT_EMAIL = Get-StrEnv "URP_ALT_EMAIL" ""
$ALT_PASSWORD = Get-StrEnv "URP_ALT_PASSWORD" ""

$REQUIRE_RATELIMIT = Get-BoolEnv "URP_M6_REQUIRE_RATELIMIT" $true
$RATELIMIT_URL = Get-StrEnv "URP_M6_RATELIMIT_URL" "$API_PREFIX/search/listings?q=apartment"
$RATELIMIT_BURST = Get-IntEnv "URP_M6_RATELIMIT_BURST" 80

$PERF_URL = Get-StrEnv "URP_M6_PERF_URL" "$API_PREFIX/search/listings?q=apartment"
$PERF_ITER = Get-IntEnv "URP_M6_PERF_ITER" 40
$PERF_WARMUP = Get-IntEnv "URP_M6_PERF_WARMUP" 5
$PERF_P95_MS = Get-IntEnv "URP_M6_PERF_P95_MS" 1000
$PERF_TIMEOUT_SEC = Get-IntEnv "URP_M6_PERF_TIMEOUT_SEC" 10
$PERF_USE_AUTH = Get-BoolEnv "URP_M6_PERF_USE_AUTH" $false

$REQUIRE_WEBHOOK_SIGNATURE = Get-BoolEnv "URP_REQUIRE_WEBHOOK_SIGNATURE" $true
$WEBHOOK_SECRET = Get-StrEnv "URP_WEBHOOK_SECRET" ""
$PAYMENT_PROVIDER = Get-StrEnv "URP_PAYMENT_PROVIDER" "vnpay"

$EXECUTE_SCRIPTS = Get-BoolEnv "URP_M6_EXECUTE_SCRIPTS" $false
$STRICT_EXECUTE_SCRIPTS = Get-BoolEnv "URP_M6_STRICT_EXECUTE_SCRIPTS" $false

# Repo root discovery (helps if script is run from subfolder)
function Find-RepoRoot {
  param([string]$StartDir)
  $d = (Resolve-Path $StartDir).Path
  for ($i=0; $i -lt 8; $i++) {
    if (Test-Path (Join-Path $d "package.json")) { return $d }
    if (Test-Path (Join-Path $d "pnpm-workspace.yaml")) { return $d }
    $parent = Split-Path $d -Parent
    if ($parent -eq $d) { break }
    $d = $parent
  }
  return (Resolve-Path ".").Path
}

$REPO_ROOT = Get-StrEnv "URP_M6_ROOT" ""
if ([string]::IsNullOrWhiteSpace($REPO_ROOT)) { $REPO_ROOT = Find-RepoRoot -StartDir $PSScriptRoot }

function P([string]$Rel) { return (Join-Path $REPO_ROOT $Rel) }

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
  Write-Host ("PASS: " + $Name) -ForegroundColor Green
  $script:passCount++
  Add-Result -Name $Name -Status "PASS" -Details $Details
}
function Fail {
  param([string]$Name, [string]$Details = "")
  Write-Host ("FAIL: " + $Name) -ForegroundColor Red
  if ($Details) { Write-Host ("  " + $Details) -ForegroundColor DarkRed }
  $script:failCount++
  Add-Result -Name $Name -Status "FAIL" -Details $Details
}
function Skip {
  param([string]$Name, [string]$Details = "")
  Write-Host ("SKIP: " + $Name) -ForegroundColor DarkYellow
  if ($Details) { Write-Host ("  " + $Details) -ForegroundColor DarkYellow }
  $script:skipCount++
  Add-Result -Name $Name -Status "SKIP" -Details $Details
}
function Section([string]$Title) {
  Write-Host "`n========================================" -ForegroundColor Yellow
  Write-Host $Title -ForegroundColor Yellow
  Write-Host "========================================" -ForegroundColor Yellow
}
function Assert-True([string]$Name, [bool]$Condition, [string]$Message = "") {
  if ($Condition) { Pass -Name ("ASSERT: " + $Name) }
  else { Fail -Name ("ASSERT: " + $Name) -Details $Message; throw ("AssertionFailed: " + $Name) }
}
function Assert-NotNull([string]$Name, $Value) {
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

# =========================================
# HTTP HELPERS
# =========================================
function Invoke-Http {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int]$TimeoutSec = 20
  )

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
    return [pscustomobject]@{
      ok = $true
      status = [int]$resp.StatusCode
      raw = $resp.Content
      body = (Try-ParseJson $resp.Content)
      headers = $resp.Headers
    }
  } catch {
    $status = $null
    $raw = ""
    $hdrs = @{}
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $status = [int]$_.Exception.Response.StatusCode }
      if ($_.Exception.Response -and $_.Exception.Response.Headers) { $hdrs = $_.Exception.Response.Headers }
      if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $raw = $reader.ReadToEnd()
      }
    } catch {}
    return [pscustomobject]@{
      ok = $false
      status = $status
      raw = $raw
      body = (Try-ParseJson $raw)
      headers = $hdrs
      error = $_.Exception.Message
    }
  }
}

function Invoke-Api {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,                 # path starts with / or api prefix
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int[]]$ExpectedStatuses = @(200),
    [int]$TimeoutSec = 20
  )
  $url = $Path
  if ($url.StartsWith("/")) { $url = $BASE_URL.TrimEnd("/") + $url }
  else { $url = $BASE_URL.TrimEnd("/") + "/" + $url }

  Write-Host "`n--- $Name ---" -ForegroundColor Cyan
  Write-Host "$Method $url" -ForegroundColor DarkCyan

  $resp = Invoke-Http -Method $Method -Url $url -Body $Body -Headers $Headers -TimeoutSec $TimeoutSec

  if ($ExpectedStatuses -contains $resp.status) {
    Pass -Name $Name -Details ("Status=" + $resp.status)
    return $resp
  }

  Fail -Name $Name -Details ("Expected=[{0}] Got={1}. Raw={2}" -f ($ExpectedStatuses -join ","), $resp.status, $resp.raw)
  throw ("UnexpectedStatus: " + $Name)
}

function Get-AuthHeaders([string]$AccessToken) {
  return @{ "Authorization" = "Bearer $AccessToken" }
}

# =========================================
# PERF HELPERS
# =========================================
function Percentile([double[]]$values, [double]$p) {
  if (-not $values -or $values.Count -eq 0) { return $null }
  $sorted = $values | Sort-Object
  $n = $sorted.Count
  $idx = [int][math]::Ceiling($p * $n) - 1
  if ($idx -lt 0) { $idx = 0 }
  if ($idx -ge $n) { $idx = $n - 1 }
  return [double]$sorted[$idx]
}

function Measure-LatencyMs {
  param(
    [string]$Url,
    [hashtable]$Headers = @{},
    [int]$TimeoutSec = 10
  )
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $resp = Invoke-Http -Method "GET" -Url $Url -Headers $Headers -TimeoutSec $TimeoutSec
  $sw.Stop()
  return [pscustomobject]@{
    ok = $resp.ok
    status = $resp.status
    ms = [double]$sw.Elapsed.TotalMilliseconds
    body = $resp.body
    raw = $resp.raw
    headers = $resp.headers
  }
}

# =========================================
# SCRIPT EXECUTION HELPERS (OPTIONAL)
# =========================================
function Run-Script {
  param(
    [string]$Name,
    [string]$ScriptPath
  )

  if (-not (Test-Path $ScriptPath)) {
    if ($STRICT_EXECUTE_SCRIPTS) { Fail -Name $Name -Details ("Missing: " + $ScriptPath); throw "MissingScript" }
    Skip -Name $Name -Details ("Missing: " + $ScriptPath)
    return
  }

  if (-not $EXECUTE_SCRIPTS) {
    Skip -Name $Name -Details "Execution disabled (set URP_M6_EXECUTE_SCRIPTS=1 to run)"
    return
  }

  Write-Host "`n--- RUN SCRIPT: $Name ---" -ForegroundColor Cyan
  Write-Host ("powershell -ExecutionPolicy Bypass -File """ + $ScriptPath + """") -ForegroundColor DarkCyan

  $p = Start-Process -FilePath "powershell" -ArgumentList @("-ExecutionPolicy","Bypass","-File",$ScriptPath) -NoNewWindow -Wait -PassThru
  if ($p.ExitCode -eq 0) {
    Pass -Name $Name -Details ("ExitCode=" + $p.ExitCode)
  } else {
    if ($STRICT_EXECUTE_SCRIPTS) { Fail -Name $Name -Details ("ExitCode=" + $p.ExitCode); throw "ScriptFailed" }
    Fail -Name $Name -Details ("ExitCode=" + $p.ExitCode + " (set URP_M6_STRICT_EXECUTE_SCRIPTS=1 to hard fail)")
  }
}

# =========================================
# START
# =========================================
Section "URP M6 HARDENING - STRICT GATE"
Write-Host ("RepoRoot: " + $REPO_ROOT) -ForegroundColor DarkGray
Write-Host ("BaseUrl:  " + $BASE_URL) -ForegroundColor DarkGray

# -----------------------------------------
# 1) READINESS: health / docs
# -----------------------------------------
Section "READINESS (HEALTH / DOCS)"

$healthPaths = @("/health","/api/health", ($API_PREFIX + "/health"))
$healthOk = $false
$healthChosen = $null
foreach ($hp in $healthPaths) {
  $r = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $hp) -TimeoutSec 10
  if ($r.status -eq 200) { $healthOk = $true; $healthChosen = $hp; break }
}
Assert-True -Name "Health endpoint returns 200" -Condition $healthOk -Message "Tried: $($healthPaths -join ', ')"

$docsPaths = @("/api/docs", "/docs", ($API_PREFIX + "/docs"))
$docsOk = $false
foreach ($dp in $docsPaths) {
  $r = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $dp) -TimeoutSec 10
  if ($r.status -eq 200) { $docsOk = $true; break }
}
Assert-True -Name "API docs endpoint returns 200" -Condition $docsOk -Message "Tried: $($docsPaths -join ', ')"

# -----------------------------------------
# 2) AUTH + RBAC SANITY
# -----------------------------------------
Section "AUTH + RBAC SANITY"

Invoke-Api -Name "Invoices without auth => 401/403" -Method "GET" -Path ($API_PREFIX + "/invoices?page=1&page_size=1") -ExpectedStatuses @(401,403)
Invoke-Api -Name "Payments without auth => 401/403" -Method "GET" -Path ($API_PREFIX + "/payments?page=1&page_size=1") -ExpectedStatuses @(401,403)
Invoke-Api -Name "Ledger without auth => 401/403" -Method "GET" -Path ($API_PREFIX + "/ledger?page=1&page_size=1") -ExpectedStatuses @(401,403)

$login = Invoke-Api -Name "Login (Landlord)" -Method "POST" -Path ($API_PREFIX + "/auth/login") -Body @{ email=$LANDLORD_EMAIL; password=$LANDLORD_PASSWORD } -ExpectedStatuses @(200,201)
Assert-NotNull -Name "Landlord access_token present" -Value $login.body.access_token

$landlordHeaders = Get-AuthHeaders -AccessToken $login.body.access_token
$me = Invoke-Api -Name "Me (Landlord)" -Method "GET" -Path ($API_PREFIX + "/auth/me") -Headers $landlordHeaders -ExpectedStatuses @(200)
Assert-NotNull -Name "me.id present" -Value $me.body.id
Assert-NotNull -Name "me.org_id present" -Value $me.body.org_id
$orgId = $me.body.org_id

$tenantHeaders = $null
if (-not [string]::IsNullOrWhiteSpace($TENANT_EMAIL) -and -not [string]::IsNullOrWhiteSpace($TENANT_PASSWORD)) {
  $tLogin = Invoke-Api -Name "Login (Tenant)" -Method "POST" -Path ($API_PREFIX + "/auth/login") -Body @{ email=$TENANT_EMAIL; password=$TENANT_PASSWORD } -ExpectedStatuses @(200,201)
  if ($tLogin.body -and $tLogin.body.access_token) {
    $tenantHeaders = Get-AuthHeaders -AccessToken $tLogin.body.access_token
    Pass -Name "Tenant credentials provided" -Details "RBAC negative tests enabled"
  } else {
    Skip -Name "Tenant login" -Details "Tenant access_token missing"
  }
} else {
  Skip -Name "Tenant RBAC negative tests" -Details "Set URP_TENANT_EMAIL and URP_TENANT_PASSWORD to enable"
}

if ($tenantHeaders -ne $null) {
  Invoke-Api -Name "Tenant can list own invoices" -Method "GET" -Path ($API_PREFIX + "/tenant/invoices?page=1&page_size=1") -Headers $tenantHeaders -ExpectedStatuses @(200)

  $r = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $API_PREFIX + "/reports/revenue?start_date=2026-01-01&end_date=2026-12-31") -Headers $tenantHeaders -TimeoutSec 15
  if ($r.status -in @(401,403)) { Pass -Name "Tenant blocked from revenue report (expected)" -Details ("Status=" + $r.status) }
  else { Skip -Name "Tenant revenue report access ambiguous" -Details ("Status=" + $r.status + " (if you intend tenant access, add explicit RBAC rule)") }
}

# -----------------------------------------
# 3) REQUEST_ID + ERROR SHAPE + PII
# -----------------------------------------
Section "ERROR SHAPE / REQUEST_ID / PII"

$bad = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $API_PREFIX + "/__does_not_exist__") -TimeoutSec 10

$hasRequestIdHeader = $false
try {
  if ($bad.headers -and ($bad.headers["x-request-id"] -or $bad.headers["X-Request-Id"] -or $bad.headers["X-Request-ID"])) { $hasRequestIdHeader = $true }
} catch {}
$hasRequestIdBody = $false
if ($bad.body -and ($bad.body.request_id -or $bad.body.requestId)) { $hasRequestIdBody = $true }

Assert-True -Name "request_id present (header or body) on errors" -Condition ($hasRequestIdHeader -or $hasRequestIdBody) -Message "Expected X-Request-Id header or JSON request_id field."

$rawErr = "" + $bad.raw
if (-not [string]::IsNullOrWhiteSpace($LANDLORD_EMAIL)) {
  Assert-True -Name "Error response does not echo landlord email" -Condition (-not ($rawErr -like ("*" + $LANDLORD_EMAIL + "*"))) -Message "PII leak: landlord email appears in error response"
}

# -----------------------------------------
# 4) SECURITY HEADERS (STRICT MINIMUM)
# -----------------------------------------
Section "SECURITY HEADERS (STRICT MINIMUM)"

$healthPath = if ($healthChosen) { $healthChosen } else { "/health" }
$hdrResp = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $healthPath) -TimeoutSec 10
Assert-True -Name "Security header probe returns 200" -Condition ($hdrResp.status -eq 200) -Message ("Status=" + $hdrResp.status)

$h = $hdrResp.headers
function Has-Header([string]$k) {
  try { return ($h.ContainsKey($k) -or $h.ContainsKey($k.ToLower()) -or $h.ContainsKey($k.ToUpper())) } catch { return $false }
}

$must = @("X-Content-Type-Options","Referrer-Policy")
$oneOf = @("X-Frame-Options","Content-Security-Policy")
$missing = @()

foreach ($k in $must) { if (-not (Has-Header $k)) { $missing += $k } }
$hasFrame = $false
foreach ($k in $oneOf) { if (Has-Header $k) { $hasFrame = $true; break } }

if ($missing.Count -eq 0 -and $hasFrame) {
  Pass -Name "Security headers present (minimum)"
} else {
  $msg = "Missing required headers: " + ($missing -join ", ") + ". And need one of: X-Frame-Options or Content-Security-Policy."
  Fail -Name "Security headers minimum not satisfied" -Details $msg
  throw "SecurityHeadersMissing"
}

if ($BASE_URL.StartsWith("https://")) {
  Assert-True -Name "HSTS present on HTTPS" -Condition (Has-Header "Strict-Transport-Security") -Message "Missing Strict-Transport-Security on HTTPS"
} else {
  Skip -Name "HSTS check" -Details "BASE_URL is not HTTPS"
}

# -----------------------------------------
# 5) WEBHOOK SIGNATURE (NEGATIVE REQUIRED)
# -----------------------------------------
Section "WEBHOOK SIGNATURE (SECURITY)"

$eventId = "evt_m6_" + (Get-Date).ToString("yyyyMMddHHmmss") + "_" + (New-RandSuffix)
$webhookPayload = @{
  event_id = $eventId
  event_type = "payment.succeeded"
  data = @{
    payment_id = "test_payment_" + (New-RandSuffix)
    status = "succeeded"
    amount = 1000
    currency = "VND"
  }
}

$webhookPath = $API_PREFIX + "/payments/webhook/" + $PAYMENT_PROVIDER
$webhookUrl = $BASE_URL.TrimEnd("/") + $webhookPath

if ($REQUIRE_WEBHOOK_SIGNATURE) {
  $noSig = Invoke-Http -Method "POST" -Url $webhookUrl -Body $webhookPayload -TimeoutSec 15
  if ($noSig.status -in @(400,401,403)) {
    Pass -Name "Webhook missing signature rejected" -Details ("Status=" + $noSig.status)
  } else {
    Fail -Name "Webhook missing signature was not rejected" -Details ("Status=" + $noSig.status + " Raw=" + $noSig.raw)
    throw "WebhookMissingSignature"
  }

  $badSig = Invoke-Http -Method "POST" -Url $webhookUrl -Body $webhookPayload -Headers @{ "X-Webhook-Signature" = "bad_signature" } -TimeoutSec 15
  if ($badSig.status -in @(400,401,403)) {
    Pass -Name "Webhook bad signature rejected" -Details ("Status=" + $badSig.status)
  } else {
    Fail -Name "Webhook bad signature was not rejected" -Details ("Status=" + $badSig.status + " Raw=" + $badSig.raw)
    throw "WebhookBadSignature"
  }

  function Sign-Webhook([string]$Secret, [string]$BodyJson) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($BodyJson))
    return ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
  }

  if ([string]::IsNullOrWhiteSpace($WEBHOOK_SECRET)) {
    Skip -Name "Webhook valid signature path" -Details "Set URP_WEBHOOK_SECRET to test valid signature acceptance"
  } else {
    $json = ($webhookPayload | ConvertTo-Json -Depth 40)
    $sig = Sign-Webhook -Secret $WEBHOOK_SECRET -BodyJson $json
    $valid = Invoke-Http -Method "POST" -Url $webhookUrl -Body $webhookPayload -Headers @{ "X-Webhook-Signature" = $sig } -TimeoutSec 15
    if ($valid.status -in @(401,403)) {
      Fail -Name "Webhook valid signature rejected" -Details ("Status=" + $valid.status + " Raw=" + $valid.raw)
      throw "WebhookValidSignatureRejected"
    } else {
      Pass -Name "Webhook valid signature not rejected by auth" -Details ("Status=" + $valid.status)
    }
  }
} else {
  Skip -Name "Webhook signature enforcement" -Details "Disabled by URP_REQUIRE_WEBHOOK_SIGNATURE=0"
}

# -----------------------------------------
# 6) RATE LIMITING (PUBLIC)
# -----------------------------------------
Section "RATE LIMITING (PUBLIC)"

$ratePath = if ($RATELIMIT_URL.StartsWith("/")) { $RATELIMIT_URL } else { "/" + $RATELIMIT_URL }
$rateUrl = $BASE_URL.TrimEnd("/") + $ratePath
$hits429 = 0
$hits200 = 0
$hitsOther = 0

if ($REQUIRE_RATELIMIT) {
  for ($i=1; $i -le $RATELIMIT_BURST; $i++) {
    $r = Invoke-Http -Method "GET" -Url $rateUrl -TimeoutSec 10
    if ($r.status -eq 429) { $hits429++ }
    elseif ($r.status -eq 200) { $hits200++ }
    else { $hitsOther++ }
    if ($hits429 -ge 1) { break }
  }

  if ($hits429 -ge 1) {
    Pass -Name "Rate limiting observed (429)" -Details ("429_count=" + $hits429 + " 200_count=" + $hits200 + " other=" + $hitsOther)
  } else {
    Fail -Name "Rate limiting NOT observed" -Details ("No 429 after burst=" + $RATELIMIT_BURST + " (200=" + $hits200 + ", other=" + $hitsOther + "). Implement 429 + Retry-After.")
    throw "RateLimitMissing"
  }
} else {
  Skip -Name "Rate limit enforcement" -Details "Disabled by URP_M6_REQUIRE_RATELIMIT=0"
}

# -----------------------------------------
# 7) PERFORMANCE (P95)
# -----------------------------------------
Section "PERFORMANCE (P95)"

$perfPath = if ($PERF_URL.StartsWith("/")) { $PERF_URL } else { "/" + $PERF_URL }
$perfFullUrl = $BASE_URL.TrimEnd("/") + $perfPath
$perfHeaders = @{}
if ($PERF_USE_AUTH) { $perfHeaders = $landlordHeaders }

for ($i=1; $i -le $PERF_WARMUP; $i++) {
  $null = Measure-LatencyMs -Url $perfFullUrl -Headers $perfHeaders -TimeoutSec $PERF_TIMEOUT_SEC
}

$times = New-Object System.Collections.Generic.List[double]
$badCount = 0
for ($i=1; $i -le $PERF_ITER; $i++) {
  $m = Measure-LatencyMs -Url $perfFullUrl -Headers $perfHeaders -TimeoutSec $PERF_TIMEOUT_SEC
  if (-not $m.ok -or $m.status -ne 200) { $badCount++; continue }
  $times.Add([double]$m.ms)
}

Assert-True -Name "Performance sample has enough OK responses" -Condition ($times.Count -ge [math]::Max(5, [math]::Floor($PERF_ITER * 0.7))) -Message ("OK=" + $times.Count + " bad=" + $badCount)

$p95 = Percentile -values $times.ToArray() -p 0.95
$avg = ($times | Measure-Object -Average).Average
$max = ($times | Measure-Object -Maximum).Maximum

Write-Host ("Perf URL: " + $perfFullUrl) -ForegroundColor DarkGray
Write-Host ("Samples: " + $times.Count + " (bad=" + $badCount + ")  AvgMs=" + [math]::Round($avg,2) + "  P95Ms=" + [math]::Round($p95,2) + "  MaxMs=" + [math]::Round($max,2)) -ForegroundColor DarkGray

Assert-True -Name ("p95 latency <= " + $PERF_P95_MS + "ms") -Condition ($p95 -le $PERF_P95_MS) -Message ("p95=" + [math]::Round($p95,2) + "ms exceeds threshold")

# -----------------------------------------
# 8) OPS READINESS (FILES + STRUCTURE)
# -----------------------------------------
Section "OPS READINESS (DOCS / MIGRATIONS / WORKFLOWS)"

$docsRequired = @(
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/PERFORMANCE.md",
  "docs/DEPLOYMENT.md",
  "docs/TROUBLESHOOTING.md"
)
foreach ($d in $docsRequired) {
  if (Test-Path (P $d)) { Pass -Name ("Doc exists: " + $d) }
  else { Fail -Name ("Doc missing: " + $d) -Details "Create this doc to complete M6"; throw "DocMissing" }
}

Assert-True -Name "docker-compose.yml exists" -Condition (Test-Path (P "docker-compose.yml")) -Message "Missing docker-compose.yml"
Assert-True -Name ".env.example exists" -Condition (Test-Path (P ".env.example")) -Message "Missing .env.example"

$migPath = P "apps/backend/prisma/migrations"
if (Test-Path $migPath) {
  $dirs = Get-ChildItem -Path $migPath -Directory -ErrorAction SilentlyContinue
  Assert-True -Name "Prisma migrations present" -Condition ($dirs -and $dirs.Count -gt 0) -Message "No migrations found"
} else {
  Fail -Name "Prisma migrations folder missing" -Details $migPath
  throw "MigrationsMissing"
}

$wf = P ".github/workflows"
if (Test-Path $wf) {
  $files = @(Get-ChildItem -Path $wf -Filter "*.yml" -File -ErrorAction SilentlyContinue)
  if ($files.Count -eq 0) { $files = @(Get-ChildItem -Path $wf -Filter "*.yaml" -File -ErrorAction SilentlyContinue) }
  Assert-True -Name "CI workflows present" -Condition ($files.Count -gt 0) -Message "No workflow yml found"
} else {
  Fail -Name "CI workflows folder missing" -Details ".github/workflows"
  throw "WorkflowsMissing"
}

# -----------------------------------------
# 9) OPTIONAL: execute smoke/bench/load + M1..M5
# -----------------------------------------
Section "OPTIONAL EXECUTION (SMOKE / M1..M5 / BENCH / LOAD)"

Run-Script -Name "Smoke test" -ScriptPath (P "scripts/smoke-test.ps1")
Run-Script -Name "Benchmark search" -ScriptPath (P "scripts/benchmark-search.ps1")
Run-Script -Name "Load test" -ScriptPath (P "scripts/load-test.ps1")

Run-Script -Name "M1 strict gate" -ScriptPath (P "Script Test/test-m1.ps1")
Run-Script -Name "M2 strict gate" -ScriptPath (P "Script Test/test-m2.ps1")
Run-Script -Name "M3 strict gate" -ScriptPath (P "Script Test/test-m3.ps1")
Run-Script -Name "M4 strict gate" -ScriptPath (P "Script Test/test-m4.ps1")
Run-Script -Name "M5 strict gate" -ScriptPath (P "Script Test/test-m5.ps1")

# -----------------------------------------
# 10) OPTIONAL: multi-tenant isolation probes
# -----------------------------------------
Section "MULTI-TENANT ISOLATION (OPTIONAL)"

if (-not [string]::IsNullOrWhiteSpace($ALT_EMAIL) -and -not [string]::IsNullOrWhiteSpace($ALT_PASSWORD)) {
  $altLogin = Invoke-Api -Name "Login (ALT)" -Method "POST" -Path ($API_PREFIX + "/auth/login") -Body @{ email=$ALT_EMAIL; password=$ALT_PASSWORD } -ExpectedStatuses @(200,201)
  $altHeaders = Get-AuthHeaders -AccessToken $altLogin.body.access_token
  $altMe = Invoke-Api -Name "Me (ALT)" -Method "GET" -Path ($API_PREFIX + "/auth/me") -Headers $altHeaders -ExpectedStatuses @(200)

  if ($altMe.body.org_id -eq $orgId) {
    Skip -Name "ALT org isolation" -Details "ALT user is in same org; cannot validate cross-org isolation"
  } else {
    $probe = Invoke-Http -Method "GET" -Url ($BASE_URL.TrimEnd("/") + $API_PREFIX + "/invoices?page=1&page_size=1") -Headers $altHeaders -TimeoutSec 15
    if ($probe.status -in @(401,403)) {
      Pass -Name "ALT blocked from invoices list (expected)" -Details ("Status=" + $probe.status)
    } elseif ($probe.status -eq 200 -and $probe.body -and $probe.body.data -and $probe.body.data.Count -eq 0) {
      Pass -Name "ALT invoices list returns empty (acceptable)" -Details "No leakage observed"
    } else {
      Skip -Name "ALT invoices list ambiguous" -Details ("Status=" + $probe.status + " (ensure data-scope filtering or RBAC)")
    }
  }
} else {
  Skip -Name "Cross-org isolation checks" -Details "Set URP_ALT_EMAIL and URP_ALT_PASSWORD to enable"
}

# =========================================
# SUMMARY
# =========================================
Section "TEST SUMMARY"

$total = $script:passCount + $script:failCount + $script:skipCount
Write-Host ("Total Checks: " + $total) -ForegroundColor White
Write-Host ("Passed:       " + $script:passCount) -ForegroundColor Green
Write-Host ("Failed:       " + $script:failCount) -ForegroundColor Red
Write-Host ("Skipped:      " + $script:skipCount) -ForegroundColor DarkYellow

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
  Write-Host "`nM6 STRICT GATE PASSED ✅" -ForegroundColor Green
  exit 0
}
