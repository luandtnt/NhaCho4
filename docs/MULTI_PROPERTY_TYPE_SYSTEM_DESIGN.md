# Thiết kế Hệ thống Đa Loại hình Cho thuê
**Version**: 1.0  
**Date**: 2026-01-15  
**Author**: URP Platform Team

## Tổng quan

Hệ thống URP Platform được thiết kế để quản lý nhiều loại hình bất động sản cho thuê với các đặc điểm khác nhau về thời gian thuê, đối tượng khách hàng, và cách tính giá.

### Phân loại chính

1. **Ngắn hạn** (< 1 tháng): Du lịch, lưu trú tạm thời
2. **Trung hạn** (1-6 tháng): Tạm trú, công tác
3. **Dài hạn** (> 6 tháng): Cư trú ổn định, kinh doanh

---

## 1. Cấu trúc dữ liệu

### 1.1 Property Categories (Danh mục loại hình)

```typescript
enum PropertyCategory {
  // Ngắn hạn
  HOMESTAY = 'HOMESTAY',
  GUESTHOUSE = 'GUESTHOUSE',
  HOTEL = 'HOTEL',
  SERVICED_APARTMENT_SHORT = 'SERVICED_APARTMENT_SHORT',
  VILLA_RESORT = 'VILLA_RESORT',
  AIRBNB_ROOM = 'AIRBNB_ROOM',
  COLIVING_SHORT = 'COLIVING_SHORT',
  
  // Trung hạn
  PRIVATE_HOUSE = 'PRIVATE_HOUSE',
  ROOM_RENTAL = 'ROOM_RENTAL',
  APARTMENT = 'APARTMENT',
  SERVICED_APARTMENT_MEDIUM = 'SERVICED_APARTMENT_MEDIUM',
  WHOLE_HOUSE = 'WHOLE_HOUSE',
  RETAIL_SPACE_SMALL = 'RETAIL_SPACE_SMALL',
  WAREHOUSE_TEMP = 'WAREHOUSE_TEMP',
  
  // Dài hạn
  OFFICE = 'OFFICE',
  LAND = 'LAND',
  WAREHOUSE = 'WAREHOUSE',
  COMMERCIAL_SPACE = 'COMMERCIAL_SPACE',
  LUXURY_APARTMENT = 'LUXURY_APARTMENT',
  VILLA = 'VILLA',
  SHOPHOUSE = 'SHOPHOUSE',
}

enum RentalDurationType {
  SHORT_TERM = 'SHORT_TERM',      // < 1 tháng
  MEDIUM_TERM = 'MEDIUM_TERM',    // 1-6 tháng
  LONG_TERM = 'LONG_TERM',        // > 6 tháng
}

enum PricingUnit {
  PER_NIGHT = 'PER_NIGHT',        // Theo đêm
  PER_WEEK = 'PER_WEEK',          // Theo tuần
  PER_MONTH = 'PER_MONTH',        // Theo tháng
  PER_QUARTER = 'PER_QUARTER',    // Theo quý
  PER_YEAR = 'PER_YEAR',          // Theo năm
  PER_SQM_MONTH = 'PER_SQM_MONTH', // Theo m²/tháng
}

enum TargetCustomer {
  TOURIST = 'TOURIST',            // Du khách
  BACKPACKER = 'BACKPACKER',      // Phượt thủ
  BUSINESS_TRIP = 'BUSINESS_TRIP', // Công tác
  STUDENT = 'STUDENT',            // Sinh viên
  WORKER = 'WORKER',              // Công nhân
  FAMILY = 'FAMILY',              // Gia đình
  EXPAT = 'EXPAT',                // Người nước ngoài
  STARTUP = 'STARTUP',            // Startup
  ENTERPRISE = 'ENTERPRISE',      // Doanh nghiệp
  INVESTOR = 'INVESTOR',          // Nhà đầu tư
}
```

### 1.2 Rentable Item Schema (Mở rộng)

