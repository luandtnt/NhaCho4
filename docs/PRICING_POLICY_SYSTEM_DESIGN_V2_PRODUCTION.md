# Pricing Policy System Design V2 - PRODUCTION GRADE ✅

**Date**: January 16, 2026  
**Version**: 2.0 - Production Ready  
**Status**: Đã tích hợp tất cả feedback production-grade

---

## 🎯 Nguyên tắc thiết kế cốt lõi

### ⚠️ CRITICAL RULES (Bắt buộc)

1. **Giá đóng băng tại thời điểm booking** - Không được thay đổi sau khi booking tạo
2. **Versioning bắt buộc** - Mọi thay đổi policy phải có version mới
3. **Snapshot pricing** - Booking/Invoice lưu snapshot giá, không query live
4. **Validation chặt chẽ** - Peak season không overlap, discount hợp lệ
5. **Audit trail đầy đủ** - Lịch sử thay đổi giá phải rõ ràng

---

## 📊 Database Schema - Production Grade

### 1. Bảng `pricing_policies` (Core)

```sql
CREATE TABLE pricing_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ARCHIVED
  
  -- Versioning (CRITICAL)
  version INTEGER NOT NULL DEFAULT 1,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP, -- NULL = hiện tại đang active
  updated_reason TEXT,
  
  -- Applicability
  property_category VARCHAR(100) NOT NULL,
  rental_duration_type VARCHAR(50) NOT NULL,
  
  -- Geographic Scope (NEW - Theo feedback)
  scope_province VARCHAR(100), -- NULL = áp dụng toàn quốc
  scope_district VARCHAR(100), -- NULL = áp dụng toàn tỉnh
  
  -- Pricing Mode (NEW - Theo feedback)
  pricing_mode VARCHAR(50) NOT NULL DEFAULT 'FIXED', -- FIXED, TIERED, DYNAMIC
  
  -- Core Pricing
  base_price DECIMAL(15,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL, -- HOUR, NIGHT, MONTH
  min_rent_duration INTEGER NOT NULL,
  
  -- Deposits (Theo feedback - Phân biệt rõ SHORT/MID/LONG)
  deposit_amount DECIMAL(15,2), -- MID/LONG: cọc tài sản
  booking_hold_deposit DECIMAL(15,2), -- SHORT: cọc giữ chỗ
  
  -- Utilities & Fees
  service_fee DECIMAL(15,2),
  building_management_fee DECIMAL(15,2),
  electricity_billing VARCHAR(50),
  water_billing VARCHAR(50),
  
  -- Type-specific pricing (JSONB)
  pricing_details JSONB NOT NULL DEFAULT '{}',
  
  -- Tiered Pricing (NEW - Theo feedback)
  tiered_pricing JSONB, -- [{min_units, price_per_unit}]
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  superseded_by UUID REFERENCES pricing_policies(id), -- Link to newer version
  
  CONSTRAINT pricing_policies_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id),
  CONSTRAINT pricing_policies_base_price_check CHECK (base_price > 0),
  CONSTRAINT pricing_policies_min_rent_duration_check CHECK (min_rent_duration >= 1),
  CONSTRAINT pricing_policies_version_check CHECK (version >= 1),
  CONSTRAINT pricing_policies_deposit_check CHECK (
    (rental_duration_type = 'SHORT_TERM' AND booking_hold_deposit IS NOT NULL) OR
    (rental_duration_type IN ('MEDIUM_TERM', 'LONG_TERM') AND deposit_amount IS NOT NULL)
  )
);

CREATE INDEX idx_pricing_policies_org_id ON pricing_policies(org_id);
CREATE INDEX idx_pricing_policies_status ON pricing_policies(status);
CREATE INDEX idx_pricing_policies_property_category ON pricing_policies(property_category);
CREATE INDEX idx_pricing_policies_rental_duration_type ON pricing_policies(rental_duration_type);
CREATE INDEX idx_pricing_policies_version ON pricing_policies(version);
CREATE INDEX idx_pricing_policies_effective_dates ON pricing_policies(effective_from, effective_to);
CREATE INDEX idx_pricing_policies_scope ON pricing_policies(scope_province, scope_district);
```

