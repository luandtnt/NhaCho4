# Pricing Policy System Design - Hệ thống Chính sách Giá

**Date**: January 16, 2026  
**Version**: 1.0  
**Purpose**: Thiết kế hệ thống chính sách giá linh hoạt cho 21 loại hình bất động sản

---

## 🎯 Mục tiêu

Thay vì nhập giá trực tiếp khi tạo rentable_item, người dùng sẽ:
1. **Tạo Pricing Policy** trước (template giá)
2. **Chọn Pricing Policy** khi tạo rentable_item
3. **Tất cả thông tin tài chính** được lấy từ policy

**Lợi ích**:
- ✅ Quản lý giá tập trung
- ✅ Dễ dàng cập nhật giá hàng loạt
- ✅ Tái sử dụng policy cho nhiều items
- ✅ Lịch sử thay đổi giá
- ✅ A/B testing giá

---

## 📊 Database Schema

### 1. Bảng `pricing_policies`

```sql
CREATE TABLE pricing_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ARCHIVED
  
  -- Applicability
  property_category VARCHAR(100) NOT NULL, -- HOMESTAY, HOTEL, APARTMENT, etc.
  rental_duration_type VARCHAR(50) NOT NULL, -- SHORT_TERM, MEDIUM_TERM, LONG_TERM
  
  -- Core Pricing (30 fields from rentable_items)
  base_price DECIMAL(15,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL, -- HOUR, NIGHT, MONTH
  deposit_amount DECIMAL(15,2),
  min_rent_duration INTEGER NOT NULL,
  
  -- Utilities & Fees
  service_fee DECIMAL(15,2),
  building_management_fee DECIMAL(15,2),
  electricity_billing VARCHAR(50), -- METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE
  water_billing VARCHAR(50),
  
  -- Type-specific pricing (JSONB)
  pricing_details JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pricing_policies_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id),
  CONSTRAINT pricing_policies_base_price_check CHECK (base_price > 0),
  CONSTRAINT pricing_policies_min_rent_duration_check CHECK (min_rent_duration >= 1)
);

CREATE INDEX idx_pricing_policies_org_id ON pricing_policies(org_id);
CREATE INDEX idx_pricing_policies_status ON pricing_policies(status);
CREATE INDEX idx_pricing_policies_property_category ON pricing_policies(property_category);
CREATE INDEX idx_pricing_policies_rental_duration_type ON pricing_policies(rental_duration_type);
```

### 2. Cập nhật bảng `rentable_items`

```sql
-- Thêm cột pricing_policy_id
ALTER TABLE rentable_items 
ADD COLUMN pricing_policy_id UUID REFERENCES pricing_policies(id);

-- Index
CREATE INDEX idx_rentable_items_pricing_policy_id ON rentable_items(pricing_policy_id);

-- Các cột giá hiện tại vẫn giữ để:
-- 1. Snapshot giá tại thời điểm tạo
-- 2. Cho phép override nếu cần
-- 3. Backward compatibility
```

---

## 🏗️ Pricing Details Structure (JSONB)

### SHORT_TERM Pricing Details

```typescript
interface ShortTermPricingDetails {
  // Extra Fees
  extra_guest_fee?: number;           // VND per person per night
  weekend_surcharge?: number;         // VND per night
  cleaning_fee?: number;              // VND one-time
  booking_hold_deposit?: number;      // VND
  
  // Discounts
  weekly_discount_percent?: number;   // % off for 7+ nights
  monthly_discount_percent?: number;  // % off for 30+ nights
  early_bird_discount_percent?: number; // % off for booking X days ahead
  
  // Seasonal Pricing
  peak_season_multiplier?: number;    // 1.5 = 150% of base price
  peak_season_dates?: Array<{
    start_date: string;               // YYYY-MM-DD
    end_date: string;
    multiplier: number;
  }>;
  
  // Cancellation
  cancellation_policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  cancellation_fee_percent?: number;  // 0-100
  
  // Services (for HOTEL, SERVICED_APT)
  breakfast_fee?: number;             // VND per person per day
  airport_transfer_fee?: number;      // VND one-way
  laundry_fee?: number;               // VND per kg
}
```

**Ví dụ**:
```json
{
  "extra_guest_fee": 100000,
  "weekend_surcharge": 200000,
  "cleaning_fee": 150000,
  "booking_hold_deposit": 500000,
  "weekly_discount_percent": 10,
  "monthly_discount_percent": 20,
  "cancellation_policy": "MODERATE",
  "cancellation_fee_percent": 50,
  "peak_season_dates": [
    {
      "start_date": "2026-07-01",
      "end_date": "2026-08-31",
      "multiplier": 1.5
    }
  ]
}
```

