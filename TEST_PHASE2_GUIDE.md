# 🧪 HƯỚNG DẪN TEST PHASE 2: BOOKING PAGE

## Chuẩn bị

### 1. Start Backend
```bash
cd apps/backend
npm run dev
```

### 2. Start Frontend
```bash
cd apps/frontend
npm run dev
```

### 3. Login
- Truy cập: http://localhost:5173/login
- Login với tài khoản tenant

## Test Flow Chính

### BƯỚC 1: Vào Discover Page
1. Navigate to http://localhost:5173/discover
2. ✅ Verify: Hiển thị danh sách listings
3. ✅ Verify: Có pagination

### BƯỚC 2: Chọn Listing SHORT_TERM
1. Tìm một listing có tag "Homestay", "Hotel", "Guesthouse", hoặc "Villa"
2. Click "Xem chi tiết"
3. ✅ Verify: Navigate to `/listings/:id`
4. ✅ Verify: Hiển thị đầy đủ thông tin listing

### BƯỚC 3: Click "Đặt phòng"
1. Scroll xuống phần CTA (bên phải)
2. Click button "Đặt ngay lập tức" hoặc "Gửi yêu cầu đặt phòng"
3. ✅ Verify: Navigate to `/booking/:listingId/:rentableItemId`
4. ✅ Verify: URL có đúng IDs
5. ✅ Verify: Page load thành công

### BƯỚC 4: Test Date Selection
1. **Chọn ngày nhận phòng**:
   - Click vào input "Ngày nhận phòng"
   - Chọn một ngày trong tương lai (ví dụ: ngày mai)
   - ✅ Verify: Ngày được chọn

2. **Chọn ngày trả phòng**:
   - Click vào input "Ngày trả phòng"
   - Chọn ngày sau ngày nhận phòng (ví dụ: 3 ngày sau)
   - ✅ Verify: Ngày được chọn

3. **Kiểm tra tự động**:
   - ✅ Verify: Hiển thị "Tổng số đêm: X đêm"
   - ✅ Verify: Hiển thị giờ check-in/check-out (nếu có)
   - ✅ Verify: Xuất hiện loading "Đang kiểm tra tình trạng..."
   - ✅ Verify: Sau đó hiển thị "Còn trống" hoặc "Không còn trống"
   - ✅ Verify: Xuất hiện loading "Đang tính giá..."
   - ✅ Verify: Sau đó hiển thị "Chi tiết giá"

4. **Test Min Duration** (nếu có):
   - Nếu listing có min_rent_duration (ví dụ: 2 đêm)
   - Chọn chỉ 1 đêm
   - ✅ Verify: Hiển thị warning "Phải thuê tối thiểu X đêm"

### BƯỚC 5: Test Guest Selection
1. **Thay đổi số người lớn**:
   - Click nút "+" để tăng
   - Click nút "-" để giảm
   - ✅ Verify: Số thay đổi đúng
   - ✅ Verify: Không giảm xuống dưới 1
   - ✅ Verify: Price recalculate

2. **Thay đổi số trẻ em**:
   - Click nút "+" để tăng
   - ✅ Verify: Số thay đổi đúng
   - ✅ Verify: Price recalculate (nếu có extra_guest_fee)

3. **Thay đổi số em bé**:
   - Click nút "+" để tăng
   - ✅ Verify: Số thay đổi đúng

4. **Test Max Occupancy**:
   - Tăng tổng số khách vượt max_occupancy
   - ✅ Verify: Hiển thị warning "Vượt quá sức chứa"
   - ✅ Verify: Hiển thị "Số khách vượt quá giới hạn cho phép"

### BƯỚC 6: Test Price Breakdown
1. ✅ Verify: Hiển thị "Chi tiết giá"
2. ✅ Verify: Có breakdown items:
   - Giá cơ bản (X ₫ x Y đêm)
   - Phí dọn dẹp (nếu có)
   - Phụ thu thêm người (nếu có)
   - Phụ thu cuối tuần (nếu có)
   - Phí dịch vụ (nếu có)
   - Giảm giá (nếu có)
3. ✅ Verify: Hiển thị "Tổng cộng" với số tiền lớn màu xanh
4. ✅ Verify: Format giá đúng: "12.000.000 ₫"
5. ✅ Verify: Hiển thị summary (số đêm, giá cơ bản)

### BƯỚC 7: Test Contact Form
1. **Họ tên**:
   - Điền "Nguyễn Văn A"
   - ✅ Verify: Input hoạt động

2. **Số điện thoại**:
   - Điền "0912345678"
   - ✅ Verify: Input hoạt động
   - Điền "123" (sai format)
   - ✅ Verify: Hiển thị error "Số điện thoại không đúng định dạng"

3. **Email** (optional):
   - Điền "test@example.com"
   - ✅ Verify: Input hoạt động

4. **Yêu cầu đặc biệt** (optional):
   - Điền "Nhận phòng muộn"
   - ✅ Verify: Textarea hoạt động

### BƯỚC 8: Test Policies
1. ✅ Verify: Hiển thị "Chính sách & Nội quy"
2. ✅ Verify: Hiển thị nội quy nhà:
   - Cho phép thú cưng (✓ hoặc ✗)
   - Cho phép hút thuốc (✓ hoặc ✗)
   - Giờ yên tĩnh (nếu có)
   - House rules text (nếu có)
3. ✅ Verify: Hiển thị chính sách hủy
4. ✅ Verify: Có 2 checkboxes:
   - "Tôi đồng ý với nội quy nhà"
   - "Tôi hiểu và đồng ý với chính sách hủy"
