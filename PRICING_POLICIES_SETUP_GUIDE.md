# 🚀 Pricing Policies System - Setup Guide

**Date**: January 16, 2026  
**Status**: Ready to Deploy

---

## ⚠️ QUAN TRỌNG: Đọc trước khi chạy!

### Lỗi bạn đang gặp:
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...'
```

**Nguyên nhân**: Backend đang chạy và đang lock file Prisma Client.

**Giải pháp**: **PHẢI TẮT BACKEND** trước khi chạy `prisma generate`

---

## 📋 CÁCH SETUP ĐÚNG

### Option 1: Dùng Script Tự Động (KHUYẾN NGHỊ) ✅

#### Bước 1: Tắt Backend
Tìm terminal đang chạy backend và nhấn `Ctrl + C`

#### Bước 2: Chạy Script
```powershell
# Trong PowerShell tại thư mục root
.\setup-pricing-policies.ps1
```

Script sẽ tự động:
- ✅ Kiểm tra backend có đang chạy không
- ✅ Generate Prisma Client
- ✅ Run migration
- ✅ Báo kết quả

---

### Option 2: Chạy Thủ Công (Từng Lệnh)

#### Bước 1: Tắt Backend
```bash
# Trong terminal đang chạy backend
Ctrl + C
```

#### Bước 2: Generate Prisma Client
```bash
cd apps/backend
npx prisma generate
```

**Kết quả mong đợi**:
```
✔ Generated Prisma Client (5.22.0) to .\node_modules\@prisma\client
```

#### Bước 3: Run Migration
```bash
npx prisma migrate deploy
```

**Kết quả mong đợi**:
```
1 migration found in prisma/migrations
Applying migration `20260116_pricing_policies`
The following migration(s) have been applied:
migrations/
  └─ 20260116_pricing_policies/
    └─ migration.sql
```

#### Bước 4: Start Backend
```bash
npm run start:dev
```

#### Bước 5: Verify
```bash
# Trong terminal mới
curl http://localhost:3000/api/v1/pricing-policies
```

---

## 🔍 TROUBLESHOOTING

### Lỗi 1: "EPERM: operation not permitted"
**Nguyên nhân**: Backend đang chạy

**Giải pháp**:
```powershell
# Option A: Tìm và kill process
Get-Process -Name "node" | Where-Object { $_.Path -like "*Nhacho4*" } | Stop-Process -Force

# Option B: Restart máy
```

### Lỗi 2: "Migration already applied"
**Nguyên nhân**: Migration đã chạy rồi

**Giải pháp**: Bỏ qua, chỉ cần start backend

### Lỗi 3: "Cannot find module '@prisma/client'"
**Nguyên nhân**: Chưa generate Prisma Client

**Giải pháp**: Chạy lại `npx prisma generate`

---

## ✅ CHECKLIST SAU KHI SETUP

### Backend
- [ ] Prisma Client generated thành công
- [ ] Migration applied thành công
- [ ] Backend start không lỗi
- [ ] API `/api/v1/pricing-policies` trả về 200

### Database
- [ ] Bảng `pricing_policies` đã tạo
- [ ] Bảng `pricing_policy_versions` đã tạo
- [ ] Bảng `booking_price_snapshots` đã tạo
- [ ] Bảng `rentable_items` có cột `pricing_policy_id`

### Test API
```bash
# 1. List policies (should return empty array)
curl http://localhost:3000/api/v1/pricing-policies

# 2. Create policy (need auth token)
curl -X POST http://localhost:3000/api/v1/pricing-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Policy",
    "property_category": "HOMESTAY",
    "rental_duration_type": "SHORT_TERM",
    "base_price": 300000,
    "price_unit": "NIGHT",
    "min_rent_duration": 1,
    "pricing_details": {}
  }'
```

---

## 🎯 NEXT STEPS AFTER SETUP

### 1. Add Route cho Frontend
**File**: `apps/frontend/src/App.tsx` hoặc router config

```typescript
import PricingPoliciesPageNew from './pages/PricingPoliciesPageNew';

// Add route
<Route path="/pricing-policies-new" element={<PricingPoliciesPageNew />} />
```

### 2. Update EnhancedPropertyForm
**File**: `apps/frontend/src/components/EnhancedPropertyForm.tsx`

Thêm `PricingPolicySelector` component (chi tiết ở bước tiếp theo)

### 3. Test Full Flow
1. Tạo pricing policy
2. Tạo rentable item với policy
3. Verify giá tự động điền
4. Test override price

---

## 📊 DATABASE SCHEMA OVERVIEW

### Tables Created:
```
pricing_policies
├── id (UUID)
├── org_id (UUID)
├── name (VARCHAR)
├── property_category (VARCHAR)
├── rental_duration_type (VARCHAR)
├── base_price (DECIMAL)
├── version (INTEGER)
├── status (VARCHAR)
└── ... (30+ columns)

pricing_policy_versions
├── id (UUID)
├── policy_id (UUID)
├── version (INTEGER)
├── policy_snapshot (JSONB)
└── change_tracking fields

booking_price_snapshots
├── id (UUID)
├── booking_id (UUID)
├── pricing_policy_id (UUID)
├── calculation_breakdown (JSONB)
└── price fields

rentable_items (updated)
├── ... (existing columns)
├── pricing_policy_id (UUID) ← NEW
├── pricing_policy_version (INTEGER) ← NEW
└── pricing_override (JSONB) ← NEW
```

---

## 🚀 READY TO GO!

Sau khi setup xong, bạn sẽ có:
- ✅ Backend APIs hoàn chỉnh
- ✅ Database schema production-ready
- ✅ Frontend components sẵn sàng
- ✅ Versioning system hoạt động
- ✅ Audit trail đầy đủ

**Chỉ còn 2 bước nữa là xong**:
1. Add route cho PricingPoliciesPageNew
2. Integrate PricingPolicySelector vào EnhancedPropertyForm

Let's go! 🎉
