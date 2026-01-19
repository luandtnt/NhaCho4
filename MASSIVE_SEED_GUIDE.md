# 🚀 MASSIVE SEED - 210 BẤT ĐỘNG SẢN

## 📋 Tổng Quan

Script này sẽ tạo **210 bất động sản** thuộc **21 loại hình** khác nhau, cùng với tất cả dữ liệu liên quan (agreements, bookings, invoices, v.v.)

---

## 📦 DỮ LIỆU SẼ ĐƯỢC TẠO

### 21 Loại Hình Bất Động Sản

#### Ngắn hạn (SHORT_TERM) - 7 loại x 10 items = 70 items
1. **Khách sạn** (HOTEL) - 500K-3M VND/đêm
2. **Homestay** (HOMESTAY) - 300K-1.5M VND/đêm
3. **Villa nghỉ dưỡng** (VACATION_VILLA) - 2M-10M VND/đêm
4. **Căn hộ dịch vụ ngắn hạn** (SERVICED_APARTMENT_SHORT) - 800K-3M VND/đêm
5. **Nhà nghỉ** (MOTEL) - 200K-800K VND/đêm
6. **Resort** (RESORT) - 3M-15M VND/đêm
7. **Coworking theo giờ** (COWORKING_HOURLY) - 50K-200K VND/giờ

#### Trung hạn (MID_TERM) - 7 loại x 10 items = 70 items
8. **Chung cư** (APARTMENT) - 5M-30M VND/tháng
9. **Phòng trọ** (ROOM) - 1.5M-5M VND/tháng
10. **Nhà riêng** (HOUSE) - 8M-40M VND/tháng
11. **Căn hộ dịch vụ trung hạn** (SERVICED_APARTMENT_MID) - 10M-50M VND/tháng
12. **Studio** (STUDIO) - 4M-15M VND/tháng
13. **Penthouse** (PENTHOUSE) - 30M-100M VND/tháng
14. **Nhà nguyên căn** (WHOLE_HOUSE) - 10M-50M VND/tháng

#### Dài hạn (LONG_TERM) - 7 loại x 10 items = 70 items
15. **Văn phòng** (OFFICE) - 15M-100M VND/tháng
16. **Mặt bằng kinh doanh** (RETAIL_SPACE) - 20M-150M VND/tháng
17. **Nhà xưởng** (WAREHOUSE) - 30M-200M VND/tháng
18. **Đất nền** (LAND) - 10M-100M VND/tháng
19. **Biệt thự** (VILLA) - 40M-200M VND/tháng
20. **Shophouse** (SHOPHOUSE) - 25M-150M VND/tháng
21. **Tòa nhà thương mại** (COMMERCIAL_BUILDING) - 100M-500M VND/tháng

### Dữ Liệu Liên Quan

- **21 Pricing Policies** - 1 policy cho mỗi loại hình
- **210 Rentable Items** - Đầy đủ thông tin (địa chỉ, giá, tiện ích)
- **210 Listings** - Tất cả PUBLISHED
- **~50 Agreements** - Mix ACTIVE, DRAFT, EXPIRED, TERMINATED
- **~100 Bookings** - Mix CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
- **~150 Invoices** - Mix ISSUED, PAID, DRAFT, OVERDUE
- **Payments** - Cho tất cả invoices đã PAID
- **Notifications** - Thông báo cho users
- **Leads** - Khách hàng tiềm năng

---

## 🚀 CÁCH CHẠY

### Bước 1: Stop Backend
```powershell
# Ctrl+C trong terminal backend
```

### Bước 2: Chạy Script
```powershell
.\reset-and-restore-massive.ps1
```

### Bước 3: Xác nhận
- Gõ "yes" để xác nhận

### Bước 4: Đợi (~3-5 phút)
Script sẽ:
1. Xóa database hiện tại
2. Chạy lại migrations
3. Tạo 210 bất động sản + dữ liệu liên quan

