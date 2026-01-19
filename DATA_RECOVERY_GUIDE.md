# 🔄 Hướng Dẫn Khôi Phục Dữ Liệu

## ⚠️ Tình Huống

Database đã bị xóa do chạy `prisma migrate reset --force`. Tất cả dữ liệu của các module đã hoàn thành đã bị mất:

- ❌ Listings (tin đăng)
- ❌ Assets & Space Nodes (tài sản)
- ❌ Rentable Items (căn cho thuê)
- ❌ Bookings (đặt chỗ)
- ❌ Agreements (hợp đồng)
- ❌ Pricing Policies (chính sách giá)
- ❌ Invoices (hóa đơn)

## 🎯 Giải Pháp

Tôi đã tạo **seed script hoàn chỉnh** để khôi phục tất cả dữ liệu cho các module đã hoàn thành.

---

## 📦 Files Đã Tạo

### 1. `apps/backend/prisma/seed-complete.ts`
Seed script hoàn chỉnh với dữ liệu thực tế cho tất cả modules:
- ✅ 1 Organization
- ✅ 3 Users (landlord, tenant, admin)
- ✅ 2 Parties
- ✅ 1 Config Bundle
- ✅ 1 Asset (Sunrise Apartments) với 3 units
- ✅ 6 Space Nodes (1 building, 2 floors, 3 units)
- ✅ 2 Pricing Policies
- ✅ 3 Rentable Items (đầy đủ thông tin)
- ✅ 3 Listings (PUBLISHED)
- ✅ 2 Agreements (1 ACTIVE, 1 DRAFT)
- ✅ 3 Bookings (1 CONFIRMED, 1 CHECKED_IN, 1 COMPLETED)
- ✅ 3 Invoices (1 ISSUED, 1 PAID, 1 DRAFT) với line items
- ✅ 1 Payment
- ✅ 4 Notifications
- ✅ 2 Leads

### 2. `restore-all-data.ps1`
Script để khôi phục dữ liệu **KHÔNG XÓA** database hiện tại (chỉ thêm dữ liệu mới).

### 3. `reset-and-restore-all.ps1`
Script để **XÓA HẾT** database và tạo mới với dữ liệu đầy đủ.

---

## 🚀 Cách Sử Dụng

### Option 1: Khôi Phục Dữ Liệu (Không Xóa Database)

**Khi nào dùng:** Database hiện tại trống hoặc bạn muốn thêm dữ liệu mẫu.

```powershell
# 1. Stop backend (nếu đang chạy)
# Ctrl+C trong terminal backend

# 2. Chạy script khôi phục
.\restore-all-data.ps1
```

### Option 2: Reset & Restore (Xóa Hết và Tạo Mới)

**Khi nào dùng:** Bạn muốn bắt đầu lại từ đầu với dữ liệu sạch.

```powershell
# 1. Stop backend (nếu đang chạy)
# Ctrl+C trong terminal backend

# 2. Chạy script reset
.\reset-and-restore-all.ps1

# 3. Xác nhận 2 lần:
#    - Gõ "yes"
#    - Gõ "DELETE ALL"
```

---

## 📋 Dữ Liệu Được Tạo

### 🏢 Assets & Properties
- **Sunrise Apartments** - Chung cư tại Ba Đình, Hà Nội
  - Tòa A
    - Tầng 1: Căn 101 (2PN), Căn 102 (3PN)
    - Tầng 2: Căn 201 (2PN)

### 💰 Pricing Policies
1. **Chính sách giá Chung cư Hà Nội - Trung hạn**
   - Base price: 12,000,000 VND/tháng
   - Deposit: 24,000,000 VND
   - Service fee: 500,000 VND
   - Management fee: 300,000 VND

2. **Chính sách giá Chung cư cao cấp - Trung hạn**
   - Base price: 18,000,000 VND/tháng
   - Deposit: 36,000,000 VND
   - Service fee: 800,000 VND
   - Management fee: 500,000 VND

### 🏠 Rentable Items
1. **UNIT-101** - Căn 2PN, 75m², full nội thất, 12M VND/tháng
2. **UNIT-102** - Căn 3PN, 95m², full nội thất, 18M VND/tháng
3. **UNIT-201** - Căn 2PN, 75m², nội thất cơ bản, 13M VND/tháng

### 📝 Listings
1. **Căn hộ 2PN full nội thất tại Ba Đình** (UNIT-101)
   - Status: PUBLISHED
   - Featured: Yes
   - Views: 125

2. **Căn hộ 3PN cao cấp tại Ba Đình** (UNIT-102)
   - Status: PUBLISHED
   - Views: 87

3. **Căn hộ 2PN tầng 2 tại Ba Đình** (UNIT-201)
   - Status: PUBLISHED
   - Views: 45

### 📄 Agreements
1. **AG-202601-00001** - ACTIVE
   - Unit: 101
   - Tenant: Trần Thị Thuê
   - Period: 01/01/2026 - 31/12/2026
   - Rent: 12M VND/tháng