---

### MID_TERM Pricing Details

```typescript
interface MidTermPricingDetails {
  // Utilities
  internet_fee?: number;              // VND per month
  parking_fee_motorbike?: number;     // VND per month
  parking_fee_car?: number;           // VND per month
  
  // Discounts
  long_term_discount_percent?: number; // % off for 3+ months
  
  // Escalation
  price_increase_after_months?: number; // Increase after X months
  price_increase_percent?: number;      // % increase
  
  // Services (for SERVICED_APT_MID)
  housekeeping_fee?: number;          // VND per visit
  housekeeping_frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
}
```

**Ví dụ**:
```json
{
  "internet_fee": 200000,
  "parking_fee_motorbike": 100000,
  "parking_fee_car": 500000,
  "long_term_discount_percent": 15,
  "price_increase_after_months": 6,
  "price_increase_percent": 5,
  "housekeeping_fee": 300000,
  "housekeeping_frequency": "WEEKLY"
}
```

---

### LONG_TERM Pricing Details

```typescript
interface LongTermPricingDetails {
  // Utilities
  internet_fee?: number;
  parking_fee_car?: number;
  
  // Escalation
  yearly_increase_percent?: number;   // % increase per year
  
  // Commercial/Industrial specific
  tax_estimate_per_year?: number;     // VND (for SHOPHOUSE)
  environment_fee?: number;           // VND per month (for FACTORY)
  
  // Discounts
  multi_year_discount_percent?: number; // % off for 2+ years
  
  // Maintenance
  maintenance_fee?: number;           // VND per month
  maintenance_reserve_percent?: number; // % of rent for reserve fund
}
```

**Ví dụ**:
```json
{
  "internet_fee": 500000,
  "parking_fee_car": 1000000,
  "yearly_increase_percent": 5,
  "tax_estimate_per_year": 10000000,
  "multi_year_discount_percent": 10,
  "maintenance_fee": 500000
}
```

---

## 📋 Pricing Policy Templates by Property Type

### 1. SHORT_TERM Properties

#### HOMESTAY
```json
{
  "name": "Homestay Standard",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "base_price": 300000,
  "price_unit": "NIGHT",
  "min_rent_duration": 1,
  "deposit_amount": 0,
  "pricing_details": {
    "extra_guest_fee": 50000,
    "cleaning_fee": 100000,
    "booking_hold_deposit": 300000,
    "weekly_discount_percent": 10,
    "cancellation_policy": "FLEXIBLE"
  }
}
```

#### HOTEL
```json
{
  "name": "Hotel 3 Star Standard",
  "property_category": "HOTEL",
  "rental_duration_type": "SHORT_TERM",
  "base_price": 800000,
  "price_unit": "NIGHT",
  "min_rent_duration": 1,
  "pricing_details": {
    "extra_guest_fee": 200000,
    "weekend_surcharge": 300000,
    "breakfast_fee": 150000,
    "airport_transfer_fee": 500000,
    "laundry_fee": 50000,
    "cancellation_policy": "MODERATE",
    "cancellation_fee_percent": 50,
    "peak_season_dates": [
      {
        "start_date": "2026-12-20",
        "end_date": "2026-01-05",
        "multiplier": 2.0
      }
    ]
  }
}
```

#### VILLA_RESORT
```json
{
  "name": "Villa Luxury Beachfront",
  "property_category": "VILLA_RESORT",
  "rental_duration_type": "SHORT_TERM",
  "base_price": 5000000,
  "price_unit": "NIGHT",
  "min_rent_duration": 2,
  "deposit_amount": 10000000,
  "pricing_details": {
    "extra_guest_fee": 500000,
    "weekend_surcharge": 1000000,
    "cleaning_fee": 1000000,
    "weekly_discount_percent": 15,
    "monthly_discount_percent": 25,
    "cancellation_policy": "STRICT",
    "cancellation_fee_percent": 100
  }
}
```

---

### 2. MID_TERM Properties

#### APARTMENT
```json
{
  "name": "Apartment 2BR Standard",
  "property_category": "APARTMENT",
  "rental_duration_type": "MEDIUM_TERM",
  "base_price": 8000000,
  "price_unit": "MONTH",
  "min_rent_duration": 3,
  "deposit_amount": 16000000,
  "service_fee": 500000,
  "building_management_fee": 300000,
  "electricity_billing": "METER_PRIVATE",
  "water_billing": "METER_PRIVATE",
  "pricing_details": {
    "internet_fee": 200000,
    "parking_fee_motorbike": 100000,
    "parking_fee_car": 500000,
    "long_term_discount_percent": 10
  }
}
```

