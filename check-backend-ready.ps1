# ========================================
# Check if Backend is Ready
# ========================================

$baseUrl = "http://localhost:3000"
$maxAttempts = 30
$attempt = 0

Write-Host "Checking if backend is ready..." -ForegroundColor Cyan

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "`n[OK] Backend is ready!" -ForegroundColor Green
            Write-Host "You can now run: .\test-agreement-apis.ps1" -ForegroundColor White
            exit 0
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
}

Write-Host "`n[FAIL] Backend not ready after $maxAttempts seconds" -ForegroundColor Red
Write-Host "Please check if backend is running: cd apps/backend && npm run dev" -ForegroundColor Yellow
exit 1