### 2. Bảng `pricing_policy_versions` (Audit Trail)

```sql
CREATE TABLE pricing_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES pricing_policies(id),
  version INTEGER NOT NULL,
  
  -- Snapshot toàn bộ policy tại version này
  policy_snapshot JSONB NOT NULL,
  
  -- Change tracking
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  change_reason TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- CREATED, UPDATED, ARCHIVED
  
  -- What changed
  changed_fields JSONB, -- {field_name: {old_value, new_value}}
  
  CONSTRAINT pricing_policy_versions_version_check CHECK (version >= 1)
);

CREATE INDEX idx_pricing_policy_versions_policy_id ON pricing_policy_versions(policy_id);
CREATE INDEX idx_pricing_policy_versions_version ON pricing_policy_versions(policy_id, version);
CREATE INDEX idx_pricing_policy_versions_changed_at ON pricing_policy_versions(changed_at);
```

### 3. Bảng `booking_price_snapshots` (CRITICAL - Theo feedback)

```sql
CREATE TABLE booking_price_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  
  -- Policy reference (for audit)
  pricing_policy_id UUID REFERENCES pricing_policies(id),
  pricing_policy_version INTEGER,
  
  -- Snapshot tại thời điểm booking
  base_price DECIMAL(15,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL,
  
  -- Calculation breakdown (CRITICAL)
  calculation_breakdown JSONB NOT NULL,
  /* Structure:
  {
    "base": {
      "units": 3,
      "price_per_unit": 300000,
      "subtotal": 900000
    },
    "extras": {
      "extra_guest_fee": 150000,
      "weekend_surcharge": 200000,
      "cleaning_fee": 100000,
      "total": 450000
    },
    "discounts": {
      "weekly_discount": -90000,
      "early_bird_discount": 0,
      "total": -90000
    },
    "peak_adjustments": {
      "peak_dates": ["2026-07-15", "2026-07-16"],
      "multiplier": 1.5,
      "adjustment": 300000
    },
    "fees": {
      "service_fee": 50000,
      "total": 50000
    },
    "summary": {
      "subtotal": 900000,
      "extras": 450000,
      "discounts": -90000,
      "peak_adjustments": 300000,
      "fees": 50000,
      "total": 1610000
    },
    "deposits": {
      "booking_hold_deposit": 500000,
      "deposit_amount": 0
    },
    "payable_now": 500000,
    "payable_on_checkin": 1110000
  }
  */
  
  -- Totals (denormalized for quick access)
  subtotal DECIMAL(15,2) NOT NULL,
  total_extras DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_discounts DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_peak_adjustments DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL,
  
  -- Deposits
  booking_hold_deposit DECIMAL(15,2),
  deposit_amount DECIMAL(15,2),
  payable_now DECIMAL(15,2) NOT NULL,
  
  -- Metadata
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  calculated_by VARCHAR(100) NOT NULL, -- 'SYSTEM' or user_id
  
  CONSTRAINT booking_price_snapshots_grand_total_check CHECK (grand_total > 0)
);

CREATE INDEX idx_booking_price_snapshots_booking_id ON booking_price_snapshots(booking_id);
CREATE INDEX idx_booking_price_snapshots_policy ON booking_price_snapshots(pricing_policy_id, pricing_policy_version);
```

### 4. Cập nhật bảng `rentable_items`

```sql
ALTER TABLE rentable_items 
ADD COLUMN pricing_policy_id UUID REFERENCES pricing_policies(id),
ADD COLUMN pricing_policy_version INTEGER,
ADD COLUMN pricing_override JSONB, -- Override specific fields
ADD COLUMN pricing_snapshot_at TIMESTAMP; -- Khi nào snapshot được tạo

CREATE INDEX idx_rentable_items_pricing_policy ON rentable_items(pricing_policy_id, pricing_policy_version);

-- Các cột giá hiện tại GIỮ NGUYÊN để:
-- 1. Denormalized data cho query nhanh
-- 2. Snapshot tại thời điểm gán policy
-- 3. Backward compatibility
```

---

## 🔧 Pricing Details Structure - Enhanced

