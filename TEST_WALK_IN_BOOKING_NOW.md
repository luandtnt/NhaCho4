# 🧪 Test Walk-in Booking System - Quick Guide

## Bước 1: Chạy Migration

```powershell
# Option 1: Sử dụng script (Khuyến nghị)
.\run-walk-in-migration.ps1

# Option 2: Manual
cd apps/backend
psql $env:DATABASE_URL -f prisma/migrations/20260117_walk_in_bookings/migration.sql
npx prisma generate
cd ../..
```

## Bước 2: Restart Backend

```powershell
# Stop backend nếu đang chạy (Ctrl+C)
# Start lại
cd apps/backend
npm run dev
```

## Bước 3: Test Backend APIs

### 3.1. Get Active Bookings (Should be empty initially)
```powershell
$token = "YOUR_LANDLORD_TOKEN"

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/active" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### 3.2. Quick Check-in
```powershell
# Get a room ID first
$rooms = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/rentable-items?page=1&page_size=10" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

$roomId = $rooms.items[0].id

# Check-in
$body = @{
    rentable_item_id = $roomId
    guests = 2
    estimated_duration_hours = 3
    notes = "Test walk-in booking"
} | ConvertTo-Json

$checkin = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/quick-checkin" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body

Write-Host "✅ Check-in successful!" -ForegroundColor Green
Write-Host "Booking Code: $($checkin.booking_code)" -ForegroundColor Cyan
Write-Host "Booking ID: $($checkin.booking_id)" -ForegroundColor Cyan

$bookingId = $checkin.booking_id
```

### 3.3. Get Active Bookings Again (Should show 1 booking)
```powershell
$active = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/active" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

Write-Host "Active bookings: $($active.Count)" -ForegroundColor Yellow
$active | Format-Table booking_code, duration, current_price
```

### 3.4. Extend Booking
```powershell
$body = @{
    booking_id = $bookingId
    additional_hours = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/extend" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body

Write-Host "✅ Extended successfully!" -ForegroundColor Green
```

### 3.5. Check-out
```powershell
$body = @{
    booking_id = $bookingId
    notes = "Test checkout"
} | ConvertTo-Json

$checkout = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/checkout" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body

Write-Host "✅ Check-out successful!" -ForegroundColor Green
Write-Host "Duration: $($checkout.duration_hours) hours" -ForegroundColor Cyan
Write-Host "Total Price: $($checkout.total_price) VND" -ForegroundColor Cyan
```

## Bước 4: Test Frontend

### 4.1. Quick Check-in Page
```
1. Mở browser: http://localhost:5173
2. Login as Landlord
3. Navigate to: http://localhost:5173/quick-checkin
4. Chọn phòng từ dropdown
5. Chọn số khách: 2
6. Chọn thời gian: 3h
7. Nhập ghi chú (optional)
8. Click "Check-in Ngay"
9. ✅ Thấy success message với booking code
10. ✅ Auto-redirect đến /active-bookings
```

### 4.2. Active Bookings Page
```
1. Đang ở /active-bookings (sau check-in)
2. ✅ Thấy phòng vừa check-in trong danh sách
3. ✅ Thấy thời gian đang chạy (VD: 0h 1m)
4. ✅ Thấy giá tạm tính
5. Wait 1 minute
6. ✅ Thấy thời gian tự động cập nhật (0h 2m)
7. Click "Gia hạn"
8. Nhập: 2
9. ✅ Thấy thời gian dự kiến mới
10. Click "Check-out"
11. Confirm
12. ✅ Thấy tổng tiền
13. ✅ Phòng biến mất khỏi danh sách
```

### 4.3. Calendar Integration
```
1. Navigate to: http://localhost:5173/availability
2. Chọn 1 phòng có booking CHECKED_IN
3. Chọn view "Giờ"
4. ✅ Thấy giờ hiện tại màu cam
5. ✅ Thấy label "🚶 Đang sử dụng"
6. ✅ Thấy dot cam đang pulse
7. ✅ Thấy ring orange highlight
8. Chọn view "Ngày"
9. ✅ Thấy ngày hôm nay màu cam
10. Check legend
11. ✅ Thấy 4 màu: Green, Yellow, Orange, Red
```

## Bước 5: Test Complete Flow

### Scenario: Khách walk-in đến và rời đi
```
1. Khách đến lúc 10:00
   → Landlord vào /quick-checkin
   → Chọn P101, 2 khách, 3 giờ
   → Check-in
   → ✅ Booking code: WI-ABC12345

2. Lúc 10:30 (30 phút sau)
   → Landlord vào /active-bookings
   → ✅ Thấy P101: 0h 30m, 50.000 ₫

3. Lúc 12:00 (2 giờ sau)
   → Khách muốn ở thêm 2 giờ
   → Landlord click "Gia hạn"
   → Nhập 2 giờ
   → ✅ Thời gian mới: 15:00

4. Lúc 14:30 (4.5 giờ sau check-in)
   → Khách check-out
   → Landlord click "Check-out"
   → ✅ Thời gian sử dụng: 5 giờ (làm tròn lên)
   → ✅ Tổng tiền: 500.000 ₫ (100k × 5h)

5. Kiểm tra calendar
   → Vào /availability
   → ✅ P101 hiển thị màu xanh (available)
```

## Expected Results

### Backend
✅ Migration chạy thành công
✅ 5 cột mới trong bảng bookings
✅ 4 API endpoints hoạt động
✅ Tính giá đúng theo thời gian thực tế
✅ Làm tròn lên giờ gần nhất

### Frontend
✅ Quick Check-in page load
✅ Dropdown hiển thị danh sách phòng
✅ Giá dự kiến tính đúng
✅ Check-in thành công
✅ Active Bookings page load
✅ Real-time duration counter
✅ Auto-refresh mỗi 30s
✅ Gia hạn thành công
✅ Check-out thành công
✅ Calendar hiển thị màu cam cho CHECKED_IN
✅ Pulse animation hoạt động
✅ Legend hiển thị 4 màu

## Troubleshooting

### Issue 1: Migration fails
```powershell
# Check if columns already exist
psql $env:DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name IN ('actual_start_at', 'is_walk_in');"

# If exists, skip migration or run rollback first
psql $env:DATABASE_URL -f apps/backend/prisma/migrations/20260117_walk_in_bookings/rollback.sql
```

### Issue 2: API returns 404
```
- Check backend is running: http://localhost:3000
- Check route: /api/v1/bookings/quick-checkin
- Check token is valid
- Check user role is Landlord/PropertyManager/OrgAdmin
```

### Issue 3: Frontend page not found
```
- Check frontend is running: http://localhost:5173
- Check routes in App.tsx
- Clear browser cache
- Check imports in App.tsx
```

### Issue 4: Calendar không hiển thị màu cam
```
- Check booking status là CHECKED_IN
- Check getAvailabilityColor() function
- Check booking object được pass vào
- Inspect element để xem class names
```

## Success Criteria

✅ All 4 backend APIs work
✅ Quick Check-in page functional
✅ Active Bookings page functional
✅ Real-time updates work
✅ Calendar shows orange for CHECKED_IN
✅ Pulse animation visible
✅ Check-out calculates correct price
✅ Mobile responsive

## Next Steps After Testing

1. Train landlords on new features
2. Monitor for bugs in production
3. Collect user feedback
4. Plan Phase 4 enhancements (optional)

---

**Status**: Ready to test! 🚀