### Bước 5: Khởi động lại
```powershell
# Terminal 1: Backend
cd apps/backend
pnpm start:dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

---

## 📊 CHI TIẾT DỮ LIỆU

### Địa Điểm
Bất động sản được phân bố ở các tỉnh/thành:
- **Hà Nội** - 8 quận
- **TP.HCM** - 8 quận
- **Đà Nẵng** - 5 quận
- **Hải Phòng** - 5 quận
- **Đà Lạt, Sapa, Vũng Tàu, Phú Quốc, Nha Trang** - Các phường
- **Bắc Ninh, Bình Dương, Đồng Nai** - Các huyện

### Giá Cả
- Giá được random trong khoảng phù hợp với từng loại hình
- Giá thực tế theo thị trường Việt Nam
- Đơn vị: VND

### Thông Tin Đầy Đủ
Mỗi rentable item có:
- ✅ Địa chỉ đầy đủ (tỉnh, quận, phường, đường)
- ✅ Diện tích (m²)
- ✅ Số phòng ngủ, phòng tắm
- ✅ Hướng nhà
- ✅ Tiện ích (wifi, điều hòa, máy giặt...)
- ✅ Giá thuê, đặt cọc, phí dịch vụ
- ✅ Chính sách giá liên kết
- ✅ Trạng thái ACTIVE

---

## ✅ KIỂM TRA SAU KHI CHẠY

### 1. Đăng nhập
- Truy cập: http://localhost:5173
- Đăng nhập: landlord@example.com / Password123!

### 2. Kiểm tra Listings Page
- Phải thấy 210 tin đăng
- Filter theo loại hình: phải thấy 10 items mỗi loại
- Filter theo tỉnh/thành: phải có kết quả

### 3. Kiểm tra Rentable Items
- Mỗi item có đầy đủ thông tin
- Địa chỉ đầy đủ
- Giá cả hợp lý

### 4. Kiểm tra Agreements
- Phải thấy ~50 agreements
- Mix các trạng thái: ACTIVE, DRAFT, EXPIRED, TERMINATED
- Chỉ cho MID_TERM và LONG_TERM properties

### 5. Kiểm tra Bookings
- Phải thấy ~100 bookings
- Mix các trạng thái
- Chỉ cho SHORT_TERM properties

### 6. Kiểm tra Invoices
- Phải thấy ~150 invoices
- Mix các trạng thái: ISSUED, PAID, DRAFT, OVERDUE
- Mỗi invoice có line items đầy đủ

### 7. Kiểm tra Pricing Policies
- Phải thấy 21 policies
- 1 policy cho mỗi loại hình
- Giá cả phù hợp

---

## 🔧 TROUBLESHOOTING

### Script chạy lâu
- Bình thường! Tạo 210 items + relationships mất 3-5 phút
- Đợi cho đến khi thấy "✅ MASSIVE SEEDING THÀNH CÔNG!"

### Out of memory
- Tăng Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Hoặc giảm số items xuống (sửa loop từ 10 xuống 5)

### Database connection timeout
- Kiểm tra Docker: `docker-compose ps`
- Restart PostgreSQL: `docker-compose restart postgres`

### Duplicate key errors
- Database chưa được reset sạch
- Chạy lại script từ đầu

---

## 📈 PERFORMANCE

### Thời Gian
- Reset database: ~10 giây
- Seed 210 items: ~3-5 phút
- Tổng: ~5 phút

### Database Size
- ~210 rentable items
- ~210 listings
- ~50 agreements
- ~100 bookings
- ~150 invoices
- ~450 invoice line items
- Tổng: ~1200 records

### Memory Usage
- Node.js: ~500MB
- PostgreSQL: ~200MB

---

## 💡 LƯU Ý

### Về Dữ Liệu
- Tất cả dữ liệu là **dữ liệu thực từ database**
- Không có mock data
- Frontend lấy dữ liệu từ API
- Địa chỉ, tên, giá cả thực tế

### Về Performance
- 210 items là số lượng lớn
- Pagination rất quan trọng
- Sử dụng filters để tìm kiếm
- Index đã được tối ưu

### Về Testing
- Dữ liệu này phù hợp cho:
  - Load testing
  - Performance testing
  - UI/UX testing với nhiều data
  - Demo cho khách hàng

---

## 🎯 USE CASES

### 1. Development
- Test với nhiều loại hình BĐS
- Test pagination, filters, search
- Test performance với data lớn

### 2. Demo
- Show đầy đủ 21 loại hình
- Demo cho khách hàng
- Presentation

### 3. Testing
- Load testing
- Stress testing
- Integration testing

---

## 📚 FILES

### Seed Script
- `apps/backend/prisma/seed-massive.ts` - Main seed script

### PowerShell Scripts
- `reset-and-restore-massive.ps1` - Reset & seed massive data

### Documentation
- `MASSIVE_SEED_GUIDE.md` - This file

---

## 🔑 LOGIN

```
Landlord: landlord@example.com / Password123!
Tenant:   tenant@example.com / Password123!
```

---

## 🎉 KẾT LUẬN

Sau khi chạy script, bạn sẽ có:
- ✅ 210 bất động sản thuộc 21 loại hình
- ✅ Đầy đủ dữ liệu liên quan
- ✅ Sẵn sàng cho development, testing, demo

**Thời gian:** ~5 phút  
**Kết quả:** Database đầy đủ với 1200+ records

---

**Prepared by:** Kiro AI  
**Date:** 2026-01-19  
**Version:** 1.0