### SHORT_TERM Pricing Details (Enhanced)

```typescript
interface ShortTermPricingDetails {
  // Extra Fees
  extra_guest_fee?: number;
  extra_guest_threshold?: number;        // Số khách miễn phí (default = max_occupancy)
  weekend_surcharge?: number;
  weekend_days?: string[];               // ['FRIDAY', 'SATURDAY', 'SUNDAY']
  cleaning_fee?: number;
  booking_hold_deposit?: number;
  
  // Discounts (với validation)
  weekly_discount_percent?: number;      // 0-100
  weekly_discount_min_nights?: number;   // Default 7
  monthly_discount_percent?: number;     // 0-100
  monthly_discount_min_nights?: number;  // Default 30
  early_bird_discount_percent?: number;  // 0-100
  early_bird_days_ahead?: number;        // Book X days ahead
  
  // Seasonal Pricing (với validation chống overlap)
  peak_season_dates?: Array<{
    name: string;                        // "Summer 2026"
    start_date: string;                  // YYYY-MM-DD
    end_date: string;
    multiplier: number;                  // >= 1.0
    priority?: number;                   // Nếu overlap, ưu tiên cao hơn
  }>;
  
  // Cancellation
  cancellation_policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  cancellation_fee_percent?: number;
  cancellation_free_hours?: number;      // Hủy miễn phí trong X giờ
  
  // Services
  breakfast_fee?: number;
  breakfast_included?: boolean;
  airport_transfer_fee?: number;
  laundry_fee_per_kg?: number;
  
  // Min/Max constraints
  min_advance_booking_hours?: number;    // Đặt trước tối thiểu
  max_advance_booking_days?: number;     // Đặt trước tối đa
}
```

### Tiered Pricing Structure (NEW)

```typescript
interface TieredPricing {
  mode: 'TIERED';
  tiers: Array<{
    min_units: number;                   // Min nights/months
    max_units?: number;                  // Max nights/months (null = infinity)
    price_per_unit: number;
    description?: string;                // "1-6 nights"
  }>;
}

// Example:
{
  "mode": "TIERED",
  "tiers": [
    {
      "min_units": 1,
      "max_units": 6,
      "price_per_unit": 500000,
      "description": "1-6 đêm"
    },
    {
      "min_units": 7,
      "max_units": 29,
      "price_per_unit": 450000,
      "description": "7-29 đêm (giảm 10%)"
    },
    {
      "min_units": 30,
      "max_units": null,
      "price_per_unit": 400000,
      "description": "30+ đêm (giảm 20%)"
    }
  ]
}
```

---

## 🔄 Workflow - Production Grade

### 1. Tạo Pricing Policy (với Versioning)

```typescript
POST /api/v1/pricing-policies
{
  "name": "Homestay Hà Nội Standard",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "scope_province": "Hà Nội",
  "scope_district": null,
  "pricing_mode": "FIXED",
  "base_price": 300000,
  "price_unit": "NIGHT",
  "min_rent_duration": 1,
  "booking_hold_deposit": 300000,
  "pricing_details": {
    "extra_guest_fee": 50000,
    "extra_guest_threshold": 2,
    "cleaning_fee": 100000,
    "weekly_discount_percent": 10,
    "cancellation_policy": "FLEXIBLE"
  }
}

// Response:
{
  "id": "uuid",
  "version": 1,
  "effective_from": "2026-01-16T10:00:00Z",
  "effective_to": null,
  "status": "ACTIVE"
}
```

### 2. Update Policy (Tạo Version Mới)

```typescript
PATCH /api/v1/pricing-policies/:id
{
  "base_price": 350000,
  "updated_reason": "Tăng giá theo mùa cao điểm",
  "apply_to_existing_items": false, // CRITICAL: Default = false
  "effective_from": "2026-02-01T00:00:00Z"
}

// Backend logic:
// 1. Set effective_to của version cũ = effective_from của version mới
// 2. Tạo policy mới với version + 1
// 3. Lưu vào pricing_policy_versions
// 4. Nếu apply_to_existing_items = true:
//    - Chỉ update items CHƯA có booking active
//    - Items có booking → GIỮ NGUYÊN version cũ
```

