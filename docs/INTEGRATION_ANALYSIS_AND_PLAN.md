# Phân tích Tích hợp Hệ thống Đa Loại hình
**Version**: 1.0  
**Date**: 2026-01-15

## 1. Phân tích Hiện trạng

### 1.1 Cấu trúc Database Hiện tại

**rentable_items table:**
```sql
- id (TEXT, PK)
- org_id (TEXT)
- space_node_id (TEXT)
- code (TEXT)
- allocation_type (TEXT)
- capacity (INTEGER)
- slot_config (JSONB)
- status (TEXT) DEFAULT 'ACTIVE'
- attrs (JSONB) DEFAULT '{}'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Nhận xét:**
✅ Đã có: `attrs` JSONB - có thể lưu metadata mở rộng
✅ Đã có: `allocation_type`, `capacity`, `slot_config`
❌ Thiếu: Các trường phân loại property (category, duration_type)
❌ Thiếu: Các trường chi tiết (area_sqm, bedrooms, bathrooms)
❌ Thiếu: Amenities, house_rules
❌ Thiếu: Booking settings (instant_booking, cancellation_policy)

### 1.2 Backend DTO Hiện tại

**CreateRentableItemDto:**
```typescript
- space_node_id: string
- code: string
- allocation_type: 'exclusive' | 'capacity' | 'slot'
- capacity?: number
- slot_config?: any
- attrs?: any
```

**Nhận xét:**
✅ Đơn giản, dễ mở rộng
❌ Không có validation cho property category
❌ Không có validation cho amenities

### 1.3 Frontend Form Hiện tại

**RentableItemsPage:**
- Form tạo/sửa cơ bản
- Chỉ có: code, space_node_id, allocation_type, capacity
- Có chức năng gán pricing_policy_id vào attrs

---

## 2. Phát hiện Conflicts

### 2.1 ❌ CONFLICT #1: Database Schema
**Vấn đề:** Thiếu nhiều columns cần thiết cho hệ thống đa loại hình

**Impact:** HIGH
- Không thể lưu property_category, rental_duration_type
- Không thể filter/search theo loại hình
- Không thể validate min/max rental days

**Giải pháp:**
- **Option A (Recommended)**: Thêm columns mới vào table
- **Option B**: Lưu tất cả vào `attrs` JSONB (không tối ưu cho query)

### 2.2 ⚠️ CONFLICT #2: Pricing Policy Structure
**Vấn đề:** Pricing policy hiện tại lưu trong `config` JSONB, cấu trúc chưa chuẩn hóa

**Impact:** MEDIUM
- Khó implement seasonal pricing, weekday rates
- Khó tính toán giá động

**Giải pháp:**
- Chuẩn hóa structure trong `config` JSONB
- Tạo service tính giá riêng

### 2.3 ✅ NO CONFLICT: Booking System
**Vấn đề:** Booking table đã có sẵn, tương thích

**Impact:** LOW
- Chỉ cần thêm logic tính giá
- Thêm validation theo duration_type

### 2.4 ⚠️ CONFLICT #3: Frontend Forms
**Vấn đề:** Form hiện tại quá đơn giản, không đủ fields

**Impact:** MEDIUM
- Cần redesign form với nhiều fields
- Cần dynamic form theo property category

**Giải pháp:**
- Tạo multi-step form
- Conditional rendering theo category

---

## 3. Phương án Tích hợp

### Phương án A: INCREMENTAL (Recommended) ⭐
**Mô tả:** Tích hợp từng bước, không breaking changes

**Ưu điểm:**
- ✅ Không ảnh hưởng data hiện tại
- ✅ Test từng phần
- ✅ Rollback dễ dàng
- ✅ Team có thể làm song song

**Nhược điểm:**
- ⏱️ Mất thời gian hơn
- 🔄 Cần maintain 2 versions tạm thời

**Timeline:** 6-8 tuần

### Phương án B: BIG BANG
**Mô tả:** Thay đổi toàn bộ cùng lúc

**Ưu điểm:**
- ⚡ Nhanh hơn về tổng thời gian
- 🎯 Không cần maintain 2 versions

**Nhược điểm:**
- ❌ Risk cao
- ❌ Khó rollback
- ❌ Phải stop development khác

**Timeline:** 3-4 tuần (nhưng risk cao)

---

## 4. Chi tiết Phương án A (Recommended)

### Phase 1: Database Migration (Week 1)
**Mục tiêu:** Thêm columns mới, backward compatible

**Tasks:**
1. Tạo migration script
2. Thêm columns với DEFAULT values
3. Migrate data cũ (nếu có)
4. Test migration

**Migration Script:**
```sql
-- Add new columns (all nullable or with defaults)
ALTER TABLE rentable_items 
  ADD COLUMN property_category VARCHAR(50),
  ADD COLUMN rental_duration_type VARCHAR(20),
  ADD COLUMN min_rental_days INTEGER DEFAULT 1,
  ADD COLUMN max_rental_days INTEGER,
  ADD COLUMN pricing_unit VARCHAR(20) DEFAULT 'PER_MONTH',
  ADD COLUMN area_sqm DECIMAL(10,2),
  ADD COLUMN bedrooms INTEGER,
  ADD COLUMN bathrooms INTEGER,
  ADD COLUMN floor_number INTEGER,
  ADD COLUMN amenities JSONB DEFAULT '[]',
  ADD COLUMN house_rules JSONB DEFAULT '[]',
  ADD COLUMN instant_booking BOOLEAN DEFAULT false,
  ADD COLUMN advance_booking_days INTEGER DEFAULT 1,
  ADD COLUMN cancellation_policy VARCHAR(20) DEFAULT 'MODERATE';

