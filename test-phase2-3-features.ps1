# test-phase2-3-features.ps1
# Phase 2/3 Test - FIXED (NO PARSE ERRORS)
# Works on Windows PowerShell 5.1 and PowerShell 7+

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Phase 2 and 3 Enhancements (FIXED)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==========================
# CONFIG
# ==========================
$baseUrl = "http://localhost:3000/api/v1"

# Use your known working account
$email = "landlord@example.com"
$password = "Password123!"

# Allow override by environment variables (optional)
if ($env:URP_EMAIL) { $email = $env:URP_EMAIL }
if ($env:URP_PASSWORD) { $password = $env:URP_PASSWORD }

# ==========================
# HELPERS
# ==========================
function Write-Section([string]$text) {
    Write-Host $text -ForegroundColor Yellow
}

function Write-Ok([string]$text) {
    Write-Host ("[OK]  " + $text) -ForegroundColor Green
}

function Write-Warn([string]$text) {
    Write-Host ("[WARN] " + $text) -ForegroundColor Yellow
}

function Write-Fail([string]$text) {
    Write-Host ("[FAIL] " + $text) -ForegroundColor Red
}

function Get-HttpErrorDetails($err) {
    $status = $null
    $body = $null
    $msg = $err.Exception.Message

    try {
        if ($err.Exception.Response -ne $null) {
            $status = $err.Exception.Response.StatusCode.value__
            $stream = $err.Exception.Response.GetResponseStream()
            if ($stream -ne $null) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
            }
        }
    } catch {
        # ignore
    }

    return @{
        Status = $status
        Body   = $body
        Msg    = $msg
    }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory=$true)][string]$Method,
        [Parameter(Mandatory=$true)][string]$Url,
        [hashtable]$Headers = $null,
        $Body = $null,
        [int]$JsonDepth = 10
    )

    try {
        if ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth $JsonDepth
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $json -ContentType "application/json"
        } else {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
    } catch {
        $d = Get-HttpErrorDetails $_
        $statusText = if ($d.Status) { "HTTP $($d.Status)" } else { "HTTP ?" }

        Write-Fail ("{0} {1} => {2} | {3}" -f $Method, $Url, $statusText, $d.Msg)

        if ($d.Body) {
            Write-Host "----- Response body -----" -ForegroundColor DarkGray
            Write-Host $d.Body -ForegroundColor DarkGray
            Write-Host "-------------------------" -ForegroundColor DarkGray
        }

        throw
    }
}

function Get-CountSafe($res) {
    if ($null -eq $res) { return 0 }

    if ($res.data -is [System.Array]) { return $res.data.Count }
    if ($res.data -and $res.data.items -is [System.Array]) { return $res.data.items.Count }
    if ($res.items -is [System.Array]) { return $res.items.Count }

    return 0
}

function Get-FirstItemIdSafe($res) {
    if ($null -eq $res) { return $null }

    if ($res.data -is [System.Array] -and $res.data.Count -gt 0) { return $res.data[0].id }
    if ($res.data -and $res.data.items -is [System.Array] -and $res.data.items.Count -gt 0) { return $res.data.items[0].id }
    if ($res.items -is [System.Array] -and $res.items.Count -gt 0) { return $res.items[0].id }

    return $null
}

# ==========================
# 1) AUTH
# ==========================
Write-Section "1) Testing Authentication..."
$headers = $null

try {
    $loginBody = @{
        email    = $email
        password = $password
    }

    $loginResponse = Invoke-Api -Method "POST" -Url "$baseUrl/auth/login" -Body $loginBody -JsonDepth 5

    if (-not $loginResponse.access_token) {
        Write-Fail "Login ok but access_token missing"
        exit 1
    }

    $token = $loginResponse.access_token
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }

    Write-Ok ("Authenticated as: " + $email)
} catch {
    Write-Fail "Authentication failed. Check backend + credentials."
    exit 1
}

Write-Host ""

# ==========================
# 2) SMART RECOMMENDATIONS
# ==========================
Write-Section "2) Testing Smart Recommendations..."
try {
    $url = "$baseUrl/marketplace/recommended?limit=6"
    try {
        $recommendations = Invoke-Api -Method "GET" -Url $url
    } catch {
        Write-Warn "Retry recommendations with auth header..."
        $recommendations = Invoke-Api -Method "GET" -Url $url -Headers $headers
    }

    $count = Get-CountSafe $recommendations
    Write-Ok ("Recommendations count: " + $count)
} catch {
    Write-Warn "Recommendations test failed (see error above)."
}

Write-Host ""