### 3. Tạo Rentable Item với Policy

```typescript
POST /api/v1/rentable-items
{
  "name": "Homestay Cozy Room",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "province": "Hà Nội",
  "district": "Ba Đình",
  
  // Chọn policy
  "pricing_policy_id": "uuid",
  
  // Optional: Override một số field
  "pricing_override": {
    "base_price": 320000, // Override base price
    "extra_guest_fee": 60000
  }
}

// Backend logic:
// 1. Tìm policy active phù hợp (category + duration + location)
// 2. Copy pricing từ policy vào item (snapshot)
// 3. Apply override nếu có
// 4. Lưu pricing_policy_id + version để audit
```

### 4. Calculate Price (CRITICAL - Hàm tính giá chuẩn)

```typescript
POST /api/v1/pricing/calculate
{
  "rentable_item_id": "uuid",
  "start_date": "2026-07-15",
  "end_date": "2026-07-25",
  "guests_count": 3
}

// Response (Breakdown chi tiết):
{
  "calculation": {
    "base": {
      "units": 10,
      "price_per_unit": 300000,
      "subtotal": 3000000
    },
    "extras": {
      "extra_guest_fee": {
        "guests": 1,
        "fee_per_guest_per_night": 50000,
        "nights": 10,
        "total": 500000
      },
      "weekend_surcharge": {
        "weekend_nights": 4,
        "surcharge_per_night": 100000,
        "total": 400000
      },
      "cleaning_fee": 100000,
      "total_extras": 1000000
    },
    "discounts": {
      "weekly_discount": {
        "percent": 10,
        "applied_to": 3000000,
        "amount": -300000
      },
      "total_discounts": -300000
    },
    "peak_adjustments": {
      "peak_dates": ["2026-07-15", "2026-07-16"],
      "base_for_peak_nights": 600000,
      "multiplier": 1.5,
      "adjustment": 300000
    },
    "summary": {
      "subtotal": 3000000,
      "extras": 1000000,
      "discounts": -300000,
      "peak_adjustments": 300000,
      "grand_total": 4000000
    },
    "deposits": {
      "booking_hold_deposit": 300000,
      "payable_now": 300000,
      "payable_on_checkin": 3700000
    }
  },
  "pricing_policy": {
    "id": "uuid",
    "version": 1,
    "name": "Homestay Hà Nội Standard"
  }
}
```

### 5. Create Booking (với Price Snapshot)

```typescript
POST /api/v1/bookings
{
  "rentable_item_id": "uuid",
  "start_date": "2026-07-15",
  "end_date": "2026-07-25",
  "guests_count": 3,
  "price_calculation_id": "uuid" // From calculate API
}

// Backend logic:
// 1. Validate price calculation chưa expire (< 30 phút)
// 2. Tạo booking
// 3. Tạo booking_price_snapshot với breakdown đầy đủ
// 4. Snapshot này KHÔNG BAO GIỜ thay đổi
```

---

## ✅ Validation Rules (CRITICAL)

### 1. Peak Season Validation

```typescript
// Không được overlap
function validatePeakSeasons(seasons: PeakSeason[]): ValidationResult {
  for (let i = 0; i < seasons.length; i++) {
    for (let j = i + 1; j < seasons.length; j++) {
      if (isOverlap(seasons[i], seasons[j])) {
        // Option 1: Reject
        return { valid: false, error: "Peak seasons overlap" };
        
        // Option 2: Auto-resolve by priority
        if (seasons[i].priority > seasons[j].priority) {
          // Keep i, remove j
        }
      }
    }
  }
  return { valid: true };
}

// Multiplier >= 1.0
function validateMultiplier(multiplier: number): boolean {
  return multiplier >= 1.0;
}
```

### 2. Discount Validation

```typescript
function validateDiscounts(details: PricingDetails): ValidationResult {
  // Percent phải 0-100
  if (details.weekly_discount_percent < 0 || details.weekly_discount_percent > 100) {
    return { valid: false, error: "Discount percent must be 0-100" };
  }
  
  // Tổng discount không được > 100%
  const totalDiscount = 
    (details.weekly_discount_percent || 0) +
    (details.monthly_discount_percent || 0) +
    (details.early_bird_discount_percent || 0);
    
  if (totalDiscount > 100) {
    return { valid: false, error: "Total discounts cannot exceed 100%" };
  }
  
  return { valid: true };
}
```

