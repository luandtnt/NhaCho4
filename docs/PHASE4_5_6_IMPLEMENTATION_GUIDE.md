# Phase 4, 5, 6 Implementation Guide

**Date**: 2026-01-15  
**Status**: 📋 GUIDE

---

## PHASE 4: Pricing Logic (Week 5)

### Overview
Implement dynamic pricing calculation based on property type and duration.

### 4.1 Backend: PricingCalculator Service

**File**: `apps/backend/src/modules/finance/pricing/pricing-calculator.service.ts`

```typescript
@Injectable()
export class PricingCalculatorService {
  
  // Calculate price for short-term rentals (per night)
  calculateShortTermPrice(params: {
    rentableItem: RentableItem,
    pricingPolicy: PricingPolicy,
    startDate: Date,
    endDate: Date,
    guests: number
  }): PriceBreakdown {
    const nights = this.calculateNights(params.startDate, params.endDate);
    let totalPrice = 0;
    
    // Calculate each night with weekday/seasonal adjustments
    for (let i = 0; i < nights; i++) {
      const currentDate = this.addDays(params.startDate, i);
      let nightPrice = pricingPolicy.config.config.base_amount;
      
      // Weekday adjustment
      const dayOfWeek = currentDate.getDay();
      if (pricingPolicy.config.config.weekday_rates) {
        nightPrice = pricingPolicy.config.config.weekday_rates[dayOfWeek] || nightPrice;
      }
      
      // Seasonal adjustment
      const seasonalRate = this.findSeasonalRate(currentDate, pricingPolicy);
      if (seasonalRate) {
        nightPrice *= seasonalRate.rate_multiplier;
      }
      
      totalPrice += nightPrice;
    }
    
    // Duration discount
    const discount = this.calculateDurationDiscount(nights, pricingPolicy);
    totalPrice *= (1 - discount / 100);
    
    // Fees
    const cleaningFee = pricingPolicy.config.fees?.cleaning_fee || 0;
    const serviceFee = totalPrice * (pricingPolicy.config.fees?.service_fee_percent || 0) / 100;
    
    return {
      base_price: totalPrice,
      cleaning_fee: cleaningFee,
      service_fee: serviceFee,
      total_price: totalPrice + cleaningFee + serviceFee,
      nights,
      breakdown: {
        per_night_avg: totalPrice / nights,
        discount_applied: discount
      }
    };
  }
  
  // Calculate price for medium-term rentals (per month)
  calculateMediumTermPrice(params: {
    rentableItem: RentableItem,
    pricingPolicy: PricingPolicy,
    startDate: Date,
    months: number
  }): PriceBreakdown {
    const monthlyPrice = pricingPolicy.config.config.base_amount;
    let totalPrice = monthlyPrice * params.months;
    
    // Duration discount
    const discount = this.calculateDurationDiscount(params.months * 30, pricingPolicy);
    totalPrice *= (1 - discount / 100);
    
    // Deposit
    const depositMonths = pricingPolicy.config.fees?.deposit_months || 1;
    const depositAmount = monthlyPrice * depositMonths;
    
    return {
      monthly_price: monthlyPrice,
      total_months: params.months,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      first_payment: totalPrice + depositAmount,
      breakdown: {
        discount_applied: discount
      }
    };
  }
  
  // Calculate price for long-term rentals (per year with escalation)
  calculateLongTermPrice(params: {
    rentableItem: RentableItem,
    pricingPolicy: PricingPolicy,
    startDate: Date,
    years: number
  }): PriceBreakdown {
    const baseMonthlyPrice = pricingPolicy.config.config.base_amount;
    const annualIncrease = pricingPolicy.config.config.annual_increase_percent || 0;
    
    const yearlyPrices = [];
    for (let year = 0; year < params.years; year++) {
      const yearPrice = baseMonthlyPrice * Math.pow(1 + annualIncrease / 100, year) * 12;
      yearlyPrices.push(yearPrice);
    }
    
    const totalPrice = yearlyPrices.reduce((sum, price) => sum + price, 0);
    const depositMonths = pricingPolicy.config.fees?.deposit_months || 3;
    const depositAmount = baseMonthlyPrice * depositMonths;
    
    return {
      base_monthly_price: baseMonthlyPrice,
      total_years: params.years,
      yearly_prices: yearlyPrices,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      breakdown: {
        annual_increase_percent: annualIncrease
      }
    };
  }
}
```

### 4.2 Frontend: Price Calculator Preview

**File**: `apps/frontend/src/components/PriceCalculatorPreview.tsx`

```typescript
export default function PriceCalculatorPreview({ 
  rentableItem, 
  pricingPolicy 
}: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  
  const calculatePrice = async () => {
    const response = await apiClient.post('/pricing/calculate', {
      rentable_item_id: rentableItem.id,
      pricing_policy_id: pricingPolicy.id,
      start_date: startDate,
      end_date: endDate
    });
    setPriceBreakdown(response.data);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">Tính giá</h3>
      {/* Date inputs */}
      {/* Price breakdown display */}
    </div>
  );
}
```

### 4.3 Integration with Booking Flow

Update booking creation to include calculated price:

```typescript
const booking = await apiClient.post('/bookings', {
  rentable_item_id: item.id,
  start_time: startDate,
  end_time: endDate,
  quantity: 1,
  // Include calculated price
  price_breakdown: priceBreakdown
});
```