5. Check cả 2 checkboxes
6. ✅ Verify: Warning biến mất

### BƯỚC 9: Test Summary Card (Bên phải)
1. ✅ Verify: Card sticky khi scroll
2. ✅ Verify: Hiển thị ảnh listing
3. ✅ Verify: Hiển thị tên listing
4. ✅ Verify: Hiển thị địa chỉ
5. ✅ Verify: Hiển thị thời gian:
   - Nhận phòng: DD/MM/YYYY
   - Trả phòng: DD/MM/YYYY
   - Tổng: X đêm
6. ✅ Verify: Hiển thị khách:
   - Tổng số khách: X người
   - Chi tiết: X người lớn, Y trẻ em, Z em bé
7. ✅ Verify: Hiển thị price summary
8. ✅ Verify: Nếu instant_booking → Hiển thị badge "⚡ Đặt phòng tức thì"

### BƯỚC 10: Test Submit Booking
1. **Kiểm tra button state**:
   - Nếu chưa check policies → Button disabled
   - Nếu availability = false → Button disabled
   - Nếu đã check policies + available → Button enabled

2. **Click button**:
   - Click "Đặt ngay" (instant_booking) hoặc "Gửi yêu cầu đặt phòng"
   - ✅ Verify: Button hiển thị loading "Đang xử lý..."
   - ✅ Verify: Sau vài giây hiển thị alert thành công
   - ✅ Verify: Alert có booking code
   - ✅ Verify: Alert có status (Đã xác nhận / Chờ xác nhận)
   - ✅ Verify: Navigate to `/my-bookings`

## Test Cases Đặc Biệt

### TEST 1: Booking Conflict
1. Chọn dates đã có booking khác
2. ✅ Verify: Availability = false
3. ✅ Verify: Hiển thị "Không còn trống"
4. ✅ Verify: Hiển thị gợi ý ngày khác
5. ✅ Verify: Button disabled

### TEST 2: Min Duration Violation
1. Chọn số đêm < min_rent_duration
2. ✅ Verify: Hiển thị warning
3. ✅ Verify: Vẫn có thể submit (backend sẽ validate)

### TEST 3: Max Occupancy Violation
1. Chọn số khách > max_occupancy
2. ✅ Verify: Hiển thị warning
3. ✅ Verify: Vẫn có thể submit (backend sẽ reject)

### TEST 4: Invalid Phone
1. Điền số điện thoại sai format
2. ✅ Verify: Hiển thị error message
3. Click submit
4. ✅ Verify: Alert "Vui lòng điền đầy đủ thông tin"

### TEST 5: Missing Required Fields
1. Không điền họ tên
2. Click submit
3. ✅ Verify: Alert "Vui lòng điền đầy đủ thông tin"

### TEST 6: Instant Booking
1. Chọn listing có instant_booking = true
2. ✅ Verify: Button text = "Đặt ngay"
3. ✅ Verify: Có text "⚡ Đặt phòng tức thì - Xác nhận ngay lập tức"
4. Submit booking
5. ✅ Verify: Status = "Đã xác nhận"

### TEST 7: Regular Booking
1. Chọn listing có instant_booking = false
2. ✅ Verify: Button text = "Gửi yêu cầu đặt phòng"
3. Submit booking
4. ✅ Verify: Status = "Chờ xác nhận"

## Test Responsive

### Mobile View (< 768px)
1. Resize browser to mobile size
2. ✅ Verify: Layout chuyển sang 1 cột
3. ✅ Verify: Summary card xuống dưới
4. ✅ Verify: Tất cả components vẫn hoạt động

### Tablet View (768px - 1024px)
1. Resize browser to tablet size
2. ✅ Verify: Layout vẫn 2 cột hoặc responsive tốt
3. ✅ Verify: Tất cả components vẫn hoạt động

## Test Performance

1. **Loading Speed**:
   - ✅ Verify: Page load < 2s
   - ✅ Verify: API calls < 1s

2. **Realtime Updates**:
   - ✅ Verify: Price update ngay khi thay đổi dates/guests
   - ✅ Verify: Availability check ngay khi thay đổi dates

3. **No Memory Leaks**:
   - Navigate qua lại nhiều lần
   - ✅ Verify: Không có memory leak

## Checklist Tổng Hợp

### UI/UX
- [ ] Layout đẹp, responsive
- [ ] Icons hiển thị đúng
- [ ] Colors consistent
- [ ] Typography rõ ràng
- [ ] Spacing hợp lý
- [ ] Loading states mượt mà
- [ ] Error messages rõ ràng

### Functionality
- [ ] Date selection hoạt động
- [ ] Guest selection hoạt động
- [ ] Price calculation đúng
- [ ] Availability check đúng
- [ ] Contact form validation đúng
- [ ] Policies checkboxes hoạt động
- [ ] Submit booking thành công

### Integration
- [ ] API calls thành công
- [ ] Error handling đúng
- [ ] Navigation đúng
- [ ] Data flow đúng

### Edge Cases
- [ ] Handle booking conflict
- [ ] Handle max occupancy
- [ ] Handle min duration
- [ ] Handle invalid input
- [ ] Handle network errors
- [ ] Handle missing data

## Kết quả mong đợi

✅ **TẤT CẢ** test cases phải PASS

Nếu có bất kỳ test case nào FAIL:
1. Ghi lại lỗi chi tiết
2. Screenshot nếu cần
3. Report để fix

## Next Steps

Sau khi Phase 2 test PASS → Có thể:
1. Deploy lên staging
2. User acceptance testing
3. Implement Phase 3 (Payment) nếu cần
4. Implement enhancements (Calendar UI, Voucher, etc.)
