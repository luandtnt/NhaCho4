# Quick check if backend is running and healthy

Write-Host "Checking backend status..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is RUNNING on http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "  .\quick-test-booking-apis.ps1" -ForegroundColor White
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start backend:" -ForegroundColor Yellow
    Write-Host "  cd apps/backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again to verify." -ForegroundColor Yellow
}

Write-Host ""
