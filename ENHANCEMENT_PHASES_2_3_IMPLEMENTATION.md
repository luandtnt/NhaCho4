# 🚀 ENHANCEMENT PHASES 2 & 3 - IMPLEMENTATION GUIDE

## ✅ PHASE 1 COMPLETED (3/3 tasks)
1. ✅ Tenant bookings filter by user
2. ✅ Pricing policy dependency check
3. ✅ Featured listings with analytics

---

## 🔨 PHASE 2: MEDIUM COMPLEXITY (3 tasks)

### Task 4: Analytics Dashboard for Listings ⏱️ 1.5 hours

**What to build:**
- Analytics service to aggregate listing stats
- Dashboard page showing:
  - Total views per listing
  - View trends (daily/weekly/monthly)
  - Top performing listings
  - Conversion rate (views → leads)
  - Geographic distribution of views

**Implementation:**
```typescript
// Backend: apps/backend/src/modules/marketplace/analytics/
- analytics.service.ts
- analytics.controller.ts
- dto/analytics-query.dto.ts

// Frontend: apps/frontend/src/pages/
- ListingAnalyticsPage.tsx
- components/analytics/ViewsChart.tsx
- components/analytics/StatsCards.tsx
```

**Database additions:**
- Already have: view_count, last_viewed_at
- Add: listing_views table for detailed tracking
  - id, listing_id, viewer_ip, viewed_at, referrer, user_agent

---

### Task 5: Policy Application Logic in Booking ⏱️ 1.5 hours

**Current issue:** 
- Pricing policies exist but not applied during booking price calculation
- TODO at line 356 in booking.service.ts

**What to fix:**
```typescript
// In calculatePrice() method:
1. Get rentable item's pricing_policy_id
2. Fetch pricing policy rules
3. Apply policy adjustments:
   - Base price modifications
   - Seasonal adjustments
   - Promotional discounts
   - Custom rules based on conditions
4. Return detailed price breakdown
```

**Implementation:**
```typescript
// apps/backend/src/modules/ops/booking/booking.service.ts
async calculatePrice(dto: CalculatePriceDto) {
  // ... existing code ...
  
  // Apply pricing policy if exists
  if (rentableItem.pricing_policy_id) {
    const policy = await this.getPricingPolicy(rentableItem.pricing_policy_id);
    basePrice = this.applyPolicyRules(basePrice, policy, dto);
  }
  
  // ... rest of calculation ...
}

private applyPolicyRules(basePrice: number, policy: any, dto: any): number {
  const rules = policy.rules;
  let adjustedPrice = basePrice;
  
  // Apply adjustments based on policy type
  if (policy.policy_type === 'SEASONAL') {
    adjustedPrice = this.applySeasonalAdjustment(adjustedPrice, rules, dto.start_at);
  }
  
  if (policy.policy_type === 'PROMOTIONAL') {
    adjustedPrice = this.applyPromotionalDiscount(adjustedPrice, rules);
  }
  
  return adjustedPrice;
}
```

---

### Task 6: Smart Recommendation Engine ⏱️ 1 hour

**Current issue:**
- TODO at line 128: Simple recommendation = featured listings
- Need smarter algorithm

**Recommendation algorithm:**
```typescript
// Factor 1: Similar property type (40% weight)
// Factor 2: Similar price range (30% weight)
// Factor 3: Same location/area (20% weight)
// Factor 4: User's view history (10% weight)
```

**Implementation:**
```typescript
// apps/backend/src/modules/marketplace/listing/listing.service.ts
async getRecommendations(userId?: string, limit: number = 6) {
  // Get user's view history
  const viewHistory = userId ? await this.getUserViewHistory(userId) : [];
  
  // Extract preferences from history
  const preferences = this.extractPreferences(viewHistory);
  
  // Score and rank listings
  const listings = await this.prisma.listing.findMany({
    where: { status: 'PUBLISHED' },
    take: limit * 3, // Get more to filter
  });
  
  const scored = listings.map(listing => ({
    listing,
    score: this.calculateRecommendationScore(listing, preferences),
  }));
  
  // Sort by score and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.listing);
}
```

---

## 🏗️ PHASE 3: COMPLEX FEATURES (3 tasks)

### Task 7: Bulk Import/Export for Properties ⏱️ 2.5 hours

**Features:**
- Export rentable items to CSV/Excel
- Import from CSV with validation
- Bulk update operations
- Template download

**Implementation:**
```typescript
// Backend: apps/backend/src/modules/ops/rentable-item/
- bulk-operations.service.ts
- dto/bulk-import.dto.ts

// Endpoints:
POST /api/v1/rentable-items/bulk-import
GET /api/v1/rentable-items/export?format=csv
GET /api/v1/rentable-items/template
POST /api/v1/rentable-items/bulk-update
```