```typescript
interface RentableItem {
  // Existing fields
  id: string;
  asset_id: string;
  space_node_id?: string;
  code: string;
  allocation_type: 'EXCLUSIVE' | 'SHARED';
  capacity: number;
  
  // NEW: Property classification
  property_category: PropertyCategory;
  rental_duration_type: RentalDurationType;
  target_customers: TargetCustomer[];
  
  // NEW: Rental constraints
  min_rental_days: number;        // Số ngày thuê tối thiểu
  max_rental_days?: number;       // Số ngày thuê tối đa (null = không giới hạn)
  pricing_unit: PricingUnit;
  
  // NEW: Property details
  area_sqm?: number;              // Diện tích (m²)
  bedrooms?: number;              // Số phòng ngủ
  bathrooms?: number;             // Số phòng tắm
  floor_number?: number;          // Tầng số
  
  // NEW: Amenities & Features
  amenities: string[];            // ['wifi', 'ac', 'kitchen', 'parking', ...]
  house_rules: string[];          // ['no_smoking', 'no_pets', ...]
  
  // NEW: Booking settings
  instant_booking: boolean;       // Đặt ngay không cần xác nhận
  advance_booking_days: number;   // Đặt trước bao nhiêu ngày
  cancellation_policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  
  // Existing
  attrs: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### 1.3 Pricing Policy Schema (Mở rộng)

```typescript
interface PricingPolicy {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  
  // NEW: Pricing by duration type
  pricing_rules: {
    // Base pricing
    base_amount: number;
    pricing_unit: PricingUnit;
    currency: string;
    
    // Duration-based discounts
    duration_discounts?: {
      min_days: number;
      max_days?: number;
      discount_percent: number;
    }[];
    
    // Seasonal pricing (ngắn hạn)
    seasonal_rates?: {
      start_date: string;
      end_date: string;
      rate_multiplier: number;  // 1.5 = tăng 50%
      name: string;             // "Tết", "Hè", "Cuối tuần"
    }[];
    
    // Day-of-week pricing (ngắn hạn)
    weekday_rates?: {
      monday?: number;
      tuesday?: number;
      wednesday?: number;
      thursday?: number;
      friday?: number;
      saturday?: number;
      sunday?: number;
    };
    
    // Long-term escalation (dài hạn)
    annual_increase_percent?: number;  // Tăng giá hàng năm
  };
  
  // Fees
  fees: {
    cleaning_fee?: number;
    service_fee_percent?: number;
    deposit_amount?: number;
    deposit_months?: number;  // Đặt cọc bao nhiêu tháng
  };
  
  // Effective dates
  effective_from: string;
  effective_to?: string;
}
```

---

## 2. Mapping Loại hình với Cấu hình

### 2.1 Ngắn hạn (< 1 tháng)

| Loại hình | Category | Min Days | Pricing Unit | Target Customer | Amenities Key |
|-----------|----------|----------|--------------|-----------------|---------------|
| Homestay | HOMESTAY | 1 | PER_NIGHT | TOURIST, BACKPACKER | wifi, kitchen, local_experience |
| Nhà nghỉ | GUESTHOUSE | 1 | PER_NIGHT | TOURIST, BUSINESS_TRIP | wifi, parking |
| Khách sạn | HOTEL | 1 | PER_NIGHT | TOURIST, BUSINESS_TRIP | room_service, breakfast, gym |
| Căn hộ dịch vụ | SERVICED_APARTMENT_SHORT | 3 | PER_NIGHT | FAMILY, BUSINESS_TRIP | kitchen, washing_machine, housekeeping |
| Villa nghỉ dưỡng | VILLA_RESORT | 2 | PER_NIGHT | FAMILY, TOURIST | pool, garden, bbq |
| Phòng Airbnb | AIRBNB_ROOM | 1 | PER_NIGHT | BACKPACKER, TOURIST | wifi, shared_space |
| Co-living ngắn | COLIVING_SHORT | 1 | PER_NIGHT | BACKPACKER, STUDENT | coworking, community |

**Đặc điểm chung:**
- Booking theo ngày/đêm
- Calendar view theo ngày
- Giá có thể thay đổi theo ngày trong tuần, mùa
- Instant booking phổ biến
- Cancellation policy linh hoạt hơn

### 2.2 Trung hạn (1-6 tháng)

| Loại hình | Category | Min Days | Pricing Unit | Target Customer | Deposit Months |
|-----------|----------|----------|--------------|-----------------|----------------|
| Nhà đất | PRIVATE_HOUSE | 30 | PER_MONTH | FAMILY | 1-2 |
| Phòng trọ | ROOM_RENTAL | 30 | PER_MONTH | STUDENT, WORKER | 1 |
| Chung cư | APARTMENT | 30 | PER_MONTH | FAMILY, EXPAT | 1-2 |
| Căn hộ dịch vụ | SERVICED_APARTMENT_MEDIUM | 30 | PER_MONTH | EXPAT, BUSINESS_TRIP | 1 |
| Nhà nguyên căn | WHOLE_HOUSE | 30 | PER_MONTH | FAMILY | 2 |
| Mặt bằng nhỏ | RETAIL_SPACE_SMALL | 30 | PER_MONTH | STARTUP | 2-3 |
| Kho tạm | WAREHOUSE_TEMP | 30 | PER_MONTH | STARTUP | 1 |

**Đặc điểm chung:**
- Booking theo tháng
- Calendar view theo tháng
- Giá cố định hoặc giảm theo thời gian thuê
- Cần xác nhận từ chủ nhà
- Hợp đồng đơn giản hơn dài hạn

### 2.3 Dài hạn (> 6 tháng)

| Loại hình | Category | Min Days | Pricing Unit | Target Customer | Contract Years |
|-----------|----------|----------|--------------|-----------------|----------------|
| Văn phòng | OFFICE | 180 | PER_SQM_MONTH | ENTERPRISE, STARTUP | 1-5 |
| Đất nền | LAND | 365 | PER_MONTH | INVESTOR | 5-20 |
| Nhà xưởng | WAREHOUSE | 365 | PER_SQM_MONTH | ENTERPRISE | 3-10 |
| Mặt bằng thương mại | COMMERCIAL_SPACE | 365 | PER_MONTH | ENTERPRISE | 3-10 |
| Chung cư cao cấp | LUXURY_APARTMENT | 180 | PER_MONTH | EXPAT, FAMILY | 1-3 |
| Biệt thự | VILLA | 365 | PER_MONTH | EXPAT, ENTERPRISE | 1-5 |
| Nhà phố kinh doanh | SHOPHOUSE | 365 | PER_MONTH | ENTERPRISE | 3-5 |

**Đặc điểm chung:**
- Booking theo năm
- Calendar view theo quý/năm
- Giá tăng hàng năm (escalation)
- Hợp đồng chính thức, công chứng
- Đặt cọc cao (2-3 tháng)
- Điều khoản phức tạp (bảo trì, sửa chữa, môi trường)

---

## 3. Luồng nghiệp vụ theo loại hình

### 3.1 Luồng Ngắn hạn (Homestay, Khách sạn)

```
Landlord:
1. Tạo Asset (Homestay/Khách sạn)
2. Tạo Space Tree (Tầng → Phòng)
3. Tạo Rentable Item với:
   - property_category = HOMESTAY
   - rental_duration_type = SHORT_TERM
   - min_rental_days = 1
   - pricing_unit = PER_NIGHT
