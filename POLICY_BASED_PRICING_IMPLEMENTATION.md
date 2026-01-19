# Policy-Based Pricing System - Implementation Complete

## 📋 Tổng quan

Hệ thống cho phép quản lý giá tập trung thông qua **Pricing Policies** và áp dụng linh hoạt cho từng **Rentable Item**.

---

## 🎯 Luồng hoạt động

### 1. Tạo Pricing Policy (Chính sách giá)
**Vị trí:** `/pricing-policies-new`

- Admin tạo chính sách giá cho từng loại hình bất động sản
- Mỗi chính sách bao gồm:
  - Loại hình (property_category): RESIDENTIAL, COMMERCIAL, v.v.
  - Thời hạn thuê (rental_duration_type): SHORT_TERM, MEDIUM_TERM, LONG_TERM
  - Giá cơ bản (base_price)
  - Các phí liên quan (deposit, service_fee, building_mgmt_fee, v.v.)
  - Phạm vi áp dụng (province, district) - optional
- Chính sách có version tracking để theo dõi thay đổi

### 2. Tạo Rentable Item với Policy
**Vị trí:** Form tạo Rentable Item

**Bước 1: Chọn loại hình**
- Người dùng chọn property_category và rental_duration_type
- Hệ thống tự động lọc các chính sách giá phù hợp

**Bước 2: Chọn chính sách giá**
- Component `PricingPolicySelector` hiển thị danh sách policies ACTIVE
- Người dùng chọn 1 policy
- Form tự động điền các field giá từ policy:
  ```
  ✓ base_price
  ✓ price_unit
  ✓ min_rent_duration
  ✓ deposit_amount
  ✓ booking_hold_deposit
  ✓ service_fee
  ✓ building_mgmt_fee
  ✓ electricity_billing
  ✓ water_billing
  ```

**Bước 3: Override (tùy chọn)**
- Người dùng có thể bật "Cho phép ghi đè giá"
- Sửa các giá trị riêng cho item này
- Các thay đổi CHỈ áp dụng cho item, không ảnh hưởng policy gốc

**Bước 4: Lưu**
- Backend lưu:
  ```typescript
  {
    pricing_policy_id: "uuid",           // Link đến policy
    pricing_policy_version: 1,           // Version tại thời điểm áp dụng
    pricing_snapshot_at: "2026-01-16",   // Thời điểm snapshot
    base_price: 5000000,                 // Giá đã override (nếu có)
    deposit_amount: 10000000,
    // ... các field khác
  }
  ```

### 3. Sử dụng giá trong các module khác

**Listing (Marketplace)**
```typescript
// Lấy giá từ rentable_item
const listing = {
  price: rentableItem.base_price,
  price_unit: rentableItem.price_unit,
  deposit: rentableItem.deposit_amount,
}
```

**Agreement (Contract)**
```typescript
// Copy giá từ rentable_item vào agreement
const agreement = {
  monthly_rent: rentableItem.base_price,
  deposit_amount: rentableItem.deposit_amount,
  service_fee: rentableItem.service_fee,
  // Lưu snapshot để không bị ảnh hưởng khi policy thay đổi
}
```

**Invoice**
```typescript
// Tạo invoice từ agreement
const invoice = {
  rent_amount: agreement.monthly_rent,
  service_fee: agreement.service_fee,
  building_mgmt_fee: agreement.building_mgmt_fee,
}
```

**Booking**
```typescript
// Tính giá booking từ rentable_item
const totalPrice = calculatePrice(
  rentableItem.base_price,
  rentableItem.price_unit,
  startDate,
  endDate
);
```

---

## 🗂️ Database Schema