#### PRIVATE_HOUSE
```json
{
  "name": "Private House 3BR",
  "property_category": "PRIVATE_HOUSE",
  "rental_duration_type": "MEDIUM_TERM",
  "base_price": 12000000,
  "price_unit": "MONTH",
  "min_rent_duration": 6,
  "deposit_amount": 24000000,
  "electricity_billing": "METER_PRIVATE",
  "water_billing": "METER_PRIVATE",
  "pricing_details": {
    "internet_fee": 300000,
    "parking_fee_car": 0,
    "long_term_discount_percent": 15,
    "price_increase_after_months": 12,
    "price_increase_percent": 5
  }
}
```

#### ROOM_RENTAL
```json
{
  "name": "Room Rental Basic",
  "property_category": "ROOM_RENTAL",
  "rental_duration_type": "MEDIUM_TERM",
  "base_price": 3000000,
  "price_unit": "MONTH",
  "min_rent_duration": 3,
  "deposit_amount": 3000000,
  "service_fee": 200000,
  "electricity_billing": "OWNER_RATE",
  "water_billing": "SHARED",
  "pricing_details": {
    "internet_fee": 0,
    "parking_fee_motorbike": 50000
  }
}
```

---

### 3. LONG_TERM Properties

#### OFFICE
```json
{
  "name": "Office Space Grade A",
  "property_category": "OFFICE",
  "rental_duration_type": "LONG_TERM",
  "base_price": 500000,
  "price_unit": "MONTH",
  "min_rent_duration": 12,
  "deposit_amount": 3000000,
  "service_fee": 100000,
  "building_management_fee": 150000,
  "electricity_billing": "METER_PRIVATE",
  "water_billing": "METER_PRIVATE",
  "pricing_details": {
    "internet_fee": 500000,
    "parking_fee_car": 1000000,
    "yearly_increase_percent": 5,
    "multi_year_discount_percent": 10,
    "maintenance_fee": 200000
  }
}
```

#### LAND_PLOT
```json
{
  "name": "Land Commercial Zone",
  "property_category": "LAND_PLOT",
  "rental_duration_type": "LONG_TERM",
  "base_price": 50000000,
  "price_unit": "MONTH",
  "min_rent_duration": 24,
  "deposit_amount": 100000000,
  "pricing_details": {
    "yearly_increase_percent": 10,
    "multi_year_discount_percent": 15
  }
}
```

#### FACTORY
```json
{
  "name": "Factory Industrial Zone",
  "property_category": "FACTORY",
  "rental_duration_type": "LONG_TERM",
  "base_price": 100000000,
  "price_unit": "MONTH",
  "min_rent_duration": 36,
  "deposit_amount": 300000000,
  "electricity_billing": "METER_PRIVATE",
  "water_billing": "METER_PRIVATE",
  "pricing_details": {
    "environment_fee": 5000000,
    "yearly_increase_percent": 7,
    "maintenance_fee": 2000000,
    "maintenance_reserve_percent": 5
  }
}
```

---

## 🔄 Workflow

### 1. Tạo Pricing Policy

```typescript
// Admin/Landlord tạo policy
POST /api/v1/pricing-policies
{
  "name": "Homestay Hà Nội Standard",
  "description": "Giá chuẩn cho homestay tại Hà Nội",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "base_price": 300000,
  "price_unit": "NIGHT",
  "min_rent_duration": 1,
  "pricing_details": {
    "extra_guest_fee": 50000,
    "cleaning_fee": 100000,
    "weekly_discount_percent": 10
  }
}
```

### 2. Tạo Rentable Item với Policy

```typescript
// Khi tạo item, chỉ cần chọn policy
POST /api/v1/rentable-items
{
  "name": "Homestay Cozy Room",
  "pricing_policy_id": "uuid-of-policy",
  // Các thông tin khác (location, amenities, etc.)
  // KHÔNG CẦN nhập giá
}

// Backend tự động copy giá từ policy vào item
```

### 3. Override Price (Optional)

```typescript
// Nếu cần giá đặc biệt cho 1 item
POST /api/v1/rentable-items
{
  "name": "Homestay Premium Room",
  "pricing_policy_id": "uuid-of-policy",
  "price_override": {
    "base_price": 500000,  // Override base price
    "deposit_amount": 1000000
  }
}
```

### 4. Update Policy (Bulk Update)

```typescript
// Cập nhật policy → tất cả items sử dụng policy đều cập nhật
PATCH /api/v1/pricing-policies/:id
{
  "base_price": 350000,  // Tăng giá 50k
  "apply_to_existing_items": true  // Apply to all items using this policy
}
```