**CSV Format:**
```csv
code,property_category,rental_duration_type,base_price,price_unit,bedrooms,bathrooms,area_sqm,amenities
ROOM-001,HOMESTAY,SHORT_TERM,500000,NIGHT,2,1,35,"wifi,ac,kitchen"
```

**Frontend:**
```typescript
// apps/frontend/src/pages/
- BulkImportPage.tsx
- components/FileUploader.tsx
- components/ImportPreview.tsx
- components/ValidationErrors.tsx
```

---

### Task 8: Voucher System ⏱️ 2 hours

**Database schema:**
```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY,
  org_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  voucher_type TEXT NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_NIGHTS
  discount_value DECIMAL NOT NULL,
  min_booking_value DECIMAL,
  max_discount DECIMAL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_to JSONB, -- property types, specific items
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Implementation:**
```typescript
// Backend: apps/backend/src/modules/finance/voucher/
- voucher.service.ts
- voucher.controller.ts
- dto/create-voucher.dto.ts
- dto/validate-voucher.dto.ts

// In booking.service.ts:
async calculatePrice(dto: CalculatePriceDto) {
  // ... existing code ...
  
  // Apply voucher if provided
  if (dto.voucher_code) {
    const voucher = await this.voucherService.validate(dto.voucher_code, {
      rentable_item_id: dto.rentable_item_id,
      booking_value: totalPrice,
    });
    
    const discount = this.calculateVoucherDiscount(voucher, totalPrice);
    totalDiscounts += discount;
  }
}
```

**Frontend:**
```typescript
// apps/frontend/src/pages/
- VouchersPage.tsx (landlord management)
- components/VoucherInput.tsx (tenant booking)
```

---

### Task 9: Policy Conflict Detection ⏱️ 1.5 hours

**What to detect:**
- Overlapping date ranges for seasonal policies
- Conflicting promotional policies
- Multiple policies on same item

**Implementation:**
```typescript
// apps/backend/src/modules/finance/pricing-policy/pricing-policy.service.ts

async detectConflicts(orgId: string, policyId: string) {
  const policy = await this.findOne(orgId, policyId);
  
  // Find overlapping policies
  const conflicts = await this.prisma.configBundle.findMany({
    where: {
      org_id: orgId,
      id: { not: policyId },
      status: 'ACTIVE',
      // Check date range overlap
      // Check same rentable items
    },
  });
  
  return {
    has_conflicts: conflicts.length > 0,
    conflicts: conflicts.map(c => ({
      policy_id: c.id,
      policy_name: c.name,
      conflict_type: this.determineConflictType(policy, c),
      severity: 'HIGH' | 'MEDIUM' | 'LOW',
    })),
  };
}

// Auto-check on create/update
async create(orgId: string, dto: CreatePricingPolicyDto) {
  const policy = await this.prisma.configBundle.create({...});
  
  // Check for conflicts
  const conflicts = await this.detectConflicts(orgId, policy.id);
  
  if (conflicts.has_conflicts) {
    // Log warning or notify admin
    console.warn('Policy conflicts detected:', conflicts);
  }
  
  return policy;
}
```

---

## 📊 IMPLEMENTATION SUMMARY

### Total Time Estimate: 12 hours
- Phase 2: 4 hours (3 tasks)
- Phase 3: 6 hours (3 tasks)
- Testing & Documentation: 2 hours

### Priority Order:
1. **Task 5** (Policy application) - Critical for pricing accuracy
2. **Task 8** (Voucher system) - High business value
3. **Task 6** (Recommendations) - Improves UX
4. **Task 7** (Bulk operations) - Saves time for landlords
5. **Task 9** (Conflict detection) - Prevents errors
6. **Task 4** (Analytics) - Nice to have

### Dependencies:
- Task 5 depends on existing pricing policy system ✅
- Task 8 requires new database table
- Task 9 depends on Task 5
- Tasks 4, 6, 7 are independent

---

## 🎯 NEXT STEPS

**Option A: Implement all at once** (12 hours)
- Complete implementation of all 6 tasks
- Full testing suite
- Comprehensive documentation

**Option B: Prioritized implementation** (6 hours for critical features)
- Task 5: Policy application (1.5h)
- Task 8: Voucher system (2h)
- Task 6: Recommendations (1h)
- Task 9: Conflict detection (1.5h)
- Skip Task 4 & 7 for now

**Option C: MVP approach** (3 hours for must-haves)
- Task 5: Policy application (1.5h)
- Task 8: Basic voucher (1h)
- Task 6: Simple recommendations (0.5h)

---

## 🚀 READY TO START

Which option do you prefer?
- **Option A**: Full implementation (recommended for production)
- **Option B**: Critical features only (good balance)
- **Option C**: MVP (fastest to market)

Or I can start implementing Option B right now! 🎯
