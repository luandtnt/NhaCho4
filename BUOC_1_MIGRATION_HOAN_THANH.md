# ✅ BƯỚC 1: DATABASE MIGRATION - HOÀN THÀNH

## 📋 ĐÃ TẠO

### 1. Migration Files
- ✅ `apps/backend/prisma/migrations/20260117_enhance_agreements/migration.sql`
- ✅ `apps/backend/prisma/migrations/20260117_enhance_agreements/rollback.sql`
- ✅ `apps/backend/prisma/migrations/20260117_enhance_agreements/README.md`

### 2. Schema Update
- ✅ Cập nhật `apps/backend/prisma/schema.prisma`
  - Thêm 30+ fields mới vào Agreement model
  - Thêm relations (rentable_item, renewal)
  - Thêm indexes

### 3. Run Script
- ✅ `run-agreement-migration.ps1` - Script tự động chạy migration

---

## 🔧 CÁC FIELD MỚI

### Link & Basic Info
- `rentable_item_id` - Link đến BĐS

### Pricing (4 fields)
- `base_price` - Giá thuê/tháng
- `deposit_amount` - Tiền cọc
- `service_fee` - Phí dịch vụ
- `building_mgmt_fee` - Phí quản lý

### Utilities (2 fields)
- `electricity_billing` - Cách tính điện
- `water_billing` - Cách tính nước

### Price Increase (2 fields)
- `price_increase_percent` - % tăng giá
- `price_increase_frequency` - Tần suất

### Status Tracking (6 fields)
- `sent_at` - Thời điểm gửi
- `confirmed_at` - Thời điểm xác nhận
- `activated_at` - Thời điểm kích hoạt
- `terminated_at` - Thời điểm chấm dứt
- `expired_at` - Thời điểm hết hạn
- `rejected_at` - Thời điểm từ chối

### Termination (5 fields)
- `termination_reason` - Lý do
- `termination_type` - Loại
- `termination_penalty` - Phí phạt
- `deposit_refund_amount` - Hoàn cọc
- `rejection_reason` - Lý do từ chối

### Renewal (2 fields)
- `renewal_of_agreement_id` - Link hợp đồng cũ
- `is_renewed` - Đã gia hạn?

### Tenant Requests (3 fields)
- `pending_request_type` - Loại yêu cầu
- `pending_request_data` - Dữ liệu
- `pending_request_at` - Thời điểm

### Snapshots (2 fields)
- `snapshot_terms` - Snapshot điều khoản
- `snapshot_pricing` - Snapshot giá

### Notes (2 fields)
- `landlord_notes` - Ghi chú chủ nhà
- `tenant_notes` - Ghi chú tenant

**Tổng: 30+ fields mới**

---

## 🚀 CÁCH CHẠY MIGRATION

### Bước 1: Chạy Script
```powershell
.\run-agreement-migration.ps1
```

Script sẽ:
1. Hỏi xác nhận
2. Chạy SQL migration
3. Generate Prisma client
4. Thông báo thành công

### Bước 2: Restart Backend
```powershell
cd apps/backend
npm run dev
```

### Bước 3: Kiểm Tra
```sql
-- Kết nối database
psql $env:DATABASE_URL

-- Xem cấu trúc bảng
\d agreements

-- Kiểm tra có field mới không
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agreements';
```

---

## 🔄 ROLLBACK (Nếu Cần)

Nếu có vấn đề, rollback bằng:
```powershell
cd apps/backend
Get-Content prisma/migrations/20260117_enhance_agreements/rollback.sql | psql $env:DATABASE_URL
npx prisma generate
```

---

## ✅ CHECKLIST

- [x] Tạo migration.sql
- [x] Tạo rollback.sql
- [x] Tạo README.md
- [x] Cập nhật schema.prisma
- [x] Tạo run script
- [ ] **Chạy migration** ← BẠN CẦN LÀM BƯỚC NÀY
- [ ] Restart backend
- [ ] Kiểm tra database

---

## 📊 TIẾN ĐỘ TỔNG THỂ

| Bước | Trạng Thái | Thời Gian |
|------|------------|-----------|
| 1. Database Migration | ✅ Hoàn thành | 30 phút |
| 2. Backend Service + Controller | ⏳ Tiếp theo | 3 giờ |
| 3. Frontend Landlord | ⏳ Chưa bắt đầu | 2 giờ |
| 4. Frontend Tenant | ⏳ Chưa bắt đầu | 1 giờ |
| 5. Testing | ⏳ Chưa bắt đầu | 1 giờ |

---

## 🎯 BƯỚC TIẾP THEO

Sau khi chạy migration thành công, chúng ta sẽ:

**BƯỚC 2: Backend Service + Controller**
- Tạo DTOs (7 files)
- Implement AgreementService (15+ methods)
- Implement AgreementController (12+ endpoints)

Bạn sẵn sàng chạy migration chưa? 🚀

