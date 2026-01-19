# Restart Backend Server
Write-Host "Restarting Backend Server..." -ForegroundColor Cyan

# Kill all node processes
Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   Done!" -ForegroundColor Green

# Start backend
Write-Host "`n2. Starting backend..." -ForegroundColor Yellow
Set-Location apps/backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm run start:dev"
Set-Location ../..

Write-Host "`n3. Waiting for backend to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`nBackend restarted! Check the new PowerShell window for logs." -ForegroundColor Green