### 3. Deposit Validation (Theo feedback)

```typescript
function validateDeposits(policy: PricingPolicy): ValidationResult {
  if (policy.rental_duration_type === 'SHORT_TERM') {
    // SHORT_TERM: booking_hold_deposit required
    if (!policy.booking_hold_deposit) {
      return { valid: false, error: "booking_hold_deposit required for SHORT_TERM" };
    }
  } else {
    // MID/LONG_TERM: deposit_amount required
    if (!policy.deposit_amount) {
      return { valid: false, error: "deposit_amount required for MID/LONG_TERM" };
    }
  }
  return { valid: true };
}
```

---

## 🎯 Price Calculation Engine (Production Grade)

```typescript
class PriceCalculationEngine {
  calculate(params: CalculationParams): PriceBreakdown {
    const { item, startDate, endDate, guestsCount } = params;
    const policy = item.pricingPolicy;
    const details = policy.pricing_details;
    
    // 1. Calculate base
    const units = this.calculateUnits(startDate, endDate, policy.price_unit);
    const basePrice = this.getBasePrice(policy, units); // Support TIERED
    const subtotal = basePrice * units;
    
    // 2. Calculate extras
    const extras = {
      extra_guest: this.calculateExtraGuestFee(guestsCount, details, units),
      weekend: this.calculateWeekendSurcharge(startDate, endDate, details),
      cleaning: details.cleaning_fee || 0,
      services: this.calculateServiceFees(details),
      total: 0
    };
    extras.total = Object.values(extras).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    
    // 3. Calculate discounts
    const discounts = {
      weekly: this.calculateWeeklyDiscount(units, subtotal, details),
      monthly: this.calculateMonthlyDiscount(units, subtotal, details),
      early_bird: this.calculateEarlyBirdDiscount(startDate, subtotal, details),
      total: 0
    };
    discounts.total = Object.values(discounts).reduce((sum, val) => sum + val, 0);
    
    // 4. Calculate peak adjustments
    const peakAdjustments = this.calculatePeakAdjustments(
      startDate, endDate, basePrice, details.peak_season_dates
    );
    
    // 5. Calculate fees
    const fees = {
      service: policy.service_fee || 0,
      building_management: policy.building_management_fee || 0,
      total: (policy.service_fee || 0) + (policy.building_management_fee || 0)
    };
    
    // 6. Grand total
    const grandTotal = subtotal + extras.total + discounts.total + peakAdjustments.total + fees.total;
    
    // 7. Deposits
    const deposits = {
      booking_hold_deposit: policy.booking_hold_deposit || 0,
      deposit_amount: policy.deposit_amount || 0,
      payable_now: policy.booking_hold_deposit || policy.deposit_amount || 0,
      payable_later: grandTotal - (policy.booking_hold_deposit || policy.deposit_amount || 0)
    };
    
    return {
      base: { units, price_per_unit: basePrice, subtotal },
      extras,
      discounts,
      peak_adjustments: peakAdjustments,
      fees,
      summary: {
        subtotal,
        total_extras: extras.total,
        total_discounts: discounts.total,
        total_peak_adjustments: peakAdjustments.total,
        total_fees: fees.total,
        grand_total: grandTotal
      },
      deposits,
      pricing_policy: {
        id: policy.id,
        version: policy.version,
        name: policy.name
      }
    };
  }
  
  private getBasePrice(policy: PricingPolicy, units: number): number {
    if (policy.pricing_mode === 'TIERED' && policy.tiered_pricing) {
      // Find applicable tier
      const tier = policy.tiered_pricing.tiers.find(t => 
        units >= t.min_units && (t.max_units === null || units <= t.max_units)
      );
      return tier ? tier.price_per_unit : policy.base_price;
    }
    return policy.base_price;
  }
  
  private calculatePeakAdjustments(
    startDate: Date,
    endDate: Date,
    basePrice: number,
    peakSeasons?: PeakSeason[]
  ): PeakAdjustment {
    if (!peakSeasons || peakSeasons.length === 0) {
      return { peak_dates: [], total: 0 };
    }
    
    let totalAdjustment = 0;
    const peakDates: string[] = [];
    
    // Iterate through each day
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Find applicable peak season (highest priority if overlap)
      const applicableSeason = peakSeasons
        .filter(s => this.isDateInRange(date, s.start_date, s.end_date))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
      
      if (applicableSeason) {
        peakDates.push(dateStr);
        totalAdjustment += basePrice * (applicableSeason.multiplier - 1);
      }
    }
    
    return {
      peak_dates: peakDates,
      total: totalAdjustment
    };
  }
}
```