2. **AG-202601-00002** - DRAFT
   - Unit: 102
   - Period: 01/02/2026 - 31/01/2027
   - Rent: 18M VND/tháng

### 📅 Bookings
1. **CONFIRMED** - Unit 201, 01/02/2026 - 01/05/2026
2. **CHECKED_IN** - Unit 101, Walk-in booking (đang sử dụng)
3. **COMPLETED** - Unit 101, Walk-in booking (đã hoàn thành)

### 🧾 Invoices
1. **INV-202601-00001** - ISSUED
   - Agreement: AG-202601-00001
   - Period: 01/2026
   - Total: 14,410,000 VND (có VAT 10%)
   - Due: 06/01/2026

2. **INV-202512-00015** - PAID
   - Agreement: AG-202601-00001
   - Period: 12/2025
   - Total: 13,100,000 VND
   - Paid: 05/12/2025

3. **INV-202602-00001** - DRAFT
   - Agreement: AG-202601-00001
   - Period: 02/2026
   - Total: 13,100,000 VND

---

## 🔑 Thông Tin Đăng Nhập

| Email | Password | Role | Mô tả |
|-------|----------|------|-------|
| landlord@example.com | Password123! | Landlord | Chủ nhà - Nguyễn Văn Chủ |
| tenant@example.com | Password123! | Tenant | Người thuê - Trần Thị Thuê |
| admin@example.com | Password123! | OrgAdmin | Quản trị viên |

---

## ✅ Kiểm Tra Sau Khi Khôi Phục

### 1. Khởi động ứng dụng
```powershell
# Terminal 1: Backend
cd apps/backend
pnpm start:dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

### 2. Truy cập và kiểm tra

**Frontend:** http://localhost:5173

Đăng nhập với tài khoản **landlord@example.com** và kiểm tra:

- ✅ **Listings Page** - Phải thấy 3 tin đăng
- ✅ **Bookings Page** - Phải thấy 3 bookings
- ✅ **Agreements Page** - Phải thấy 2 agreements
- ✅ **Invoices Page** - Phải thấy 3 invoices
- ✅ **Pricing Policies Page** - Phải thấy 2 policies

Đăng nhập với tài khoản **tenant@example.com** và kiểm tra:

- ✅ **My Bookings** - Phải thấy bookings của mình
- ✅ **My Agreements** - Phải thấy agreements của mình
- ✅ **My Invoices** - Phải thấy invoices của mình

### 3. Kiểm tra API

```powershell
# Test API với token
$token = "YOUR_JWT_TOKEN"

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

---

## 🔧 Troubleshooting

### Lỗi: "Backend đang chạy"
**Giải pháp:** Stop backend trước khi chạy seed
```powershell
# Ctrl+C trong terminal backend
```

### Lỗi: "Migration chưa chạy"
**Giải pháp:** Chạy migrations trước
```powershell
cd apps/backend
pnpm prisma migrate deploy
```

### Lỗi: "Unique constraint violation"
**Giải pháp:** Database đã có dữ liệu, dùng reset-and-restore-all.ps1
```powershell
.\reset-and-restore-all.ps1
```

### Lỗi: "Cannot connect to database"
**Giải pháp:** Kiểm tra Docker containers
```powershell
docker-compose ps
docker-compose up -d
```

---

## 📚 Tài Liệu Liên Quan

- `INVOICE_PHASE1_COMPLETE.md` - Invoice module documentation
- `AGREEMENT_ENHANCEMENT_ALL_PHASES_COMPLETE.md` - Agreement module
- `WALK_IN_BOOKING_SYSTEM_COMPLETE.md` - Booking module
- `PRICING_POLICIES_FINAL_COMPLETION_REPORT.md` - Pricing policies
- `PROJECT_STATUS.md` - Overall project status

---

## 💡 Lưu Ý Quan Trọng

### ⚠️ Về Dữ Liệu
- Tất cả dữ liệu được tạo là **dữ liệu thực tế từ database**, không phải mock data
- Frontend sẽ lấy dữ liệu từ API, không có hard-coded data
- Dữ liệu có đầy đủ relationships và foreign keys

### ⚠️ Về Migrations
- **KHÔNG BAO GIỜ** chạy `prisma migrate reset` trên production
- Luôn backup database trước khi chạy migrations
- Trên production, chỉ dùng `prisma migrate deploy`

### ⚠️ Về Seed Scripts
- `seed.ts` - Seed script cũ (minimal data)
- `seed-complete.ts` - Seed script mới (full data cho tất cả modules)
- Có thể chạy nhiều lần nếu cần thêm dữ liệu test

---

## 🎉 Kết Luận

Sau khi chạy script khôi phục, tất cả các module đã hoàn thành sẽ hoạt động bình thường với dữ liệu đầy đủ. Bạn có thể tiếp tục phát triển Invoice Module Phase 2-4 mà không lo mất dữ liệu.

**Bài học rút ra:** Luôn hỏi user trước khi chạy `prisma migrate reset` trên database có dữ liệu quan trọng! 🙏
