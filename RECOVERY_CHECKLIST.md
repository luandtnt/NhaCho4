# ✅ CHECKLIST KHÔI PHỤC DỮ LIỆU

## 📋 TRƯỚC KHI BẮT ĐẦU

- [ ] Đọc file `CHAY_SCRIPT_NAY.txt` để hiểu tổng quan
- [ ] Quyết định dùng Option 1 (restore) hay Option 2 (reset)
- [ ] Backup database hiện tại (nếu cần)

---

## 🔧 BƯỚC 1: CHUẨN BỊ

- [ ] Stop backend (Ctrl+C trong terminal backend)
- [ ] Kiểm tra Docker containers đang chạy: `docker-compose ps`
- [ ] Đảm bảo PostgreSQL đang chạy

---

## 🚀 BƯỚC 2: CHẠY RECOVERY SCRIPT

### Option A: Restore (không xóa database)
- [ ] Chạy: `.\restore-all-data.ps1`
- [ ] Xác nhận khi được hỏi
- [ ] Đợi script chạy xong (~30 giây)
- [ ] Kiểm tra output có lỗi không

### Option B: Reset & Restore (xóa hết - KHUYẾN NGHỊ)
- [ ] Chạy: `.\reset-and-restore-all.ps1`
- [ ] Xác nhận lần 1: gõ "yes"
- [ ] Xác nhận lần 2: gõ "DELETE ALL"
- [ ] Đợi script chạy xong (~1-2 phút)
- [ ] Kiểm tra output có lỗi không

---

## ✅ BƯỚC 3: KIỂM TRA KẾT QUẢ

### 3.1. Kiểm tra Console Output
- [ ] Thấy "✅ KHÔI PHỤC DỮ LIỆU THÀNH CÔNG!"
- [ ] Thấy summary: 3 Listings, 3 Bookings, 2 Agreements, etc.
- [ ] Không có error messages màu đỏ

### 3.2. Khởi động Backend
- [ ] Mở terminal mới
- [ ] Chạy: `cd apps/backend`
- [ ] Chạy: `pnpm start:dev`
- [ ] Đợi backend khởi động (~10 giây)
- [ ] Thấy "Nest application successfully started"

### 3.3. Khởi động Frontend
- [ ] Mở terminal mới
- [ ] Chạy: `cd apps/frontend`
- [ ] Chạy: `pnpm dev`
- [ ] Đợi frontend khởi động (~5 giây)
- [ ] Thấy "Local: http://localhost:5173"

---

## 🔍 BƯỚC 4: KIỂM TRA FRONTEND

### 4.1. Đăng nhập
- [ ] Truy cập: http://localhost:5173
- [ ] Đăng nhập với: landlord@example.com / Password123!
- [ ] Đăng nhập thành công

### 4.2. Kiểm tra Listings Page
- [ ] Vào trang Listings
- [ ] Thấy 3 tin đăng:
  - [ ] Căn hộ 2PN full nội thất tại Ba Đình
  - [ ] Căn hộ 3PN cao cấp tại Ba Đình
  - [ ] Căn hộ 2PN tầng 2 tại Ba Đình
- [ ] Mỗi listing có đầy đủ thông tin (giá, địa chỉ, ảnh)

### 4.3. Kiểm tra Bookings Page
- [ ] Vào trang Bookings
- [ ] Thấy 3 bookings:
  - [ ] 1 booking CONFIRMED
  - [ ] 1 booking CHECKED_IN (walk-in)
  - [ ] 1 booking COMPLETED
- [ ] Mỗi booking có đầy đủ thông tin

### 4.4. Kiểm tra Agreements Page
- [ ] Vào trang Agreements
- [ ] Thấy 2 agreements:
  - [ ] AG-202601-00001 (ACTIVE)
  - [ ] AG-202601-00002 (DRAFT)
- [ ] Click vào agreement ACTIVE
- [ ] Thấy đầy đủ thông tin: tenant, unit, pricing, dates
- [ ] Thấy nút "Xem hợp đồng" hoặc "Contract Preview"

### 4.5. Kiểm tra Invoices Page
- [ ] Vào trang Invoices
- [ ] Thấy 3 invoices:
  - [ ] INV-202601-00001 (ISSUED)
  - [ ] INV-202512-00015 (PAID)
  - [ ] INV-202602-00001 (DRAFT)
