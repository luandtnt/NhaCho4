# 🧪 TEST AVAILABILITY CALENDAR

## Quick Test

### 1. Start servers
```bash
# Terminal 1
cd apps/backend && npm run dev

# Terminal 2
cd apps/frontend && npm run dev
```

### 2. Navigate to booking page
1. http://localhost:5173/discover
2. Click vào listing SHORT_TERM
3. Click "Đặt phòng"
4. Scroll xuống → Thấy "Lịch trống"

### 3. Test 4 view modes

#### ✅ Giờ (Hour View)
- Click tab "Giờ"
- Thấy 24 khung giờ (00:00 → 23:00)
- Mỗi khung có màu:
  - 🟢 Xanh = Còn trống
  - 🔴 Đỏ = Đã đặt (+ tên khách)
- Click ◀️ → Lùi 1 ngày
- Click ▶️ → Tiến 1 ngày

#### ✅ Ngày (Day View)
- Click tab "Ngày"
- Thấy 7 ngày trong tuần (layout dọc)
- Mỗi row: Thứ - Ngày/Tháng | Trạng thái | Dot
- Ngày hôm nay có ring xanh
- Mỗi ngày có màu xanh/đỏ
- Click ◀️ → Lùi 1 tuần
- Click ▶️ → Tiến 1 tuần

#### ✅ Tuần (Week View)
- Click tab "Tuần"
- Thấy 4-5 tuần trong tháng
- Mỗi tuần hiển thị date range
- Mỗi tuần có màu xanh/đỏ
- Click ◀️ → Lùi 1 tháng
- Click ▶️ → Tiến 1 tháng

#### ✅ Tháng (Month View)
- Click tab "Tháng"
- Thấy 12 tháng (grid 3x4)
- Tháng hiện tại có ring xanh
- Mỗi tháng có màu xanh/đỏ
- Click ◀️ → Lùi 1 năm
- Click ▶️ → Tiến 1 năm

### 4. Test với booking thật

#### Tạo booking:
1. Chọn dates (ví dụ: ngày mai → 3 ngày sau)
2. Điền form đầy đủ
3. Check policies
4. Submit booking
5. ✅ Booking created

#### Verify calendar:
1. Quay lại booking page (hoặc refresh)
2. Xem calendar
3. ✅ Verify: Dates đã chọn hiển thị màu đỏ
4. ✅ Verify: Hiển thị tên khách
5. Switch giữa các view modes
6. ✅ Verify: Tất cả views đều hiển thị đúng

## Test API trực tiếp

### Postman/Thunder Client:

```
GET http://localhost:3000/api/v1/bookings/timeline/{rentableItemId}?start_date=2024-02-01T00:00:00Z&end_date=2024-02-29T23:59:59Z
```

**Expected Response:**
```json
{
  "rentable_item_id": "...",
  "start_date": "2024-02-01T00:00:00Z",
  "end_date": "2024-02-29T23:59:59Z",
  "bookings": [
    {
      "id": "...",
      "booking_code": "BK12345678",
      "start_at": "2024-02-10T14:00:00Z",
      "end_at": "2024-02-13T12:00:00Z",
      "status": "CONFIRMED",
      "quantity": 1,
      "guest_name": "Nguyen Van A"
    }
  ]
}
```

## Checklist

### UI/UX:
- [ ] Calendar hiển thị đẹp
- [ ] 4 tabs hoạt động
- [ ] Navigation buttons hoạt động
- [ ] Colors đúng (xanh/đỏ)
- [ ] Legend hiển thị
- [ ] Loading state mượt
- [ ] Responsive (mobile/tablet)

### Functionality:
- [ ] Hour view: 24 giờ
- [ ] Day view: 7 ngày
- [ ] Week view: 4-5 tuần
- [ ] Month view: 12 tháng
- [ ] Navigation: Previous/Next
- [ ] Highlight: Today/Current month
- [ ] Guest name hiển thị

### Data:
- [ ] API call thành công
- [ ] Bookings load đúng
- [ ] Dates calculate đúng
- [ ] Overlap detection đúng
- [ ] Status filter đúng (PENDING/CONFIRMED)

### Edge Cases:
- [ ] Không có booking → Tất cả xanh
- [ ] Có nhiều bookings → Hiển thị đúng
- [ ] Booking overlap → Detect đúng
- [ ] Past dates → Hiển thị đúng
- [ ] Future dates → Hiển thị đúng

## Expected Results

✅ **Hour View:**
- 24 rows, mỗi row = 1 giờ
- Màu xanh/đỏ rõ ràng
- Tên khách hiển thị nếu đã đặt

✅ **Day View:**
- 7 rows, mỗi row = 1 ngày
- Layout dọc giống Hour View
- Format: Thứ - DD/MM | Trạng thái | Dot
- Today có ring xanh
- Tên khách hiển thị nếu đã đặt

✅ **Week View:**
- 4-5 rows, mỗi row = 1 tuần
- Date range hiển thị
- List layout rõ ràng

✅ **Month View:**
- 12 boxes, grid 3x4
- Current month có ring xanh
- Compact layout

## Troubleshooting

### Lỗi: "Cannot fetch bookings"
→ Check backend running
→ Check rentableItemId đúng

### Lỗi: "Calendar không hiển thị bookings"
→ Check dates trong range
→ Check booking status (PENDING/CONFIRMED)

### Lỗi: "Colors không đúng"
→ Check isTimeSlotBooked() logic
→ Check date overlap calculation

### Lỗi: "Navigation không hoạt động"
→ Check navigatePrevious/Next logic
→ Check date calculations

## Success! 🎉

Nếu tất cả tests PASS → Availability Calendar hoạt động hoàn hảo!

User có thể:
- ✅ Xem tình trạng phòng theo giờ/ngày/tuần/tháng
- ✅ Navigate qua lại các khung thời gian
- ✅ Thấy rõ slot nào còn trống, slot nào đã đặt
- ✅ Biết tên khách đã đặt

Perfect for planning bookings! 📅