-- Create indexes
CREATE INDEX idx_rentable_items_category 
  ON rentable_items(property_category);
CREATE INDEX idx_rentable_items_duration 
  ON rentable_items(rental_duration_type);
CREATE INDEX idx_rentable_items_amenities 
  ON rentable_items USING GIN(amenities);

-- Migrate existing data (set defaults for old records)
UPDATE rentable_items 
SET 
  property_category = 'APARTMENT',
  rental_duration_type = 'MEDIUM_TERM',
  pricing_unit = 'PER_MONTH'
WHERE property_category IS NULL;
```

**Rollback Plan:**
```sql
ALTER TABLE rentable_items 
  DROP COLUMN property_category,
  DROP COLUMN rental_duration_type,
  DROP COLUMN min_rental_days,
  DROP COLUMN max_rental_days,
  DROP COLUMN pricing_unit,
  DROP COLUMN area_sqm,
  DROP COLUMN bedrooms,
  DROP COLUMN bathrooms,
  DROP COLUMN floor_number,
  DROP COLUMN amenities,
  DROP COLUMN house_rules,
  DROP COLUMN instant_booking,
  DROP COLUMN advance_booking_days,
  DROP COLUMN cancellation_policy;
```

### Phase 2: Reference Tables (Week 1)
**Mục tiêu:** Tạo lookup tables cho categories và amenities

**Tasks:**
1. Tạo property_categories table
2. Tạo amenities table
3. Seed data
4. Create APIs

**Migration Script:**
```sql
-- Property Categories
CREATE TABLE property_categories (
  code VARCHAR(50) PRIMARY KEY,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  duration_type VARCHAR(20) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  typical_pricing_unit VARCHAR(20),
  typical_min_days INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Amenities
CREATE TABLE amenities (
  code VARCHAR(50) PRIMARY KEY,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50),
  applicable_to JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed property categories
INSERT INTO property_categories (code, name_vi, name_en, duration_type, icon, typical_pricing_unit, typical_min_days, display_order) VALUES
('HOMESTAY', 'Homestay', 'Homestay', 'SHORT_TERM', '🏠', 'PER_NIGHT', 1, 1),
('HOTEL', 'Khách sạn', 'Hotel', 'SHORT_TERM', '🏨', 'PER_NIGHT', 1, 2),
('ROOM_RENTAL', 'Phòng trọ', 'Room Rental', 'MEDIUM_TERM', '🛏️', 'PER_MONTH', 30, 3),
('APARTMENT', 'Chung cư', 'Apartment', 'MEDIUM_TERM', '🏢', 'PER_MONTH', 30, 4),
('OFFICE', 'Văn phòng', 'Office', 'LONG_TERM', '🏢', 'PER_SQM_MONTH', 365, 5),
('WAREHOUSE', 'Nhà xưởng', 'Warehouse', 'LONG_TERM', '🏭', 'PER_SQM_MONTH', 365, 6);

-- Seed amenities
INSERT INTO amenities (code, name_vi, name_en, icon, category, applicable_to, display_order) VALUES
('wifi', 'Wifi', 'Wifi', '📶', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE"]', 1),
('ac', 'Điều hòa', 'Air Conditioning', '❄️', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE"]', 2),
('kitchen', 'Bếp', 'Kitchen', '🍳', 'KITCHEN', '["HOMESTAY","APARTMENT"]', 3),
('parking', 'Bãi đỗ xe', 'Parking', '🅿️', 'BASIC', '["HOTEL","APARTMENT","OFFICE","WAREHOUSE"]', 4),
('elevator', 'Thang máy', 'Elevator', '🛗', 'BASIC', '["APARTMENT","OFFICE"]', 5),
('pool', 'Hồ bơi', 'Swimming Pool', '🏊', 'ENTERTAINMENT', '["HOTEL","VILLA_RESORT"]', 6),
('gym', 'Phòng gym', 'Gym', '💪', 'ENTERTAINMENT', '["HOTEL","APARTMENT"]', 7),
('security', 'Bảo vệ 24/7', 'Security', '🔒', 'SAFETY', '["APARTMENT","OFFICE","WAREHOUSE"]', 8);
```

### Phase 3: Backend APIs (Week 2)
**Mục tiêu:** Update DTOs, Services, Controllers

**Tasks:**
1. Update Prisma schema
2. Generate Prisma client
3. Update DTOs
4. Update Services
5. Create new endpoints

**Files to modify:**
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/ops/rentable-item/dto/create-rentable-item.dto.ts`
- `apps/backend/src/modules/ops/rentable-item/dto/update-rentable-item.dto.ts`
- `apps/backend/src/modules/ops/rentable-item/rentable-item.service.ts`
- `apps/backend/src/modules/ops/rentable-item/rentable-item.controller.ts`

**New files to create:**
- `apps/backend/src/modules/ops/property-category/` (new module)
- `apps/backend/src/modules/ops/amenity/` (new module)

**Backward Compatibility:**
```typescript
// Old API still works
POST /rentable-items
{
  "code": "ROOM-101",
  "space_node_id": "uuid",
  "allocation_type": "exclusive"
}
// ✅ Still works, uses defaults

// New API with extended fields
POST /rentable-items
{
  "code": "ROOM-101",
  "space_node_id": "uuid",
  "allocation_type": "exclusive",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "amenities": ["wifi", "ac"]
}
// ✅ Also works
```

### Phase 4: Frontend Components (Week 3-4)
**Mục tiêu:** Tạo UI components mới, không breaking old UI

**Strategy:** Feature Flag Pattern
```typescript
// Use feature flag to enable new UI
const ENABLE_MULTI_PROPERTY_TYPE = true;

if (ENABLE_MULTI_PROPERTY_TYPE) {
  return <EnhancedRentableItemForm />;
} else {
  return <LegacyRentableItemForm />;
}
```

**Tasks:**
1. Create PropertyCategorySelector component
2. Create AmenitiesSelector component
3. Create EnhancedRentableItemForm component
4. Update RentableItemsPage with feature flag
5. Add filters to DiscoverPage

**New Components:**
```
apps/frontend/src/components/
├── PropertyCategorySelector.tsx
├── AmenitiesSelector.tsx
├── EnhancedRentableItemForm.tsx
└── PropertyFilters.tsx
```

**Modified Pages:**
```
apps/frontend/src/pages/
├── RentableItemsPage.tsx (add feature flag)
├── DiscoverPage.tsx (add filters)
└── ListingDetailPage.tsx (show property details)
```

### Phase 5: Pricing Logic (Week 5)
**Mục tiêu:** Implement pricing calculation service

**Tasks:**
1. Create PricingCalculator service
2. Update PricingPolicy structure
3. Integrate with Booking flow
4. Add price preview UI

**New Service:**
```typescript
// apps/backend/src/modules/finance/pricing/pricing-calculator.service.ts
class PricingCalculatorService {
  calculateShortTerm(booking, item, policy): PriceBreakdown
  calculateMediumTerm(booking, item, policy): PriceBreakdown
  calculateLongTerm(booking, item, policy): PriceBreakdown
}
```

### Phase 6: Testing & Migration (Week 6)
**Mục tiêu:** Test toàn bộ, migrate data cũ

**Tasks:**
1. Unit tests cho services
2. Integration tests cho APIs
3. E2E tests cho UI flows
4. Migrate existing rentable_items
5. Performance testing

**Data Migration Script:**
```typescript
// Migrate existing rentable_items to have proper categories
async function migrateExistingItems() {
  const items = await prisma.rentableItem.findMany({
    where: { property_category: null }
  });
  
  for (const item of items) {
    // Infer category from attrs or allocation_type
    const category = inferCategory(item);
    const durationType = inferDurationType(item);
    
    await prisma.rentableItem.update({
      where: { id: item.id },
      data: {
        property_category: category,
        rental_duration_type: durationType,
        min_rental_days: getDefaultMinDays(durationType),
        pricing_unit: getDefaultPricingUnit(durationType)
      }
    });
  }
}
```

---

## 5. Checklist Tích hợp

### 5.1 Database
- [ ] Tạo migration script
- [ ] Test migration trên dev database
- [ ] Backup production database
- [ ] Run migration trên production
- [ ] Verify data integrity
- [ ] Create indexes
- [ ] Test query performance

### 5.2 Backend
- [ ] Update Prisma schema
- [ ] Generate Prisma client
- [ ] Create property-category module
- [ ] Create amenity module
- [ ] Update rentable-item DTOs
- [ ] Update rentable-item service
- [ ] Add validation logic
- [ ] Create pricing calculator service
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation

### 5.3 Frontend
- [ ] Create PropertyCategorySelector
- [ ] Create AmenitiesSelector
- [ ] Create EnhancedRentableItemForm
- [ ] Update RentableItemsPage
- [ ] Add feature flag
- [ ] Update DiscoverPage filters
- [ ] Update ListingDetailPage
- [ ] Update booking flow
- [ ] Add price calculator preview
- [ ] Test responsive design
- [ ] Test accessibility

### 5.4 Testing
- [ ] Unit tests (backend)
- [ ] Integration tests (backend)
- [ ] E2E tests (frontend)
- [ ] Performance tests
- [ ] Load tests
- [ ] Security tests
- [ ] User acceptance testing

### 5.5 Documentation
- [ ] Update API docs
- [ ] Update user guide
- [ ] Create migration guide
- [ ] Update README
- [ ] Create video tutorials

### 5.6 Deployment
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Create rollback plan
- [ ] Deploy to production
- [ ] Monitor errors
- [ ] Collect user feedback

---

## 6. Risk Management

### Risk #1: Data Loss
**Probability:** LOW  
**Impact:** CRITICAL  
**Mitigation:**
- Backup database before migration
- Test migration script thoroughly
- Use transactions
- Have rollback script ready

### Risk #2: Performance Degradation
**Probability:** MEDIUM  
**Impact:** HIGH  
**Mitigation:**
- Add proper indexes
- Test with large datasets
- Monitor query performance
- Optimize slow queries

### Risk #3: Breaking Changes
**Probability:** MEDIUM  
**Impact:** HIGH  
**Mitigation:**
- Use feature flags
- Maintain backward compatibility
- Gradual rollout
- Quick rollback capability

### Risk #4: User Confusion
**Probability:** MEDIUM  
**Impact:** MEDIUM  
**Mitigation:**
- Clear UI/UX
- Tooltips and help text
- User training
- Support documentation

---

## 7. Success Metrics

### Technical Metrics
- ✅ 0 data loss during migration
- ✅ < 100ms query response time
- ✅ 100% backward compatibility
- ✅ > 90% test coverage
- ✅ 0 critical bugs in production

### Business Metrics
- ✅ Support 21 property types
- ✅ Enable 3 duration types
- ✅ Flexible pricing (seasonal, duration-based)
- ✅ Improved search/filter experience
- ✅ Increased booking conversion

---

## 8. Timeline Summary

| Phase | Duration | Dependencies | Risk |
|-------|----------|--------------|------|
| Phase 1: Database | 1 week | None | LOW |
| Phase 2: Reference Tables | 1 week | Phase 1 | LOW |
| Phase 3: Backend APIs | 1 week | Phase 1, 2 | MEDIUM |
| Phase 4: Frontend | 2 weeks | Phase 3 | MEDIUM |
| Phase 5: Pricing Logic | 1 week | Phase 3 | HIGH |
| Phase 6: Testing | 1 week | All | LOW |

**Total:** 7 weeks (conservative estimate)

---

## 9. Quyết định Cần Làm

### Decision #1: Migration Strategy
**Options:**
- A. Incremental (Recommended)
- B. Big Bang

**Recommendation:** Option A
**Reason:** Lower risk, easier rollback, team can work in parallel

### Decision #2: Data Storage
**Options:**
- A. Add columns to rentable_items (Recommended)
- B. Store everything in attrs JSONB

**Recommendation:** Option A
**Reason:** Better query performance, proper indexing, type safety

### Decision #3: Backward Compatibility
**Options:**
- A. Maintain full backward compatibility (Recommended)
- B. Breaking changes with migration script

**Recommendation:** Option A
**Reason:** Safer, no downtime, gradual adoption

### Decision #4: Feature Flag
**Options:**
- A. Use feature flag for gradual rollout (Recommended)
- B. Deploy all at once

**Recommendation:** Option A
**Reason:** Can enable for specific users first, easier rollback

---

## 10. Next Steps

1. **Review this document** with team
2. **Get approval** from Product Owner
3. **Estimate effort** for each phase
4. **Assign tasks** to team members
5. **Start Phase 1** (Database Migration)
6. **Daily standups** to track progress
7. **Weekly demos** to stakeholders

---

**Document End**