- [ ] Click vào invoice ISSUED
- [ ] Thấy line items: Rent, Service Fee, Management Fee, Parking, Internet
- [ ] Tổng tiền đúng: 14,410,000 VND (có VAT 10%)

### 4.6. Kiểm tra Pricing Policies Page
- [ ] Vào trang Pricing Policies
- [ ] Thấy 2 policies:
  - [ ] Chính sách giá Chung cư Hà Nội - Trung hạn
  - [ ] Chính sách giá Chung cư cao cấp - Trung hạn
- [ ] Mỗi policy có đầy đủ thông tin

---

## 🧪 BƯỚC 5: KIỂM TRA API (OPTIONAL)

### 5.1. Lấy JWT Token
- [ ] Login qua API hoặc copy từ browser DevTools
- [ ] Lưu token vào biến: `$token = "YOUR_TOKEN"`

### 5.2. Test APIs
```powershell
# Listings
curl http://localhost:3000/api/v1/listings -H "Authorization: Bearer $token"

# Bookings
curl http://localhost:3000/api/v1/bookings -H "Authorization: Bearer $token"

# Agreements
curl http://localhost:3000/api/v1/agreements -H "Authorization: Bearer $token"

# Invoices
curl http://localhost:3000/api/v1/invoices -H "Authorization: Bearer $token"

# Pricing Policies
curl http://localhost:3000/api/v1/pricing-policies -H "Authorization: Bearer $token"
```

- [ ] Tất cả APIs trả về 200 OK
- [ ] Dữ liệu trả về đúng format
- [ ] Số lượng records đúng

---

## 🎯 BƯỚC 6: KIỂM TRA TENANT VIEW

### 6.1. Đăng nhập Tenant
- [ ] Logout khỏi landlord account
- [ ] Đăng nhập với: tenant@example.com / Password123!

### 6.2. Kiểm tra Tenant Pages
- [ ] Vào "My Bookings" - thấy bookings của tenant
- [ ] Vào "My Agreements" - thấy agreement ACTIVE
- [ ] Vào "My Invoices" - thấy 3 invoices
- [ ] Tenant chỉ thấy dữ liệu của mình (tenant isolation)

---

## ✅ HOÀN THÀNH

Nếu tất cả các bước trên đều ✅, nghĩa là:

### 🎉 KHÔI PHỤC THÀNH CÔNG!

- ✅ Database đã được khôi phục đầy đủ
- ✅ Tất cả modules hoạt động bình thường
- ✅ Frontend hiển thị dữ liệu từ database
- ✅ APIs hoạt động đúng
- ✅ Tenant isolation hoạt động

### 🚀 TIẾP THEO

Bạn có thể:
1. Tiếp tục phát triển Invoice Module Phase 2-4
2. Test các tính năng khác
3. Thêm dữ liệu mới nếu cần

---

## ❌ NẾU GẶP VẤN ĐỀ

### Backend không khởi động
- [ ] Kiểm tra Docker: `docker-compose ps`
- [ ] Restart Docker: `docker-compose restart`
- [ ] Kiểm tra logs: `docker-compose logs postgres`

### Frontend không hiển thị dữ liệu
- [ ] Kiểm tra Network tab trong DevTools
- [ ] Kiểm tra API có trả về 200 không
- [ ] Kiểm tra JWT token còn valid không

### Script báo lỗi
- [ ] Đọc error message
- [ ] Xem `DATA_RECOVERY_GUIDE.md` - Troubleshooting section
- [ ] Chạy: `pnpm -C apps/backend prisma migrate deploy`
- [ ] Thử chạy lại script

### Dữ liệu không đúng
- [ ] Chạy `.\reset-and-restore-all.ps1` để reset hoàn toàn
- [ ] Kiểm tra console output có lỗi không
- [ ] Kiểm tra database: `pnpm -C apps/backend prisma studio`

---

## 📚 TÀI LIỆU THAM KHẢO

- `CHAY_SCRIPT_NAY.txt` - Quick reference
- `KHOI_PHUC_DU_LIEU.md` - Hướng dẫn ngắn gọn
- `DATA_RECOVERY_GUIDE.md` - Hướng dẫn chi tiết
- `DATA_LOSS_RECOVERY_COMPLETE.md` - Báo cáo đầy đủ
- `DATA_RECOVERY_SUMMARY.md` - Tóm tắt

---

**Lưu ý:** In checklist này ra và đánh dấu từng bước để đảm bảo không bỏ sót!