4. Tạo Pricing Policy:
   - Base rate: 500k/đêm
   - Weekend rate: 700k/đêm
   - Tết rate: 1.5x
5. Tạo Listing → Publish

Tenant:
1. Discover → Filter (Ngắn hạn, Homestay)
2. Xem chi tiết → Check calendar availability
3. Chọn ngày check-in/check-out
4. Booking (instant hoặc request)
5. Thanh toán online
6. Nhận confirmation

Landlord:
7. (Nếu request) Xác nhận booking
8. Check-in tenant
9. Check-out tenant
10. Review
```

### 3.2 Luồng Trung hạn (Phòng trọ, Chung cư)

```
Landlord:
1. Tạo Asset (Nhà trọ/Chung cư)
2. Tạo Space Tree (Tầng → Phòng)
3. Tạo Rentable Item với:
   - property_category = ROOM_RENTAL
   - rental_duration_type = MEDIUM_TERM
   - min_rental_days = 30
   - pricing_unit = PER_MONTH
4. Tạo Pricing Policy:
   - Base: 3 triệu/tháng
   - Discount: Thuê 3 tháng giảm 5%, 6 tháng giảm 10%
   - Deposit: 1 tháng
5. Tạo Listing → Publish

Tenant:
1. Discover → Filter (Trung hạn, Phòng trọ)
2. Xem chi tiết
3. Gửi inquiry (hỏi thêm thông tin)
4. Landlord trả lời
5. Tenant tạo booking request (chọn số tháng)
6. Landlord xác nhận
7. Ký hợp đồng đơn giản (trong app)
8. Thanh toán đặt cọc + tháng đầu
9. Move-in

Landlord:
10. Tạo invoice hàng tháng
11. Tenant thanh toán
12. Gia hạn hoặc kết thúc
```

### 3.3 Luồng Dài hạn (Văn phòng, Nhà xưởng)

```
Landlord:
1. Tạo Asset (Tòa nhà văn phòng)
2. Tạo Space Tree (Tầng → Văn phòng)
3. Tạo Rentable Item với:
   - property_category = OFFICE
   - rental_duration_type = LONG_TERM
   - min_rental_days = 365
   - pricing_unit = PER_SQM_MONTH
   - area_sqm = 100
4. Tạo Pricing Policy:
   - Base: 300k/m²/tháng
   - Annual increase: 5%
   - Deposit: 3 tháng
5. Tạo Listing → Publish (hoặc private)

Tenant (Enterprise):
1. Discover → Filter (Dài hạn, Văn phòng)
2. Xem chi tiết
3. Gửi inquiry với yêu cầu cụ thể
4. Landlord trả lời, có thể negotiate
5. Site visit (xem trực tiếp)
6. Tạo booking request (chọn số năm)
7. Landlord xác nhận
8. Tạo Agreement (hợp đồng chính thức)
9. Ký hợp đồng (có thể offline, công chứng)
10. Thanh toán đặt cọc lớn
11. Move-in

