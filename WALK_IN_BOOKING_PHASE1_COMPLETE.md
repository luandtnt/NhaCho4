# Walk-in Booking System - Phase 1 Complete ✅

## Tổng quan
Phase 1 triển khai backend infrastructure cho hệ thống quản lý khách walk-in (khách ngoài app), bao gồm database schema, API endpoints, và business logic.

## Vấn đề giải quyết
Đối với cho thuê ngắn hạn (giờ, ngày), landlord cần quản lý khách walk-in khi:
- Khách đến trực tiếp không qua app
- Chỉ biết thời gian check-in, chưa biết khi nào check-out
- Cần tính tiền dựa trên thời gian thực tế sử dụng

## Thay đổi Database Schema

### Bảng `bookings` - Thêm 5 cột mới

```sql
ALTER TABLE bookings ADD COLUMN:
- actual_start_at TIMESTAMP          -- Thời gian check-in thực tế
- actual_end_at TIMESTAMP            -- Thời gian check-out thực tế  
- is_walk_in BOOLEAN DEFAULT FALSE   -- Đánh dấu khách walk-in
- estimated_duration_hours INTEGER   -- Thời gian dự kiến (giờ)
- walk_in_notes TEXT                 -- Ghi chú cho khách walk-in
```

### Trạng thái Booking mới

```typescript
enum BookingStatus {
  PENDING       // Đặt trước qua app, chờ xác nhận
  CONFIRMED     // Đã xác nhận
  CHECKED_IN    // Đã check-in (đang sử dụng) ⭐ MỚI
  CHECKED_OUT   // Đã check-out ⭐ MỚI
  COMPLETED     // Hoàn thành (đã thanh toán)
  CANCELLED     // Đã hủy
  NO_SHOW       // Không đến ⭐ MỚI
}
```

### Indexes mới
- `idx_bookings_actual_start_at` - Tìm kiếm theo thời gian check-in
- `idx_bookings_actual_end_at` - Tìm kiếm theo thời gian check-out
- `idx_bookings_is_walk_in` - Lọc khách walk-in
- `idx_bookings_status_start_at` - Query hiệu quả theo status + time

## API Endpoints mới

### 1. Quick Check-in (POST /api/v1/bookings/quick-checkin)
**Mục đích**: Check-in nhanh cho khách walk-in

**Request Body**:
```json
{
  "rentable_item_id": "room-123",
  "guests": 2,
  "estimated_duration_hours": 3,
  "notes": "Khách yêu cầu phòng yên tĩnh"
}
```

**Response**:
```json
{
  "booking_id": "abc-123",
  "booking_code": "WI-ABC12345",
  "status": "CHECKED_IN",
  "rentable_item": {
    "id": "room-123",
    "code": "P101",
    "base_price": 100000,
    "price_unit": "HOUR"
  },
  "checked_in_at": "2026-01-17T10:00:00Z",
  "estimated_checkout": "2026-01-17T13:00:00Z",
  "guests": 2,
  "notes": "Khách yêu cầu phòng yên tĩnh"
}
```

**Business Logic**:
- Tạo booking với status `CHECKED_IN` ngay lập tức
- `actual_start_at` = thời gian hiện tại
- `actual_end_at` = null (chưa biết)
- `is_walk_in` = true
- Kiểm tra phòng có đang bị chiếm không
- Tạo default tenant party nếu chưa có

### 2. Check-out (POST /api/v1/bookings/checkout)
**Mục đích**: Check-out và tính tiền dựa trên thời gian thực tế

**Request Body**:
```json
{
  "booking_id": "abc-123",
  "notes": "Khách hài lòng"
}
```

**Response**:
```json
{
  "booking_id": "abc-123",
  "booking_code": "WI-ABC12345",
  "status": "CHECKED_OUT",
  "checked_in_at": "2026-01-17T10:00:00Z",
  "checked_out_at": "2026-01-17T14:30:00Z",
  "duration_hours": 5,
  "total_price": 500000,
  "currency": "VND"
}
```

**Business Logic**:
- Tính thời gian thực tế: `actual_end_at - actual_start_at`
- Làm tròn lên giờ gần nhất
- Tính giá dựa trên `price_unit`:
  - HOUR: `base_price × hours`
  - NIGHT: `base_price × ceil(hours/24)`
  - MONTH: `(base_price/30) × ceil(hours/24)`