---

## 📊 UI/UX Flow

### Trang Pricing Policies

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Chính sách Giá                          [+ Tạo mới]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔍 [Tìm kiếm...]  [Loại hình ▼] [Thời hạn ▼] [Trạng thái ▼] │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🏠 Homestay Standard                    [ACTIVE]  │   │
│ │ SHORT_TERM • 300,000đ/đêm                        │   │
│ │ 15 items đang sử dụng          [Sửa] [Xem] [⋮]  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🏨 Hotel 3 Star                         [ACTIVE]  │   │
│ │ SHORT_TERM • 800,000đ/đêm                        │   │
│ │ 8 items đang sử dụng           [Sửa] [Xem] [⋮]  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Form Tạo/Sửa Policy

```
┌─────────────────────────────────────────────────────────┐
│ Tạo Chính sách Giá                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Thông tin cơ bản                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Tên policy: [Homestay Hà Nội Standard        ]   │   │
│ │ Mô tả:      [Giá chuẩn cho homestay...       ]   │   │
│ │ Loại hình:  [HOMESTAY                    ▼]     │   │
│ │ Thời hạn:   [SHORT_TERM                  ▼]     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Giá cơ bản                                              │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Giá thuê:   [300,000] đ / [NIGHT ▼]             │   │
│ │ Thuê tối thiểu: [1] đêm                          │   │
│ │ Tiền cọc:   [0] đ (optional)                     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Chi phí bổ sung (SHORT_TERM)                            │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ☑ Phụ thu thêm người: [50,000] đ/người/đêm      │   │
│ │ ☑ Phí dọn dẹp:        [100,000] đ               │   │
│ │ ☑ Cọc giữ chỗ:        [300,000] đ               │   │
│ │ ☐ Phụ thu cuối tuần:  [      ] đ                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Giảm giá                                                │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ☑ Giảm giá tuần:  [10] %  (7+ đêm)              │   │
│ │ ☑ Giảm giá tháng: [20] %  (30+ đêm)             │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Chính sách hủy                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ⚪ Linh hoạt   ⦿ Trung bình   ⚪ Nghiêm ngặt     │   │
│ │ Phí hủy: [50] %                                  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│                              [Hủy]  [Lưu chính sách]    │
└─────────────────────────────────────────────────────────┘
```

### Form Tạo Rentable Item (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│ Tạo Tài sản Cho thuê                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Thông tin cơ bản                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Tên:        [Homestay Cozy Room              ]   │   │
│ │ Loại hình:  [HOMESTAY                    ▼]     │   │
│ │ Thời hạn:   [SHORT_TERM                  ▼]     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ 💰 Chính sách Giá                                       │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Chọn policy: [Homestay Standard          ▼]     │   │
│ │                                                   │   │
│ │ Preview:                                          │   │
│ │ • Giá: 300,000đ/đêm                              │   │
│ │ • Phụ thu thêm người: 50,000đ                    │   │
│ │ • Phí dọn dẹp: 100,000đ                          │   │
│ │ • Giảm giá tuần: 10%                             │   │
│ │                                                   │   │
│ │ ☐ Override giá cho item này                      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Vị trí, Tiện nghi, etc...                               │
│                                                          │
│                              [Hủy]  [Tạo tài sản]       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Phase 1: Database & Backend
1. ✅ Tạo migration cho `pricing_policies` table
2. ✅ Thêm `pricing_policy_id` vào `rentable_items`
3. ✅ Tạo Prisma models
4. ✅ Tạo DTOs cho pricing policies
5. ✅ Tạo service & controller

### Phase 2: API Endpoints
1. ✅ CRUD pricing policies
2. ✅ Get policies by property_category
3. ✅ Apply policy to item
4. ✅ Bulk update items when policy changes

### Phase 3: Frontend
1. ✅ Pricing Policies page
2. ✅ Create/Edit policy form (dynamic by type)
3. ✅ Policy selector in rentable item form
4. ✅ Price preview component

### Phase 4: Migration
1. ✅ Create default policies for existing items
2. ✅ Link existing items to policies
3. ✅ Data validation

---

## 📝 Summary

Hệ thống Pricing Policy cho phép:
- ✅ Quản lý giá tập trung, dễ dàng
- ✅ Tái sử dụng policy cho nhiều items
- ✅ Cập nhật giá hàng loạt
- ✅ Giá động theo mùa, thời gian
- ✅ Giảm giá tự động
- ✅ Override giá cho từng item nếu cần
- ✅ Lịch sử thay đổi giá

**Ready to implement!** 🚀