Landlord:
12. Tạo invoice hàng tháng/quý
13. Tenant thanh toán
14. Hàng năm: Tăng giá theo hợp đồng
15. Gia hạn hoặc kết thúc (thông báo trước 3-6 tháng)
```

---

## 4. UI/UX Design theo loại hình

### 4.1 Rentable Item Creation Form

**Step 1: Chọn loại hình**
```
┌─────────────────────────────────────────┐
│  Chọn loại hình cho thuê                │
├─────────────────────────────────────────┤
│                                         │
│  ⏱️ Ngắn hạn (< 1 tháng)               │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │🏠    │ │🏨    │ │🏖️    │           │
│  │Home  │ │Hotel │ │Villa │           │
│  │stay  │ │      │ │      │           │
│  └──────┘ └──────┘ └──────┘           │
│                                         │
│  📅 Trung hạn (1-6 tháng)              │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │🏘️    │ │🏢    │ │🛏️    │           │
│  │Chung │ │Nhà   │ │Phòng │           │
│  │cư    │ │riêng │ │trọ   │           │
│  └──────┘ └──────┘ └──────┘           │
│                                         │
│  📆 Dài hạn (> 6 tháng)                │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │🏢    │ │🏭    │ │🏬    │           │
│  │Văn   │ │Nhà   │ │Mặt   │           │
│  │phòng │ │xưởng │ │bằng  │           │
│  └──────┘ └──────┘ └──────┘           │
└─────────────────────────────────────────┘
```

**Step 2: Form động theo loại**

Nếu chọn HOMESTAY:
```
- Tên phòng/nhà *
- Số khách tối đa *
- Số phòng ngủ *
- Số phòng tắm *
- Diện tích (m²)
- Tiện nghi: [x] Wifi [x] Bếp [x] Máy giặt [ ] Hồ bơi
- Quy định: [ ] Không hút thuốc [x] Không thú cưng
- Đặt trước tối thiểu: 1 ngày
- Đặt ngay không cần xác nhận: [x] Có [ ] Không
- Chính sách hủy: [Linh hoạt ▼]
```

Nếu chọn OFFICE:
```
- Tên văn phòng *
- Diện tích (m²) *
- Tầng số *
- Sức chứa (người)
- Tiện nghi: [x] Điều hòa [x] Thang máy [x] Bãi đỗ xe
- Giá thuê: _____ VND/m²/tháng
- Thời gian thuê tối thiểu: 12 tháng
- Đặt cọc: 3 tháng
- Tăng giá hàng năm: 5%
```

### 4.2 Discover/Search Page

**Filter theo loại hình:**
```
┌─────────────────────────────────────────┐
│  🔍 Tìm kiếm                            │
├─────────────────────────────────────────┤
│  Thời gian thuê:                        │
│  ( ) Ngắn hạn  ( ) Trung hạn  ( ) Dài  │
│                                         │
│  Loại hình:                             │
│  [ ] Homestay  [ ] Khách sạn           │
│  [ ] Phòng trọ [ ] Chung cư            │
│  [ ] Văn phòng [ ] Nhà xưởng           │
│                                         │
│  Khu vực: [Hà Nội ▼]                   │
│  Giá: [___] - [___] VND/[đêm ▼]        │
│  Số người: [2 ▼]                       │
│  Tiện nghi: [x] Wifi [ ] Bếp [ ] Pool  │
└─────────────────────────────────────────┘
```

**Kết quả hiển thị:**

Ngắn hạn:
```
┌────────────────────────────────┐
│ [Ảnh]  Homestay Hội An         │
│        ⭐ 4.8 (120 reviews)     │
│        📍 Hội An, Quảng Nam    │
│        👥 4 khách • 🛏️ 2 phòng │
│        💰 500k/đêm              │
│        ✓ Đặt ngay              │
└────────────────────────────────┘
```

Dài hạn:
```
┌────────────────────────────────┐
│ [Ảnh]  Văn phòng Keangnam      │
│        📍 Cầu Giấy, Hà Nội     │
│        📐 100m² • Tầng 15      │
│        💰 300k/m²/tháng         │
│        📅 Tối thiểu 12 tháng   │
│        📞 Liên hệ xem          │
└────────────────────────────────┘
```

### 4.3 Booking Calendar

**Ngắn hạn (theo ngày):**
```
        Tháng 1/2026
  CN  T2  T3  T4  T5  T6  T7
       1   2   3   4   5   6
  🟢  🟢  🔴  🔴  🟢  🟡  🟡
  7   8   9  10  11  12  13
  🟢  🟢  🟢  🔴  🔴  🔴  🟡
  
🟢 Còn trống  🔴 Đã đặt  🟡 Cuối tuần (giá cao)
```

**Trung hạn (theo tháng):**
```
        Năm 2026
  T1  T2  T3  T4  T5  T6
  🔴  🔴  🟢  🟢  🟢  🟢
  
  T7  T8  T9  T10 T11 T12
  🟢  🟢  🟢  🟢  🟢  🟢
  
🟢 Còn trống  🔴 Đã thuê
```

**Dài hạn (theo năm):**
```
  2026      2027      2028
  🔴        🔴        🟢
  