- Cập nhật status = `CHECKED_OUT`

### 3. Extend Booking (POST /api/v1/bookings/extend)
**Mục đích**: Gia hạn thời gian cho khách đang sử dụng

**Request Body**:
```json
{
  "booking_id": "abc-123",
  "additional_hours": 2
}
```

**Response**:
```json
{
  "booking_id": "abc-123",
  "new_estimated_checkout": "2026-01-17T15:00:00Z",
  "total_estimated_hours": 5
}
```

**Business Logic**:
- Kiểm tra không có booking khác trong thời gian gia hạn
- Cập nhật `end_at` và `estimated_duration_hours`
- Lưu lịch sử gia hạn trong metadata

### 4. Get Active Bookings (GET /api/v1/bookings/active)
**Mục đích**: Xem tất cả phòng đang được sử dụng

**Response**:
```json
[
  {
    "booking_id": "abc-123",
    "booking_code": "WI-ABC12345",
    "rentable_item": {
      "id": "room-123",
      "code": "P101",
      "base_price": 100000,
      "price_unit": "HOUR"
    },
    "checked_in_at": "2026-01-17T10:00:00Z",
    "estimated_checkout": "2026-01-17T13:00:00Z",
    "duration": {
      "hours": 2,
      "minutes": 30,
      "total_hours": 2.5
    },
    "current_price": 300000,
    "guests": 2,
    "notes": "Khách yêu cầu phòng yên tĩnh",
    "is_walk_in": true
  }
]
```

**Business Logic**:
- Lấy tất cả bookings với status = `CHECKED_IN`
- Tính thời gian đã sử dụng (real-time)
- Tính giá hiện tại dựa trên thời gian đã sử dụng
- Sắp xếp theo thời gian check-in

## Files Created/Modified

### Created
1. `apps/backend/prisma/migrations/20260117_walk_in_bookings/migration.sql`
2. `apps/backend/prisma/migrations/20260117_walk_in_bookings/rollback.sql`
3. `apps/backend/src/modules/ops/booking/dto/quick-checkin.dto.ts`
4. `run-walk-in-migration.ps1`

### Modified
1. `apps/backend/prisma/schema.prisma` - Added walk-in fields to Booking model
2. `apps/backend/src/modules/ops/booking/booking.service.ts` - Added 4 new methods
3. `apps/backend/src/modules/ops/booking/booking.controller.ts` - Added 4 new endpoints

## Cách chạy Migration

### Option 1: Sử dụng PowerShell script (Khuyến nghị)
```powershell
.\run-walk-in-migration.ps1
```

### Option 2: Manual
```powershell
# 1. Run SQL migration
cd apps/backend
psql $DATABASE_URL -f prisma/migrations/20260117_walk_in_bookings/migration.sql

# 2. Generate Prisma Client
npx prisma generate

# 3. Restart backend
npm run dev
```

## Testing Phase 1

### Test 1: Quick Check-in
```powershell
$token = "YOUR_LANDLORD_TOKEN"
$body = @{
    rentable_item_id = "YOUR_ROOM_ID"
    guests = 2
    estimated_duration_hours = 3
    notes = "Test walk-in"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/quick-checkin" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body
```

### Test 2: Get Active Bookings
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/active" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### Test 3: Check-out
```powershell
$body = @{
    booking_id = "BOOKING_ID_FROM_CHECKIN"
    notes = "Test checkout"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/bookings/checkout" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body
```

## Security & Authorization

Tất cả walk-in endpoints yêu cầu:
- JWT token hợp lệ
- Role: `Landlord`, `PropertyManager`, hoặc `OrgAdmin`
- Chỉ có thể thao tác với bookings trong org của mình

## Next Steps - Phase 2

Phase 2 sẽ triển khai Frontend UI:
1. Trang "Quick Check-in" cho landlord
2. Trang "Active Bookings" với real-time timer
3. Tích hợp vào navigation menu
4. Mobile-responsive design

## Rollback Instructions

Nếu cần rollback migration:
```powershell
cd apps/backend
psql $DATABASE_URL -f prisma/migrations/20260117_walk_in_bookings/rollback.sql
npx prisma generate
```

## Status
✅ **PHASE 1 COMPLETE** - Backend infrastructure ready for walk-in bookings

**Ready for Phase 2**: Frontend UI implementation
