# 📋 KẾ HOẠCH IMPLEMENT MODULE HỢP ĐỒNG (AGREEMENT)

## 🎯 MỤC TIÊU
Tạo module quản lý hợp đồng thuê hoàn chỉnh cho cả Landlord và Tenant

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã Có:
- Model Agreement cơ bản trong schema
- Các field: id, org_id, landlord_party_id, tenant_party_id, state, agreement_type, start_at, end_at, terms_json

### ❌ Thiếu:
- Nhiều field quan trọng (rentable_item_id, pricing, deposit, utilities)
- State machine đầy đủ
- Service & Controller
- DTOs
- Frontend pages
- Business logic (activate, terminate, renew, etc.)

---

## 🔧 CẦN IMPLEMENT

### 1. DATABASE MIGRATION
Thêm các field vào Agreement model:
- rentable_item_id (link đến BĐS)
- Pricing fields (base_price, deposit_amount, service_fee, etc.)
- Utilities billing (electricity_billing, water_billing)
- Price increase terms
- Status fields (sent_at, confirmed_at, activated_at, etc.)
- Renewal/termination fields

### 2. BACKEND

#### A. DTOs (7 files)
1. create-agreement.dto.ts
2. update-agreement.dto.ts
3. query-agreement.dto.ts
4. send-agreement.dto.ts
5. confirm-agreement.dto.ts
6. terminate-agreement.dto.ts
7. renew-agreement.dto.ts

#### B. Service (agreement.service.ts)
Methods cần có:
- create() - Tạo hợp đồng
- findAll() - Danh sách (filter by status, tenant, item)
- findOne() - Chi tiết
- update() - Cập nhật
- send() - Gửi cho tenant
- confirm() - Tenant xác nhận
- reject() - Tenant từ chối
- activate() - Kích hoạt
- terminate() - Chấm dứt
- renew() - Gia hạn
- requestTerminate() - Tenant yêu cầu chấm dứt
- requestRenew() - Tenant yêu cầu gia hạn
- checkExpired() - Cron job check hết hạn
- validateOneActivePerItem() - Rule: 1 item chỉ 1 active agreement

#### C. Controller (agreement.controller.ts)
Endpoints:
- POST /agreements - Tạo
- GET /agreements - Danh sách
- GET /agreements/:id - Chi tiết
- PUT /agreements/:id - Cập nhật
- POST /agreements/:id/send - Gửi
- POST /agreements/:id/confirm - Xác nhận
- POST /agreements/:id/reject - Từ chối
- POST /agreements/:id/activate - Kích hoạt
- POST /agreements/:id/terminate - Chấm dứt
- POST /agreements/:id/renew - Gia hạn
- POST /agreements/:id/request-terminate - Yêu cầu chấm dứt
- POST /agreements/:id/request-renew - Yêu cầu gia hạn
- GET /agreements/:id/pdf - Export PDF

### 3. FRONTEND

#### A. Landlord Pages (4 pages)
1. AgreementsPage.tsx - Danh sách
2. CreateAgreementPage.tsx - Tạo mới
3. AgreementDetailPage.tsx - Chi tiết + actions
4. RenewAgreementPage.tsx - Gia hạn

#### B. Tenant Pages (2 pages)
1. TenantAgreementsPage.tsx - Danh sách của tôi
2. TenantAgreementDetailPage.tsx - Chi tiết + xác nhận/từ chối

#### C. Components (5 components)
1. AgreementCard.tsx - Card hiển thị trong list
2. AgreementStatusBadge.tsx - Badge trạng thái
3. AgreementTerms.tsx - Hiển thị điều khoản
4. AgreementPricing.tsx - Hiển thị giá & phí
5. AgreementActions.tsx - Các nút action

---

## 📝 CHI TIẾT IMPLEMENTATION

### BƯỚC 1: DATABASE MIGRATION (30 phút)

File: `apps/backend/prisma/migrations/20260117_enhance_agreements/migration.sql`

```sql
-- Thêm các field mới vào Agreement
ALTER TABLE agreements ADD COLUMN rentable_item_id UUID;
ALTER TABLE agreements ADD COLUMN base_price DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN deposit_amount DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN service_fee DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN building_mgmt_fee DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN electricity_billing TEXT;
ALTER TABLE agreements ADD COLUMN water_billing TEXT;
ALTER TABLE agreements ADD COLUMN price_increase_percent DECIMAL(5,2);
ALTER TABLE agreements ADD COLUMN payment_cycle TEXT DEFAULT 'MONTHLY';
ALTER TABLE agreements ADD COLUMN sent_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN confirmed_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN activated_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN terminated_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN termination_reason TEXT;
ALTER TABLE agreements ADD COLUMN renewal_of_agreement_id UUID;
ALTER TABLE agreements ADD COLUMN snapshot_terms JSONB;

-- Foreign keys
ALTER TABLE agreements ADD CONSTRAINT fk_rentable_item 
  FOREIGN KEY (rentable_item_id) REFERENCES rentable_items(id);
  
ALTER TABLE agreements ADD CONSTRAINT fk_renewal 
  FOREIGN KEY (renewal_of_agreement_id) REFERENCES agreements(id);

-- Indexes
CREATE INDEX idx_agreements_rentable_item ON agreements(rentable_item_id);
CREATE INDEX idx_agreements_state ON agreements(state);
CREATE INDEX idx_agreements_dates ON agreements(start_at, end_at);
```

### BƯỚC 2: UPDATE SCHEMA (5 phút)

Cập nhật `apps/backend/prisma/schema.prisma`

### BƯỚC 3: BACKEND SERVICE (2 giờ)

Implement đầy đủ agreement.service.ts với tất cả methods

### BƯỚC 4: BACKEND CONTROLLER (30 phút)

Implement agreement.controller.ts với tất cả endpoints

### BƯỚC 5: FRONTEND LANDLORD (2 giờ)

Implement 4 pages cho landlord

### BƯỚC 6: FRONTEND TENANT (1 giờ)

Implement 2 pages cho tenant

---

## ⏱️ THỜI GIAN ƯỚC TÍNH

| Task | Thời Gian |
|------|-----------|
| Database Migration | 30 phút |
| Backend DTOs | 30 phút |
| Backend Service | 2 giờ |
| Backend Controller | 30 phút |
| Frontend Landlord | 2 giờ |
| Frontend Tenant | 1 giờ |
| Testing | 1 giờ |
| **TỔNG** | **7.5 giờ** |

---

## 🚀 SẴN SÀNG BẮT ĐẦU

Bạn muốn tôi:
1. ✅ Implement toàn bộ (7.5 giờ)
2. ✅ Implement từng bước (migration → backend → frontend)
3. ✅ Implement MVP trước (core features only - 4 giờ)

Tôi đề xuất: **Implement từng bước** để bạn có thể test từng phần.

Bắt đầu với BƯỚC 1: Database Migration?