Đã thuê đến: 31/12/2027
Có thể đặt từ: 01/01/2028
```

---

## 5. Database Schema Changes

### 5.1 Migration Plan

**Phase 1: Add new columns to rentable_items**
```sql
ALTER TABLE rentable_items ADD COLUMN property_category VARCHAR(50);
ALTER TABLE rentable_items ADD COLUMN rental_duration_type VARCHAR(20);
ALTER TABLE rentable_items ADD COLUMN min_rental_days INTEGER DEFAULT 1;
ALTER TABLE rentable_items ADD COLUMN max_rental_days INTEGER;
ALTER TABLE rentable_items ADD COLUMN pricing_unit VARCHAR(20) DEFAULT 'PER_NIGHT';
ALTER TABLE rentable_items ADD COLUMN area_sqm DECIMAL(10,2);
ALTER TABLE rentable_items ADD COLUMN bedrooms INTEGER;
ALTER TABLE rentable_items ADD COLUMN bathrooms INTEGER;
ALTER TABLE rentable_items ADD COLUMN floor_number INTEGER;
ALTER TABLE rentable_items ADD COLUMN amenities JSONB DEFAULT '[]';
ALTER TABLE rentable_items ADD COLUMN house_rules JSONB DEFAULT '[]';
ALTER TABLE rentable_items ADD COLUMN instant_booking BOOLEAN DEFAULT false;
ALTER TABLE rentable_items ADD COLUMN advance_booking_days INTEGER DEFAULT 1;
ALTER TABLE rentable_items ADD COLUMN cancellation_policy VARCHAR(20) DEFAULT 'MODERATE';

-- Indexes
CREATE INDEX idx_rentable_items_category ON rentable_items(property_category);
CREATE INDEX idx_rentable_items_duration ON rentable_items(rental_duration_type);
CREATE INDEX idx_rentable_items_amenities ON rentable_items USING GIN(amenities);
```

**Phase 2: Update pricing_policies config structure**
```sql
-- pricing_policies.config sẽ chứa:
{
  "name": "Giá homestay Hội An",
  "config": {
    "base_amount": 500000,
    "pricing_unit": "PER_NIGHT",
    "currency": "VND",
    "duration_discounts": [
      {"min_days": 7, "max_days": 13, "discount_percent": 10},
      {"min_days": 14, "discount_percent": 15}
    ],
    "seasonal_rates": [
      {
        "name": "Tết Nguyên Đán",
        "start_date": "2026-01-28",
        "end_date": "2026-02-03",
        "rate_multiplier": 1.5
      }
    ],
    "weekday_rates": {
      "friday": 600000,
      "saturday": 700000,
      "sunday": 700000
    }
  },
  "fees": {
    "cleaning_fee": 100000,
    "service_fee_percent": 10,
    "deposit_amount": 500000
  }
}
```

### 5.2 New Tables

**property_categories (Reference table)**
```sql
CREATE TABLE property_categories (
  code VARCHAR(50) PRIMARY KEY,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  duration_type VARCHAR(20) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  typical_pricing_unit VARCHAR(20),
  typical_min_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO property_categories VALUES
('HOMESTAY', 'Homestay', 'Homestay', 'SHORT_TERM', '🏠', 'Nhà dân cho thuê ngắn hạn', 'PER_NIGHT', 1),
('HOTEL', 'Khách sạn', 'Hotel', 'SHORT_TERM', '🏨', 'Khách sạn chuyên nghiệp', 'PER_NIGHT', 1),
('ROOM_RENTAL', 'Phòng trọ', 'Room Rental', 'MEDIUM_TERM', '🛏️', 'Phòng trọ cho sinh viên, công nhân', 'PER_MONTH', 30),
('APARTMENT', 'Chung cư', 'Apartment', 'MEDIUM_TERM', '🏢', 'Căn hộ chung cư', 'PER_MONTH', 30),
('OFFICE', 'Văn phòng', 'Office', 'LONG_TERM', '🏢', 'Văn phòng làm việc', 'PER_SQM_MONTH', 365),
('WAREHOUSE', 'Nhà xưởng', 'Warehouse', 'LONG_TERM', '🏭', 'Nhà xưởng sản xuất', 'PER_SQM_MONTH', 365);
```

**amenities (Reference table)**
```sql
CREATE TABLE amenities (
  code VARCHAR(50) PRIMARY KEY,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50), -- 'BASIC', 'KITCHEN', 'BATHROOM', 'ENTERTAINMENT', 'SAFETY'
  applicable_to JSONB -- ['HOMESTAY', 'HOTEL', ...]
);