# ==========================
# 3) CONTEXT-AWARE RECOMMENDATIONS
# ==========================
Write-Section "3) Testing Context-aware Recommendations..."
try {
    $discoverUrl = "$baseUrl/marketplace/discover?page=1`&page_size=1"

    try {
        $listings = Invoke-Api -Method "GET" -Url $discoverUrl
    } catch {
        Write-Warn "Retry discover with auth header..."
        $listings = Invoke-Api -Method "GET" -Url $discoverUrl -Headers $headers
    }

    $listingId = Get-FirstItemIdSafe $listings
    if (-not $listingId) {
        Write-Warn "No listing found to test context."
    } else {
        $recUrl = "$baseUrl/marketplace/recommended?limit=6`&context_listing_id=$listingId"

        try {
            $contextRecs = Invoke-Api -Method "GET" -Url $recUrl
        } catch {
            Write-Warn "Retry context rec with auth header..."
            $contextRecs = Invoke-Api -Method "GET" -Url $recUrl -Headers $headers
        }

        $count = Get-CountSafe $contextRecs
        Write-Ok ("Context recommendations count: " + $count + " (listing_id=" + $listingId + ")")
    }
} catch {
    Write-Warn "Context recommendations test failed (see error above)."
}

Write-Host ""

# ==========================
# 4) POLICY CONFLICT DETECTION
# ==========================
Write-Section "4) Testing Policy Conflict Detection..."
try {
    $policiesUrl = "$baseUrl/pricing-policies?page=1`&page_size=1"
    $policies = Invoke-Api -Method "GET" -Url $policiesUrl -Headers $headers

    $policyId = Get-FirstItemIdSafe $policies
    if (-not $policyId) {
        Write-Warn "No pricing policy found."
    } else {
        $conflictsUrl = "$baseUrl/pricing-policies/$policyId/conflicts"
        $conflicts = Invoke-Api -Method "GET" -Url $conflictsUrl -Headers $headers

        Write-Ok ("Conflict check done. policy_id=" + $policyId)

        if ($conflicts.has_conflicts -ne $null) {
            Write-Host ("  has_conflicts: " + $conflicts.has_conflicts) -ForegroundColor Gray
        }
        if ($conflicts.conflict_count -ne $null) {
            Write-Host ("  conflict_count: " + $conflicts.conflict_count) -ForegroundColor Gray
        }
    }
} catch {
    Write-Warn "Policy conflict test failed (see error above)."
}

Write-Host ""

# ==========================
# 5) PRICE CALCULATION WITH POLICY
# ==========================
Write-Section "5) Testing Price Calculation with Policy..."
try {
    $itemsUrl = "$baseUrl/rentable-items?page=1`&page_size=1"
    $items = Invoke-Api -Method "GET" -Url $itemsUrl -Headers $headers

    $itemId = Get-FirstItemIdSafe $items
    if (-not $itemId) {
        Write-Warn "No rentable item found."
    } else {
        $priceCalcUrl = "$baseUrl/bookings/calculate-price"

        # IMPORTANT: JsonDepth MUST be > 2 (guests is nested)
        $priceBody = @{
            rentable_item_id = $itemId
            start_date = "2026-07-01T14:00:00Z"
            end_date   = "2026-07-05T11:00:00Z"
            guests = @{
                adults   = 2
                children = 0
                infants  = 0
            }
        }

        $priceCalc = Invoke-Api -Method "POST" -Url $priceCalcUrl -Headers $headers -Body $priceBody -JsonDepth 10

        Write-Ok ("Price calculated. item_id=" + $itemId)

        $basePrice = $priceCalc.base_price
        if (-not $basePrice -and $priceCalc.data) { $basePrice = $priceCalc.data.base_price }

        $total = $priceCalc.total
        if (-not $total -and $priceCalc.data) { $total = $priceCalc.data.total }

        Write-Host ("  base_price: " + $basePrice) -ForegroundColor Gray
        Write-Host ("  total: " + $total) -ForegroundColor Gray
    }
} catch {
    Write-Warn "Price calculation test failed (see error above)."
}

Write-Host ""

# ==========================
# 6) FEATURED LISTINGS
# ==========================
Write-Section "6) Testing Featured Listings..."
try {
    $url = "$baseUrl/marketplace/featured?limit=6"

    try {
        $featured = Invoke-Api -Method "GET" -Url $url
    } catch {
        Write-Warn "Retry featured with auth header..."
        $featured = Invoke-Api -Method "GET" -Url $url -Headers $headers
    }

    $count = Get-CountSafe $featured
    Write-Ok ("Featured listings count: " + $count)
} catch {
    Write-Warn "Featured listings test failed (see error above)."
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DONE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
