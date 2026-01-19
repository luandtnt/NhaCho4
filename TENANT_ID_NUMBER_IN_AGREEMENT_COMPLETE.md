# ✅ THÊM CCCD TENANT VÀO HỢP ĐỒNG - HOÀN THÀNH

## 🎯 Mục tiêu
Thêm field `tenant_id_number` vào Agreement table để lưu CCCD/Passport của tenant khi tạo hợp đồng.

---

## ✅ Đã hoàn thành

### 1. Database Schema
**File:** `apps/backend/prisma/schema.prisma`

**Field mới:**
```prisma
model Agreement {
  // ... existing fields
  
  // Party Information
  tenant_id_number  String?   // CCCD/Passport của tenant (nhập tay khi tạo HĐ)
  
  // ... rest
}
```

### 2. Migration SQL
**File:** `apps/backend/prisma/migrations/add_tenant_id_number_to_agreements.sql`

```sql
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_number TEXT;
```

### 3. Backend DTO
**File:** `apps/backend/src/modules/ops/agreement/dto/create-agreement.dto.ts`

```typescript
@ApiPropertyOptional({ description: 'Số CCCD/Passport của tenant', example: '001234567890' })
@IsString()
@IsOptional()
tenant_id_number?: string;
```

### 4. Backend Service
**File:** `apps/backend/src/modules/ops/agreement/agreement.service.ts`

```typescript
const agreement = await this.prisma.agreement.create({
  data: {
    // ...
    tenant_id_number: dto.tenant_id_number,
    // ...
  },
});
```

### 5. Frontend Form
**File:** `apps/frontend/src/pages/CreateAgreementPage.tsx`

**UI mới:**
```tsx
<div>
  <label>Số CCCD/Passport của khách thuê</label>
  <input
    type="text"
    value={formData.tenant_id_number}
    onChange={(e) => setFormData({ ...formData, tenant_id_number: e.target.value })}
    placeholder="001234567890"
  />
  <p>Số CCCD/Passport để lưu vào hợp đồng (tùy chọn)</p>
</div>
```

---

## 🚀 Chạy Migration

### Bước 1: Chạy migration
```powershell
.\run-tenant-id-number-migration.ps1
```

**Hoặc manual:**
```powershell
cd apps/backend
npx prisma db push
npx prisma generate
```

### Bước 2: Restart backend
```powershell
cd apps/backend
npm run dev
```

### Bước 3: Test frontend
```
URL: http://localhost:5173/agreements/create
```

---

## 🧪 Test Guide

### 1. Vào trang tạo hợp đồng
```
http://localhost:5173/agreements/create
```

### 2. Điền form
```
Tiêu đề: HĐ thuê căn 2PN
Tenant ID: [user-id]
CCCD Tenant: 001234567890  ← NEW!
Tài sản: [chọn từ dropdown]
Ngày bắt đầu: 2026-02-01
Giá thuê: 5.000.000
...
```

### 3. Click "Tạo hợp đồng"
- ✅ Thành công
- ✅ CCCD tenant được lưu vào database

### 4. Kiểm tra trong database
```sql
SELECT id, contract_code, tenant_party_id, tenant_id_number 
FROM agreements 
WHERE id = 'agreement-id';
```

**Result:**
```
id: uuid
contract_code: AG-2026-00001
tenant_party_id: tenant-user-id
tenant_id_number: 001234567890  ← NEW!
```

---

## 📊 Use Cases

### Use Case 1: Tạo hợp đồng với CCCD tenant
```
Landlord → Tạo HĐ → Nhập CCCD tenant → Lưu
         ↓
Agreement table có tenant_id_number
         ↓
Dùng để in hợp đồng PDF, xác thực, pháp lý
```

### Use Case 2: Export hợp đồng PDF
```typescript
// Backend: Generate contract PDF
const agreement = await prisma.agreement.findUnique({
  where: { id: agreementId },
  include: { rentable_item: true },
});

const pdfData = {
  landlord_name: landlord.name,
  landlord_id_number: landlord.id_number,  // From User table
  tenant_name: tenant.name,
  tenant_id_number: agreement.tenant_id_number,  // ← From Agreement table
  // ...
};
```

### Use Case 3: Validation & Compliance
```typescript
// Check if tenant CCCD is provided
if (agreement.agreement_type === 'lease' && !agreement.tenant_id_number) {
  throw new Error('CCCD tenant bắt buộc cho hợp đồng dài hạn');
}
```

---

## 📋 So sánh: Landlord vs Tenant CCCD

| Field | Location | Source | Purpose |
|-------|----------|--------|---------|
| **Landlord CCCD** | `users.id_number` | Profile page | Xác thực chủ nhà |
| **Tenant CCCD** | `agreements.tenant_id_number` | Create agreement form | Lưu vào HĐ cụ thể |

**Lý do khác nhau:**
- Landlord CCCD: Lưu 1 lần trong profile, dùng cho tất cả HĐ
- Tenant CCCD: Nhập mỗi lần tạo HĐ (vì tenant có thể không có account)

---

## 📁 Files Changed

### Backend
- ✅ `apps/backend/prisma/schema.prisma`
- ✅ `apps/backend/prisma/migrations/add_tenant_id_number_to_agreements.sql`
- ✅ `apps/backend/src/modules/ops/agreement/dto/create-agreement.dto.ts`
- ✅ `apps/backend/src/modules/ops/agreement/agreement.service.ts`

### Frontend
- ✅ `apps/frontend/src/pages/CreateAgreementPage.tsx`

### Scripts
- ✅ `run-tenant-id-number-migration.ps1`

### Documentation
- ✅ `TENANT_ID_NUMBER_IN_AGREEMENT_COMPLETE.md` (this file)

---

## ✅ Status

**Backend Schema:** ✅ COMPLETE  
**Migration:** ✅ READY TO RUN  
**Frontend:** ✅ COMPLETE  
**Testing:** ✅ READY TO TEST  

---

## 🚀 Next Steps (Optional)

### Priority P1:
1. **Validation CCCD format**
   - Frontend: Check 12 digits
   - Backend: Regex validation

2. **Auto-fill từ User profile**
   - Nếu tenant có account → auto-fill từ `users.id_number`
   - Nếu không có → nhập tay

3. **Display trong Agreement Detail**
   - Show tenant CCCD trong detail page
   - Show trong PDF export

### Priority P2:
4. **Comparison với User profile**
   - Warning nếu CCCD khác với profile
   - Suggest update profile

5. **History tracking**
   - Log changes to tenant_id_number
   - Audit trail

---

**Chạy migration ngay để enable tính năng! 🎉**

```powershell
.\run-tenant-id-number-migration.ps1
```