-- Seed data
INSERT INTO amenities VALUES
('wifi', 'Wifi', 'Wifi', '📶', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE"]'),
('ac', 'Điều hòa', 'Air Conditioning', '❄️', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE"]'),
('kitchen', 'Bếp', 'Kitchen', '🍳', 'KITCHEN', '["HOMESTAY","APARTMENT"]'),
('pool', 'Hồ bơi', 'Swimming Pool', '🏊', 'ENTERTAINMENT', '["HOTEL","VILLA_RESORT"]'),
('parking', 'Bãi đỗ xe', 'Parking', '🅿️', 'BASIC', '["HOTEL","APARTMENT","OFFICE","WAREHOUSE"]'),
('elevator', 'Thang máy', 'Elevator', '🛗', 'BASIC', '["APARTMENT","OFFICE"]'),
('security', 'Bảo vệ 24/7', 'Security', '🔒', 'SAFETY', '["APARTMENT","OFFICE","WAREHOUSE"]');
```

---

## 6. Backend API Changes

### 6.1 New Endpoints

**GET /api/v1/property-categories**
```json
Response:
{
  "data": [
    {
      "code": "HOMESTAY",
      "name_vi": "Homestay",
      "duration_type": "SHORT_TERM",
      "icon": "🏠",
      "typical_pricing_unit": "PER_NIGHT",
      "typical_min_days": 1
    }
  ]
}
```

**GET /api/v1/amenities**
```json
Response:
{
  "data": [
    {
      "code": "wifi",
      "name_vi": "Wifi",
      "icon": "📶",
      "category": "BASIC"
    }
  ]
}
```

**GET /api/v1/rentable-items (Enhanced)**
```
Query params:
- property_category: HOMESTAY,HOTEL
- rental_duration_type: SHORT_TERM
- min_price: 100000
- max_price: 1000000
- amenities: wifi,kitchen,pool
- location: hanoi
- bedrooms: 2
- guests: 4
```

### 6.2 Updated Endpoints

**POST /api/v1/rentable-items**
```json
Request:
{
  "asset_id": "uuid",
  "space_node_id": "uuid",
  "code": "ROOM-101",
  "allocation_type": "EXCLUSIVE",
  "capacity": 4,
  
  // NEW fields
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "min_rental_days": 1,
  "max_rental_days": 30,
  "pricing_unit": "PER_NIGHT",
  "area_sqm": 50,
  "bedrooms": 2,
  "bathrooms": 1,
  "amenities": ["wifi", "ac", "kitchen"],
  "house_rules": ["no_smoking", "no_pets"],
  "instant_booking": true,
  "advance_booking_days": 1,
  "cancellation_policy": "FLEXIBLE"
}
```

**POST /api/v1/bookings (Enhanced)**
```json
Request:
{
  "rentable_item_id": "uuid",
  "start_time": "2026-02-01T14:00:00Z",
  "end_time": "2026-02-05T12:00:00Z",
  "quantity": 1,
  
  // NEW: Calculated fields
  "total_nights": 4,  // Auto-calculated
  "base_price": 500000,
  "seasonal_adjustment": 0,
  "duration_discount": 0,
  "cleaning_fee": 100000,
  "service_fee": 60000,
  "total_price": 2160000,
  
  // Guest info
  "guest_count": 2,
  "guest_name": "Nguyen Van A",
  "guest_phone": "0901234567",
  "special_requests": "Cần giường phụ cho trẻ em"
}
```

---

## 7. Pricing Calculation Logic

### 7.1 Ngắn hạn (Per Night)

```typescript
function calculateShortTermPrice(
  booking: {
    start_date: Date,
    end_date: Date,
    guests: number
  },
  item: RentableItem,
  policy: PricingPolicy
): PriceBreakdown {
  const nights = calculateNights(booking.start_date, booking.end_date);
  let totalPrice = 0;
  
  // Calculate each night
  for (let i = 0; i < nights; i++) {
    const currentDate = addDays(booking.start_date, i);
    const dayOfWeek = currentDate.getDay();
    
    // 1. Base price
    let nightPrice = policy.pricing_rules.base_amount;
    
    // 2. Weekday adjustment
    if (policy.pricing_rules.weekday_rates) {
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      nightPrice = policy.pricing_rules.weekday_rates[dayName] || nightPrice;
    }
    
    // 3. Seasonal adjustment
    const seasonalRate = policy.pricing_rules.seasonal_rates?.find(
      s => currentDate >= new Date(s.start_date) && currentDate <= new Date(s.end_date)
    );
    if (seasonalRate) {
      nightPrice *= seasonalRate.rate_multiplier;
    }
    
    totalPrice += nightPrice;
  }
  
  // 4. Duration discount
  const durationDiscount = policy.pricing_rules.duration_discounts?.find(
    d => nights >= d.min_days && (!d.max_days || nights <= d.max_days)
  );
  if (durationDiscount) {
    totalPrice *= (1 - durationDiscount.discount_percent / 100);
  }
  
  // 5. Fees
  const cleaningFee = policy.fees.cleaning_fee || 0;
  const serviceFee = totalPrice * (policy.fees.service_fee_percent || 0) / 100;
  
  return {
    base_price: totalPrice,
    cleaning_fee: cleaningFee,
    service_fee: serviceFee,
    total_price: totalPrice + cleaningFee + serviceFee,
    nights: nights,
    breakdown: {
      per_night_avg: totalPrice / nights,
      duration_discount_applied: durationDiscount?.discount_percent || 0
    }
  };
}
```

### 7.2 Trung hạn (Per Month)

```typescript
function calculateMediumTermPrice(
  booking: {
    start_date: Date,
    end_date: Date
  },
  item: RentableItem,
  policy: PricingPolicy
): PriceBreakdown {
  const months = calculateMonths(booking.start_date, booking.end_date);
  
  // 1. Base monthly price
  let monthlyPrice = policy.pricing_rules.base_amount;
  let totalPrice = monthlyPrice * months;
  
  // 2. Duration discount
  const durationDiscount = policy.pricing_rules.duration_discounts?.find(
    d => months >= d.min_days && (!d.max_days || months <= d.max_days)
  );
  if (durationDiscount) {
    totalPrice *= (1 - durationDiscount.discount_percent / 100);
  }
  
  // 3. Deposit
  const depositMonths = policy.fees.deposit_months || 1;
  const depositAmount = monthlyPrice * depositMonths;
  
  return {
    monthly_price: monthlyPrice,
    total_months: months,
    total_price: totalPrice,
    deposit_amount: depositAmount,
    first_payment: totalPrice + depositAmount, // Tháng đầu + cọc
    breakdown: {
      duration_discount_applied: durationDiscount?.discount_percent || 0
    }
  };
}
```

### 7.3 Dài hạn (Per Year with Escalation)

```typescript
function calculateLongTermPrice(
  booking: {
    start_date: Date,
    years: number
  },
  item: RentableItem,
  policy: PricingPolicy
): PriceBreakdown {
  const baseMonthlyPrice = policy.pricing_rules.base_amount;
  const annualIncrease = policy.pricing_rules.annual_increase_percent || 0;
  
  let yearlyPrices = [];
  for (let year = 0; year < booking.years; year++) {
    const yearPrice = baseMonthlyPrice * Math.pow(1 + annualIncrease / 100, year) * 12;
    yearlyPrices.push(yearPrice);
  }
  
  const totalPrice = yearlyPrices.reduce((sum, price) => sum + price, 0);
  const depositMonths = policy.fees.deposit_months || 3;
  const depositAmount = baseMonthlyPrice * depositMonths;
  
  return {
    base_monthly_price: baseMonthlyPrice,
    total_years: booking.years,
    yearly_prices: yearlyPrices,
    total_price: totalPrice,
    deposit_amount: depositAmount,
    breakdown: {
      annual_increase_percent: annualIncrease,
      year_1_monthly: baseMonthlyPrice,
      year_2_monthly: baseMonthlyPrice * (1 + annualIncrease / 100),
      year_3_monthly: baseMonthlyPrice * Math.pow(1 + annualIncrease / 100, 2)
    }
  };
}
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create migration scripts for database schema
- [ ] Add property_categories and amenities reference tables
- [ ] Update rentable_items table with new columns
- [ ] Create seed data for categories and amenities
- [ ] Update backend models and DTOs

### Phase 2: Backend APIs (Week 3-4)
- [ ] Implement GET /property-categories endpoint
- [ ] Implement GET /amenities endpoint
- [ ] Update POST /rentable-items with new fields
- [ ] Update GET /rentable-items with filters
- [ ] Implement pricing calculation service
- [ ] Update booking creation with price calculation
- [ ] Add validation for min/max rental days

### Phase 3: Frontend - Landlord (Week 5-6)
- [ ] Create PropertyCategorySelector component
- [ ] Update RentableItemForm with dynamic fields
- [ ] Add amenities multi-select component
- [ ] Update PricingPolicyForm with advanced rules
- [ ] Add seasonal pricing UI
- [ ] Add duration discount UI
- [ ] Update RentableItemsPage with category filters

### Phase 4: Frontend - Tenant (Week 7-8)
- [ ] Update DiscoverPage with category filters
- [ ] Add amenities filter
- [ ] Update ListingDetailPage with property info
- [ ] Enhance booking modal with price breakdown
- [ ] Update calendar view based on duration type
- [ ] Add price calculator preview
- [ ] Implement instant booking flow

### Phase 5: Testing & Refinement (Week 9-10)
- [ ] Test all property categories
- [ ] Test pricing calculations
- [ ] Test booking flows for each duration type
- [ ] Performance testing with large datasets
- [ ] UI/UX refinements
- [ ] Documentation updates
- [ ] User acceptance testing

---

## 9. Configuration Examples

### 9.1 Homestay Configuration

```json
{
  "rentable_item": {
    "code": "HOMESTAY-HOI-AN-01",
    "property_category": "HOMESTAY",
    "rental_duration_type": "SHORT_TERM",
    "min_rental_days": 1,
    "max_rental_days": 30,
    "pricing_unit": "PER_NIGHT",
    "capacity": 4,
    "bedrooms": 2,
    "bathrooms": 1,
    "area_sqm": 50,
    "amenities": ["wifi", "ac", "kitchen", "washing_machine", "balcony"],
    "house_rules": ["no_smoking", "no_pets", "quiet_hours_22_6"],
    "instant_booking": true,
    "advance_booking_days": 1,
    "cancellation_policy": "FLEXIBLE"
  },
  "pricing_policy": {
    "name": "Giá Homestay Hội An - Mùa cao điểm",
    "pricing_rules": {
      "base_amount": 500000,
      "pricing_unit": "PER_NIGHT",
      "weekday_rates": {
        "friday": 600000,
        "saturday": 700000,
        "sunday": 700000
      },
      "seasonal_rates": [
        {
          "name": "Tết Nguyên Đán",
          "start_date": "2026-01-28",
          "end_date": "2026-02-03",
          "rate_multiplier": 2.0
        },
        {
          "name": "Hè",
          "start_date": "2026-06-01",
          "end_date": "2026-08-31",
          "rate_multiplier": 1.3
        }
      ],
      "duration_discounts": [
        {"min_days": 7, "max_days": 13, "discount_percent": 10},
        {"min_days": 14, "discount_percent": 15}
      ]
    },
    "fees": {
      "cleaning_fee": 100000,
      "service_fee_percent": 10
    }
  }
}
```

### 9.2 Phòng trọ Configuration

```json
{
  "rentable_item": {
    "code": "ROOM-CAU-GIAY-101",
    "property_category": "ROOM_RENTAL",
    "rental_duration_type": "MEDIUM_TERM",
    "min_rental_days": 30,
    "pricing_unit": "PER_MONTH",
    "capacity": 2,
    "bedrooms": 1,
    "bathrooms": 1,
    "area_sqm": 20,
    "amenities": ["wifi", "ac", "water_heater", "private_bathroom"],
    "house_rules": ["no_smoking", "no_cooking", "quiet_hours_22_6"],
    "instant_booking": false,
    "advance_booking_days": 7,
    "cancellation_policy": "MODERATE"
  },
  "pricing_policy": {
    "name": "Giá phòng trọ Cầu Giấy",
    "pricing_rules": {
      "base_amount": 3000000,
      "pricing_unit": "PER_MONTH",
      "duration_discounts": [
        {"min_days": 90, "max_days": 179, "discount_percent": 5},
        {"min_days": 180, "discount_percent": 10}
      ]
    },
    "fees": {
      "deposit_months": 1,
      "deposit_amount": 3000000
    }
  }
}
```

### 9.3 Văn phòng Configuration

```json
{
  "rentable_item": {
    "code": "OFFICE-KEANGNAM-1501",
    "property_category": "OFFICE",
    "rental_duration_type": "LONG_TERM",
    "min_rental_days": 365,
    "pricing_unit": "PER_SQM_MONTH",
    "area_sqm": 100,
    "floor_number": 15,
    "amenities": ["ac", "elevator", "parking", "security", "meeting_room", "pantry"],
    "instant_booking": false,
    "advance_booking_days": 30,
    "cancellation_policy": "STRICT"
  },
  "pricing_policy": {
    "name": "Giá văn phòng Keangnam",
    "pricing_rules": {
      "base_amount": 300000,
      "pricing_unit": "PER_SQM_MONTH",
      "annual_increase_percent": 5
    },
    "fees": {
      "deposit_months": 3,
      "deposit_amount": 9000000,
      "management_fee_percent": 10
    }
  }
}
```

---

## 10. Business Rules Summary

### 10.1 Booking Constraints

| Duration Type | Min Booking | Advance Notice | Instant Booking | Cancellation |
|---------------|-------------|----------------|-----------------|--------------|
| SHORT_TERM | 1 day | 1 day | Common | Flexible |
| MEDIUM_TERM | 30 days | 7 days | Rare | Moderate |
| LONG_TERM | 365 days | 30 days | Never | Strict |

### 10.2 Payment Schedule

**Ngắn hạn:**
- Thanh toán 100% trước khi check-in
- Hoàn tiền theo chính sách hủy

**Trung hạn:**
- Đặt cọc: 1-2 tháng
- Thanh toán tháng đầu trước khi move-in
- Các tháng sau: Thanh toán đầu tháng

**Dài hạn:**
- Đặt cọc: 2-3 tháng
- Thanh toán theo quý hoặc tháng
- Tăng giá hàng năm theo hợp đồng

### 10.3 Contract Requirements

**Ngắn hạn:**
- Không cần hợp đồng chính thức
- Booking confirmation là đủ

**Trung hạn:**
- Hợp đồng đơn giản trong app
- Có thể in ra ký

**Dài hạn:**
- Hợp đồng chính thức
- Công chứng (tùy giá trị)
- Đăng ký với cơ quan thuế

---

## 11. Next Steps

Sau khi hoàn thành document này, team cần:

1. **Review & Approval**: Product Owner và Tech Lead review thiết kế
2. **Estimate**: Dev team estimate effort cho từng phase
3. **Prioritize**: Quyết định phase nào làm trước
4. **Spike**: Làm POC cho pricing calculation logic
5. **Start Implementation**: Bắt đầu Phase 1

---

## Appendix A: Vietnamese Translations

| English | Tiếng Việt |
|---------|------------|
| Property Category | Loại hình bất động sản |
| Rental Duration | Thời gian thuê |
| Short-term | Ngắn hạn |
| Medium-term | Trung hạn |
| Long-term | Dài hạn |
| Amenities | Tiện nghi |
| House Rules | Quy định nhà |
| Instant Booking | Đặt ngay |
| Cancellation Policy | Chính sách hủy |
| Deposit | Đặt cọc |
| Cleaning Fee | Phí dọn dẹp |
| Service Fee | Phí dịch vụ |
| Duration Discount | Giảm giá theo thời gian |
| Seasonal Rate | Giá theo mùa |
| Annual Increase | Tăng giá hàng năm |

---

**Document End**
