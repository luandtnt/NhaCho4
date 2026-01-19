# Run Featured Listings Migration
Write-Host "🚀 Running Featured Listings Migration..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location apps/backend

# Run Prisma migration
Write-Host "`n📦 Applying database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_featured_listings --skip-generate

# Generate Prisma Client
Write-Host "`n🔄 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
Write-Host "`nNew features added:" -ForegroundColor Cyan
Write-Host "  - is_featured column for featured listings" -ForegroundColor White
Write-Host "  - view_count column for analytics" -ForegroundColor White
Write-Host "  - last_viewed_at timestamp" -ForegroundColor White
Write-Host "  - Index for featured queries" -ForegroundColor White

Write-Host "`n📝 Backend will auto-reload. Test the new endpoints:" -ForegroundColor Cyan
Write-Host "  POST /api/v1/listings/:id/toggle-featured" -ForegroundColor White
Write-Host "  GET /api/v1/public/listings/featured" -ForegroundColor White

# Return to root
Set-Location ../..
