# 🚀 TEST BOOKING SYSTEM NGAY

## Bước 1: Start servers (2 terminals)

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```
Đợi thấy: "Application is running on..."

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```
Đợi thấy: "Local: http://localhost:5173"

## Bước 2: Login

1. Mở browser: http://localhost:5173/login
2. Login với tài khoản tenant

## Bước 3: Test Booking Flow

### 3.1. Vào Discover Page
- URL: http://localhost:5173/discover
- ✅ Thấy danh sách listings

### 3.2. Chọn listing SHORT_TERM
- Tìm listing có tag: "Homestay", "Hotel", "Guesthouse", hoặc "Villa"
- Click "Xem chi tiết"

### 3.3. Click "Đặt phòng"
- Scroll xuống phần CTA (bên phải)
- Click button "Đặt ngay" hoặc "Gửi yêu cầu"
- ✅ Navigate to booking page

### 3.4. Điền form booking

**Dates:**
- Chọn ngày nhận phòng (ngày mai)
- Chọn ngày trả phòng (3 ngày sau)
- ✅ Thấy "Tổng số đêm: 3 đêm"
- ✅ Thấy "Còn trống" (màu xanh)
- ✅ Thấy "Chi tiết giá" với breakdown

**Guests:**
- Tăng/giảm số người lớn
- Tăng/giảm số trẻ em
- ✅ Thấy giá thay đổi

**Contact:**
- Họ tên: "Nguyễn Văn A"
- SĐT: "0912345678"
- Email: "test@example.com" (optional)

**Policies:**
- ✅ Check "Tôi đồng ý với nội quy nhà"
- ✅ Check "Tôi hiểu và đồng ý với chính sách hủy"

### 3.5. Submit
- Click "Đặt ngay" hoặc "Gửi yêu cầu đặt phòng"
- ✅ Thấy loading "Đang xử lý..."
- ✅ Thấy alert thành công với booking code
- ✅ Navigate to /my-bookings

## Kết quả mong đợi

✅ Booking được tạo thành công
✅ Có booking code (ví dụ: BK12345678)
✅ Status: "Đã xác nhận" (instant_booking) hoặc "Chờ xác nhận"

## Nếu có lỗi

### Lỗi: "Không tìm thấy tin đăng"
→ Listing không tồn tại, chọn listing khác

### Lỗi: "Không còn trống"
→ Dates đã có booking, chọn dates khác

### Lỗi: "Vượt quá sức chứa"
→ Giảm số khách

### Lỗi: "Số điện thoại không đúng định dạng"
→ Nhập đúng format VN: 0912345678

### Lỗi: "Vui lòng đồng ý với chính sách"
→ Check cả 2 checkboxes

## Test nhanh Backend APIs (Optional)

```powershell
.\quick-test-booking-apis.ps1
```

Hoặc test manual với Postman/Thunder Client:

**1. Check Availability:**
```
POST http://localhost:3000/api/v1/bookings/check-availability
Body: {
  "rentable_item_id": "<your_id>",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "quantity": 1
}
```

**2. Calculate Price:**
```
POST http://localhost:3000/api/v1/bookings/calculate-price
Body: {
  "rentable_item_id": "<your_id>",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "guests": {
    "adults": 2,
    "children": 1
  }
}
```

**3. Create Booking:**
```
POST http://localhost:3000/api/v1/bookings/create-enhanced
Headers: {
  "Authorization": "Bearer <your_token>"
}
Body: {
  "rentable_item_id": "<your_id>",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "guests": {
    "adults": 2,
    "children": 1
  },
  "contact": {
    "full_name": "Nguyen Van A",
    "phone": "0912345678",
    "email": "test@example.com"
  },
  "pricing": {
    "total": 10000000,
    "breakdown": {}
  },
  "policies_accepted": true
}
```

## Checklist

- [ ] Backend running
- [ ] Frontend running
- [ ] Login thành công
- [ ] Discover page hiển thị listings
- [ ] Listing detail page hoạt động
- [ ] Booking page load thành công
- [ ] Date selection hoạt động
- [ ] Guest selection hoạt động
- [ ] Price calculation realtime
- [ ] Availability check realtime
- [ ] Contact form validation
- [ ] Policies checkboxes
- [ ] Submit booking thành công
- [ ] Navigate to my-bookings

## Thành công! 🎉

Nếu tất cả checklist ✅ → Hệ thống booking hoạt động hoàn hảo!

Bạn có thể:
1. Test thêm các edge cases (xem TEST_PHASE2_GUIDE.md)
2. Deploy lên staging
3. Implement Phase 3 (Payment) nếu cần
