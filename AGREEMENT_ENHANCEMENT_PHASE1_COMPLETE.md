# ✅ AGREEMENT ENHANCEMENT - PHASE 1 COMPLETE

## 🎯 Mục tiêu PHASE 1
Implement Yêu cầu 1, 2, 3:
- **Yêu cầu 1:** Thông tin định danh hợp đồng
- **Yêu cầu 2:** Chọn đối tượng cho thuê (Rentable Item)
- **Yêu cầu 3:** Thông tin người thuê (Tenant Info)

---

## ✅ Đã hoàn thành

### 1. Database Schema Updates

**File:** `apps/backend/prisma/schema.prisma`

**Fields mới:**
```prisma
// Yêu cầu 1: Identity
contract_code     String?   @unique  // AG-2026-00012
contract_title    String?              // "HĐ thuê căn 2PN Vinhomes Q9"

// Yêu cầu 4: Billing
billing_day       Int?      @default(1)
payment_due_days  Int?      @default(5)

// Yêu cầu 5: Additional Fees
parking_fee_motorbike   Decimal? @default(0)
parking_fee_car         Decimal? @default(0)
internet_fee            Decimal? @default(0)

// Yêu cầu 6: Utility Rates
electricity_rate        Decimal?
water_rate              Decimal?

// Yêu cầu 7: Terms & Rules
house_rules             String?
termination_clause      String?
violation_penalty       Decimal?
allow_pets              Boolean? @default(false)
allow_smoking           Boolean? @default(false)
allow_guests            Boolean? @default(true)

// Yêu cầu 8: Handover
handover_date           DateTime?
handover_condition      String?
furniture_list          Json?
initial_electricity     Decimal?
initial_water           Decimal?
handover_document_url   String?

// Yêu cầu 9: Documents
contract_document_url   String?
tenant_id_document_url  String?
property_document_url   String?
```

### 2. Migration SQL

**File:** `apps/backend/prisma/migrations/add_agreement_full_fields.sql`

- ✅ Thêm 25+ columns mới
- ✅ Tạo index cho contract_code
- ✅ Thêm comments cho documentation

### 3. Backend DTOs

**File:** `apps/backend/src/modules/ops/agreement/dto/create-agreement.dto.ts`

**Fields mới trong CreateAgreementDto:**
- ✅ `contract_title` - Tiêu đề hợp đồng
- ✅ `billing_day` - Ngày chốt hóa đơn (1-28)
- ✅ `payment_due_days` - Hạn thanh toán (1-30 ngày)
- ✅ `parking_fee_motorbike` - Phí gửi xe máy
- ✅ `parking_fee_car` - Phí gửi ô tô
- ✅ `internet_fee` - Phí internet
- ✅ `electricity_rate` - Giá điện (VND/kWh)
- ✅ `water_rate` - Giá nước (VND/m3)
- ✅ `house_rules` - Nội quy chung
- ✅ `termination_clause` - Điều khoản chấm dứt
- ✅ `violation_penalty` - Phí phạt vi phạm
- ✅ `allow_pets` - Cho phép thú cưng
- ✅ `allow_smoking` - Cho phép hút thuốc
- ✅ `allow_guests` - Cho khách ở qua đêm
- ✅ `handover_date` - Ngày bàn giao
- ✅ `handover_condition` - Tình trạng hiện tại
- ✅ `furniture_list` - Danh sách nội thất (JSON)
- ✅ `initial_electricity` - Chỉ số điện ban đầu
- ✅ `initial_water` - Chỉ số nước ban đầu
- ✅ `handover_document_url` - URL biên bản bàn giao
- ✅ `contract_document_url` - URL file hợp đồng
- ✅ `tenant_id_document_url` - URL CCCD tenant
- ✅ `property_document_url` - URL giấy tờ căn hộ

**Validation:**
- ✅ `@IsInt()`, `@Min()`, `@Max()` cho billing_day (1-28)
- ✅ `@IsInt()`, `@Min()`, `@Max()` cho payment_due_days (1-30)
- ✅ `@IsBoolean()` cho allow_pets, allow_smoking, allow_guests
- ✅ `@IsNumber()`, `@Min(0)` cho tất cả fees và rates

### 4. Backend Service

**File:** `apps/backend/src/modules/ops/agreement/agreement.service.ts`

**Tính năng mới:**

#### A. Auto-generate contract_code
```typescript
const year = new Date().getFullYear();
const count = await this.prisma.agreement.count({ where: { org_id: orgId } });
const contractCode = `AG-${year}-${String(count + 1).padStart(5, '0')}`;
// Result: AG-2026-00001, AG-2026-00002, ...
```