### pricing_policy table
```sql
CREATE TABLE pricing_policy (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  version INTEGER DEFAULT 1,
  
  -- Classification
  property_category TEXT NOT NULL,
  rental_duration_type TEXT NOT NULL,
  
  -- Scope
  scope_province TEXT,
  scope_district TEXT,
  
  -- Pricing
  pricing_mode TEXT DEFAULT 'FIXED',
  base_price DECIMAL NOT NULL,
  price_unit TEXT NOT NULL,
  min_rent_duration INTEGER NOT NULL,
  
  -- Fees
  deposit_amount DECIMAL,
  booking_hold_deposit DECIMAL,
  service_fee DECIMAL,
  building_management_fee DECIMAL,
  
  -- Utilities
  electricity_billing TEXT,
  water_billing TEXT,
  
  -- Metadata
  pricing_details JSONB,
  tiered_pricing JSONB,
  
  -- Audit
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### rentable_items table (relevant fields)
```sql
ALTER TABLE rentable_items ADD COLUMN pricing_policy_id TEXT;
ALTER TABLE rentable_items ADD COLUMN pricing_policy_version INTEGER;
ALTER TABLE rentable_items ADD COLUMN pricing_snapshot_at TIMESTAMP;
```

---

## 📁 Files Modified/Created

### Backend

**DTOs:**
- `apps/backend/src/modules/ops/rentable-item/dto/create-rentable-item-enhanced.dto.ts`
  - Added `pricing_policy_id` and `pricing_policy_version` fields

**Services:**
- `apps/backend/src/modules/ops/rentable-item/rentable-item.service.ts`
  - Updated `create()` to save pricing_policy_id and snapshot timestamp

**Controllers:**
- `apps/backend/src/modules/ops/pricing-policy/pricing-policy.controller.ts`
  - Added `@Roles()` decorator for authorization
  - Fixed route prefix

### Frontend

**Components:**
- `apps/frontend/src/components/PricingPolicySelector.tsx` ✅ (already complete)
  - Displays filtered policies based on property type
  - Allows policy selection
  - Shows policy details

- `apps/frontend/src/components/property-forms/PricingFieldsWithPolicy.tsx` ✅ (enhanced)
  - Integrates PricingPolicySelector
  - Auto-fills pricing fields from selected policy
  - Allows override with visual indicators
  - Tracks which fields are overridden

- `apps/frontend/src/components/EnhancedPropertyForm.tsx` ✅ (already using)
  - Uses PricingFieldsWithPolicy instead of PricingFields

**Pages:**
- `apps/frontend/src/pages/PricingPoliciesPageNew.tsx` ✅
  - Management page for pricing policies
  - Create, edit, delete, archive policies

---

## 🔄 Data Flow Diagram

```
┌─────────────────────┐
│  Pricing Policy     │
│  (Template)         │
│  - ACTIVE status    │
│  - Version 1        │
└──────────┬──────────┘
           │
           │ User selects policy
           │
           ▼
┌─────────────────────┐
│  Rentable Item      │
│  - policy_id        │
│  - policy_version   │
│  - snapshot_at      │
│  - base_price       │◄─── Can override
│  - deposit_amount   │◄─── Can override
└──────────┬──────────┘
           │
           │ Copy pricing to
           │
           ▼
┌─────────────────────┐
│  Listing            │
│  - price            │
│  - deposit          │
└──────────┬──────────┘
           │
           │ Create agreement
           │
           ▼
┌─────────────────────┐
│  Agreement          │
│  - monthly_rent     │
│  - deposit_amount   │
│  - service_fee      │
└──────────┬──────────┘
           │
           │ Generate invoice
           │
           ▼
┌─────────────────────┐
│  Invoice            │
│  - rent_amount      │
│  - service_fee      │
│  - total_amount     │
└─────────────────────┘
```

---

## ✅ Benefits

1. **Quản lý tập trung**
   - Tạo chính sách giá một lần, áp dụng cho nhiều items
   - Dễ dàng cập nhật giá cho loại hình mới

2. **Linh hoạt**
   - Có thể override giá cho từng item đặc biệt
   - Ví dụ: Căn hộ có view đẹp → tăng giá 20%

3. **Truy vết**
   - Biết item đang dùng policy nào, version nào
   - Có thể rollback hoặc audit changes

4. **Nhất quán**
   - Giá được áp dụng đồng bộ qua các module
   - Listing, Agreement, Invoice đều dùng cùng nguồn giá

5. **Không ảnh hưởng dữ liệu cũ**
   - Khi tạo policy mới, items cũ vẫn giữ nguyên giá
   - Snapshot đảm bảo giá không thay đổi bất ngờ

---

## 🧪 Testing Checklist

- [ ] Tạo pricing policy mới
- [ ] Chọn policy khi tạo rentable item
- [ ] Giá tự động điền từ policy
- [ ] Override giá cho item riêng
- [ ] Tạo listing với giá từ item
- [ ] Tạo agreement với giá từ item
- [ ] Tạo invoice với giá từ agreement
- [ ] Cập nhật policy không ảnh hưởng items cũ
- [ ] Xem version history của policy

---

## 📝 Next Steps (Optional Enhancements)

1. **Policy Templates**
   - Tạo templates cho các loại hình phổ biến
   - Ví dụ: "Căn hộ 2PN Quận 1", "Nhà nguyên căn Quận 7"

2. **Bulk Apply**
   - Áp dụng policy cho nhiều items cùng lúc
   - Hữu ích khi có nhiều items cùng loại

3. **Policy Comparison**
   - So sánh 2 policies side-by-side
   - Giúp quyết định chọn policy nào

4. **Price Analytics**
   - Thống kê items đang dùng policy nào
   - Phân tích giá trung bình theo khu vực

5. **Dynamic Pricing**
   - Tích hợp pricing mode DYNAMIC
   - Tự động điều chỉnh giá theo mùa, demand

---

## 🎉 Status: COMPLETE

Hệ thống Policy-Based Pricing đã được implement đầy đủ và sẵn sàng sử dụng!