---

## PHASE 5: Testing (Week 6)

### 5.1 Unit Tests

**Backend Tests:**
```bash
# Test property category service
npm run test -- property-category.service.spec.ts

# Test amenity service
npm run test -- amenity.service.spec.ts

# Test rentable item service
npm run test -- rentable-item.service.spec.ts

# Test pricing calculator
npm run test -- pricing-calculator.service.spec.ts
```

**Example Test:**
```typescript
describe('PropertyCategoryService', () => {
  it('should return all categories', async () => {
    const result = await service.findAll();
    expect(result.data).toHaveLength(21);
  });
  
  it('should filter by duration type', async () => {
    const result = await service.findAll('SHORT_TERM');
    expect(result.data.every(c => c.duration_type === 'SHORT_TERM')).toBe(true);
  });
});
```

### 5.2 Integration Tests

```typescript
describe('RentableItem API', () => {
  it('should create item with new fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/rentable-items')
      .send({
        code: 'TEST-001',
        space_node_id: spaceNodeId,
        allocation_type: 'exclusive',
        property_category: 'HOMESTAY',
        amenities: ['wifi', 'ac']
      })
      .expect(201);
      
    expect(response.body.property_category).toBe('HOMESTAY');
    expect(response.body.amenities).toContain('wifi');
  });
});
```

### 5.3 E2E Tests

```typescript
describe('Create Rentable Item Flow', () => {
  it('should complete full flow', async () => {
    // 1. Navigate to rentable items page
    await page.goto('/assets/asset-id/rentable-items');
    
    // 2. Click create button
    await page.click('button:has-text("Tạo Rentable Item")');
    
    // 3. Select property category
    await page.click('[data-category="HOMESTAY"]');
    
    // 4. Fill form
    await page.fill('[name="code"]', 'TEST-001');
    await page.selectOption('[name="property_category"]', 'HOMESTAY');
    
    // 5. Select amenities
    await page.click('[data-amenity="wifi"]');
    await page.click('[data-amenity="ac"]');
    
    // 6. Submit
    await page.click('button:has-text("Tạo")');
    
    // 7. Verify success
    await expect(page.locator('text=Tạo rentable item thành công')).toBeVisible();
  });
});
```

### 5.4 Performance Tests

```bash
# Load test with 100 concurrent users
npm run load-test

# Benchmark search with filters
npm run benchmark:search
```

### 5.5 Data Migration Tests

```sql
-- Test existing data migrated correctly
SELECT COUNT(*) FROM rentable_items WHERE property_category IS NOT NULL;
-- Should return 10 (all existing items)

-- Test categories loaded
SELECT COUNT(*) FROM property_categories;
-- Should return 21

-- Test amenities loaded
SELECT COUNT(*) FROM amenities;
-- Should return 30
```

---

## PHASE 6: Documentation & Deployment (Week 6)

### 6.1 API Documentation

Update Swagger docs:
```bash
# Generate API docs
npm run build
# Access at http://localhost:3000/api/docs
```

### 6.2 User Guide

**File**: `docs/USER_GUIDE.md`

Topics:
- How to create rentable items with property types
- How to select amenities
- How to set pricing by duration
- How to filter listings
- How to calculate prices

### 6.3 Migration Guide

**File**: `docs/MIGRATION_GUIDE.md`

For existing users:
1. Backup database
2. Run migration
3. Update existing items with categories
4. Test new features
5. Train users

### 6.4 Deployment Checklist

- [ ] Run all tests
- [ ] Backup production database
- [ ] Deploy backend with migration
- [ ] Verify migration success
- [ ] Deploy frontend
- [ ] Smoke test production
- [ ] Monitor errors
- [ ] Notify users of new features

### 6.5 Rollback Plan

If issues occur:
```bash
# Backend rollback
cd apps/backend
npm run rollback:property-types -- --confirm

# Frontend rollback
git revert <commit-hash>
```

---

## Success Metrics

### Technical Metrics
- ✅ 0 data loss
- ✅ < 100ms query response
- ✅ 100% backward compatibility
- ✅ > 90% test coverage
- ✅ 0 critical bugs

### Business Metrics
- ✅ 21 property types supported
- ✅ 3 duration types enabled
- ✅ Flexible pricing implemented
- ✅ Enhanced search/filter
- ✅ Improved UX

---

## Timeline Summary

| Phase | Status | Duration |
|-------|--------|----------|
| Phase 1: Database | ✅ DONE | 1 week |
| Phase 2: Backend APIs | ✅ DONE | 1 week |
| Phase 3: Frontend | ✅ DONE | 2 weeks |
| Phase 4: Pricing | 📋 GUIDE | 1 week |
| Phase 5: Testing | 📋 GUIDE | 1 week |
| Phase 6: Docs | 📋 GUIDE | Ongoing |

**Total**: 7 weeks

---

## Next Actions

1. **Review** this implementation guide
2. **Implement** Phase 4 pricing logic
3. **Write** tests for Phase 5
4. **Create** documentation for Phase 6
5. **Deploy** to staging
6. **Test** thoroughly
7. **Deploy** to production

---

**Status: Phases 1-3 COMPLETE, Phases 4-6 DOCUMENTED**