---

## 📋 API Endpoints - Complete

```typescript
// Pricing Policies
GET    /api/v1/pricing-policies                    // List policies
GET    /api/v1/pricing-policies/:id                // Get policy detail
GET    /api/v1/pricing-policies/:id/versions       // Get version history
POST   /api/v1/pricing-policies                    // Create policy
PATCH  /api/v1/pricing-policies/:id                // Update (create new version)
DELETE /api/v1/pricing-policies/:id                // Archive policy

// Policy Filtering
GET    /api/v1/pricing-policies/applicable         // Get applicable policies
  ?property_category=HOMESTAY
  &rental_duration_type=SHORT_TERM
  &province=Hà Nội
  &district=Ba Đình

// Price Calculation
POST   /api/v1/pricing/calculate                   // Calculate price
POST   /api/v1/pricing/validate                    // Validate pricing setup

// Booking Price Snapshots
GET    /api/v1/bookings/:id/price-snapshot         // Get booking price snapshot
```

---

## 🎨 UI Components

### Policy Selector Component

```typescript
<PricingPolicySelector
  propertyCategory="HOMESTAY"
  rentalDurationType="SHORT_TERM"
  province="Hà Nội"
  district="Ba Đình"
  onSelect={(policy) => {
    // Preview policy
    // Allow override
  }}
  showPreview={true}
  allowOverride={true}
/>
```

### Price Calculator Component

```typescript
<PriceCalculator
  rentableItemId="uuid"
  onCalculate={(breakdown) => {
    // Show breakdown
    // Allow booking
  }}
/>
```

---

## ✅ Implementation Checklist

### Phase 1: Database & Core
- [ ] Create `pricing_policies` table with versioning
- [ ] Create `pricing_policy_versions` table
- [ ] Create `booking_price_snapshots` table
- [ ] Update `rentable_items` table
- [ ] Create Prisma models
- [ ] Create migrations

### Phase 2: Backend Logic
- [ ] PricingPolicyService (CRUD + versioning)
- [ ] PriceCalculationEngine (với tất cả rules)
- [ ] Validation service (peak seasons, discounts, deposits)
- [ ] Snapshot service (booking price snapshots)
- [ ] DTOs & Controllers

### Phase 3: Frontend
- [ ] Pricing Policies management page
- [ ] Create/Edit policy form (dynamic by type)
- [ ] Policy selector component
- [ ] Price calculator component
- [ ] Price breakdown display

### Phase 4: Testing & Migration
- [ ] Unit tests cho calculation engine
- [ ] Integration tests cho booking flow
- [ ] Create default policies
- [ ] Migrate existing items to policies
- [ ] Data validation

---

## 🎯 Summary

Hệ thống Pricing Policy V2 đã được thiết kế production-grade với:

✅ **Versioning đầy đủ** - Mọi thay đổi có version mới  
✅ **Price snapshot** - Giá đóng băng tại booking  
✅ **Audit trail** - Lịch sử thay đổi rõ ràng  
✅ **Geographic scope** - Giá theo khu vực  
✅ **Tiered pricing** - Hỗ trợ giá bậc thang  
✅ **Validation chặt chẽ** - Chống overlap, discount hợp lệ  
✅ **Calculation engine** - Tính giá chính xác với breakdown  
✅ **Deposit rules** - Phân biệt rõ SHORT/MID/LONG  

**Production-ready và đáp ứng tất cả feedback!** 🚀