#### B. Validation nghiệp vụ (Yêu cầu 11)
```typescript
// 1. Validate dates
if (dto.end_at && new Date(dto.start_at) >= new Date(dto.end_at)) {
  throw new BadRequestException('End date must be after start date');
}

// 2. Validate electricity rate if OWNER_RATE
if (dto.electricity_billing === 'OWNER_RATE' && !dto.electricity_rate) {
  throw new BadRequestException('Electricity rate is required');
}

// 3. Validate water rate if OWNER_RATE
if (dto.water_billing === 'OWNER_RATE' && !dto.water_rate) {
  throw new BadRequestException('Water rate is required');
}
```

#### C. Save all new fields
- ✅ Lưu tất cả 25+ fields mới vào database
- ✅ Auto-fill từ pricing policy (nếu có)
- ✅ Default values cho boolean fields

---

## 📋 Checklist Backend

- ✅ Schema updated với 25+ fields mới
- ✅ Migration SQL created
- ✅ CreateAgreementDto updated với validation
- ✅ UpdateAgreementDto auto-extends CreateAgreementDto
- ✅ AgreementService.create() updated
  - ✅ Auto-generate contract_code
  - ✅ Validate dates (start < end)
  - ✅ Validate electricity_rate if OWNER_RATE
  - ✅ Validate water_rate if OWNER_RATE
  - ✅ Save all new fields
- ✅ Migration script created

---

## 🧪 Test Backend

### 1. Chạy migration
```powershell
.\run-agreement-enhancement-migration.ps1
```

### 2. Test API create agreement
```powershell
POST /api/v1/agreements
{
  "contract_title": "HĐ thuê căn 2PN Vinhomes Q9",
  "tenant_party_id": "tenant-123",
  "rentable_item_id": "item-456",
  "agreement_type": "lease",
  "start_at": "2026-02-01",
  "end_at": "2027-02-01",
  "billing_day": 1,
  "payment_due_days": 5,
  "base_price": 5000000,
  "deposit_amount": 10000000,
  "service_fee": 500000,
  "building_mgmt_fee": 300000,
  "parking_fee_motorbike": 50000,
  "parking_fee_car": 500000,
  "internet_fee": 200000,
  "electricity_billing": "OWNER_RATE",
  "electricity_rate": 3500,
  "water_billing": "OWNER_RATE",
  "water_rate": 15000,
  "house_rules": "Không hút thuốc trong nhà",
  "termination_clause": "Phạt 1 tháng tiền thuê nếu chấm dứt trước hạn",
  "violation_penalty": 1000000,
  "allow_pets": false,
  "allow_smoking": false,
  "allow_guests": true,
  "handover_date": "2026-02-01",
  "handover_condition": "Mới 100%",
  "furniture_list": ["Giường", "Tủ lạnh", "Máy lạnh"],
  "initial_electricity": 1234.5,
  "initial_water": 567.8
}
```

### 3. Kiểm tra response
```json
{
  "id": "uuid",
  "contract_code": "AG-2026-00001",  // ✅ Auto-generated
  "contract_title": "HĐ thuê căn 2PN Vinhomes Q9",
  "state": "DRAFT",
  "billing_day": 1,
  "payment_due_days": 5,
  "parking_fee_motorbike": 50000,
  "electricity_rate": 3500,
  "water_rate": 15000,
  "house_rules": "Không hút thuốc trong nhà",
  "allow_pets": false,
  "handover_date": "2026-02-01T00:00:00Z",
  "furniture_list": ["Giường", "Tủ lạnh", "Máy lạnh"],
  "initial_electricity": 1234.5,
  ...
}
```

---

## 🚀 Next Steps: PHASE 2, 3, 4

**PHASE 2:** Frontend - Basic fields (Identity, Dates, Pricing)  
**PHASE 3:** Frontend - Advanced fields (Utilities, Terms, Handover)  
**PHASE 4:** Frontend - Documents upload & Final validation

---

## 📁 Files Changed

### Backend
- ✅ `apps/backend/prisma/schema.prisma`
- ✅ `apps/backend/prisma/migrations/add_agreement_full_fields.sql`
- ✅ `apps/backend/src/modules/ops/agreement/dto/create-agreement.dto.ts`
- ✅ `apps/backend/src/modules/ops/agreement/agreement.service.ts`

### Scripts
- ✅ `run-agreement-enhancement-migration.ps1`

### Documentation
- ✅ `AGREEMENT_ENHANCEMENT_PHASE1_COMPLETE.md` (this file)

---

**Status:** ✅ PHASE 1 BACKEND COMPLETE - Ready for Frontend implementation!
