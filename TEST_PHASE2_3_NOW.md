# 🚀 TEST PHASE 2 & 3 FEATURES NOW

## ✅ What Was Implemented

Phase 2 & 3 enhancements are now live! Here's what you can test:

### 1. ✅ Policy Application in Booking
- Pricing policies automatically adjust prices based on:
  - Season (high/low season multipliers)
  - Day of week (weekend surcharges)
  - Duration (long-stay discounts)
  - Promotions (percentage or fixed discounts)

### 2. ✅ Smart Recommendations
- Context-aware property recommendations
- Multi-factor scoring algorithm
- Works without authentication

### 3. ✅ Policy Conflict Detection
- Detects overlapping seasonal policies
- Warns about shared rentable items
- Checks promotional period conflicts

---

## 🧪 QUICK TEST GUIDE

### Option 1: Run Automated Test Script

```powershell
.\test-phase2-3-features.ps1
```

This will test all features automatically.

---

### Option 2: Manual Testing

#### Test 1: Smart Recommendations

**Get general recommendations:**
```bash
curl http://localhost:3000/api/v1/marketplace/recommended?limit=6
```

**Get context-aware recommendations:**
```bash
# Replace {listing_id} with actual ID
curl http://localhost:3000/api/v1/marketplace/recommended?limit=6&context_listing_id={listing_id}
```

**Expected**: Returns 6 listings sorted by relevance score

---

#### Test 2: Policy Application

**Step 1: Create a seasonal policy**
```bash
curl -X POST http://localhost:3000/api/v1/pricing-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer High Season 2026",
    "policy_type": "SEASONAL",
    "config": {
      "base_amount": 500000,
      "currency": "VND",
      "high_season_months": [6, 7, 8],
      "high_season_multiplier": 1.3,
      "weekend_multiplier": 1.15
    }
  }'
```

**Step 2: Assign policy to a rentable item**
```bash
curl -X PUT http://localhost:3000/api/v1/rentable-items/{item_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricing_policy_id": "POLICY_ID_FROM_STEP_1"
  }'
```

**Step 3: Calculate price for summer dates**
```bash
curl -X POST http://localhost:3000/api/v1/bookings/calculate-price \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rentable_item_id": "ITEM_ID",
    "start_date": "2026-07-01T14:00:00Z",
    "end_date": "2026-07-05T11:00:00Z",
    "guests": {
      "adults": 2,
      "children": 0,
      "infants": 0
    }
  }'
```

**Expected**: 
- Base price × 1.3 (summer multiplier)
- If weekend included: additional 1.15 multiplier
- Breakdown shows "Điều chỉnh chính sách giá: Summer High Season 2026"

---

#### Test 3: Conflict Detection

**Step 1: Create two overlapping policies**
```bash
# Policy 1: Summer (June-August)
curl -X POST http://localhost:3000/api/v1/pricing-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Season",
    "policy_type": "SEASONAL",
    "config": {
      "base_amount": 500000,
      "currency": "VND",
      "high_season_months": [6, 7, 8],
      "high_season_multiplier": 1.3
    }
  }'

# Policy 2: July Promotion (overlaps with summer)
curl -X POST http://localhost:3000/api/v1/pricing-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "July Special",
    "policy_type": "SEASONAL",
    "config": {
      "base_amount": 500000,
      "currency": "VND",
      "high_season_months": [7],
      "high_season_multiplier": 1.5
    }
  }'
```

**Step 2: Check for conflicts**
```bash
curl http://localhost:3000/api/v1/pricing-policies/{policy_id}/conflicts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**:
```json
{
  "has_conflicts": true,
  "conflict_count": 1,
  "conflicts": [
    {
      "policy_id": "xxx",
      "policy_name": "July Special",
      "conflict_type": "DATE_OVERLAP",
      "severity": "HIGH",
      "description": "Seasonal date ranges overlap"
    }
  ]
}
```

---

#### Test 4: Featured Listings

**Get featured listings:**
```bash
curl http://localhost:3000/api/v1/marketplace/featured?limit=6
```

**Expected**: Returns listings sorted by view_count DESC

**Toggle featured status:**
```bash
curl -X PUT http://localhost:3000/api/v1/listings/{listing_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_featured": true
  }'
```

---

## 📊 TESTING CHECKLIST

- [ ] Smart recommendations return relevant listings
- [ ] Context-aware recommendations work with listing ID
- [ ] Pricing policy adjusts prices correctly
- [ ] Seasonal multipliers apply in correct months
- [ ] Weekend surcharges work
- [ ] Conflict detection finds overlapping policies
- [ ] Featured listings show high view count items first
- [ ] View count increments when viewing listing detail

---

## 🐛 TROUBLESHOOTING

### Issue: "Policy not found"
**Solution**: Make sure policy status is "ACTIVE"
```bash
curl -X POST http://localhost:3000/api/v1/pricing-policies/{id}/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "No recommendations returned"
**Solution**: Make sure you have published listings
```bash
curl -X POST http://localhost:3000/api/v1/listings/{id}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Price not adjusted"
**Solution**: Check that:
1. Policy is ACTIVE
2. Policy is assigned to rentable item (pricing_policy_id field)
3. Booking dates match policy rules (e.g., summer months)

---

## 📈 WHAT'S NEXT

### Implemented (6/9 tasks):
- ✅ Tenant bookings filter
- ✅ Policy dependency check
- ✅ Featured listings
- ✅ Policy application in booking
- ✅ Smart recommendations
- ✅ Policy conflict detection

### Not Yet Implemented (3/9 tasks):
- ⏳ Bulk import/export (useful for large landlords)
- ⏳ Voucher system (can add when needed)
- ⏳ Analytics dashboard (nice to have)

These remaining features are optional and can be added based on user feedback and priority.

---

## 🎉 READY TO USE

The core enhancements are complete and ready for production use. Test them out and provide feedback!

**Questions?** Check the implementation details in `ENHANCEMENT_PHASE1_COMPLETE.md`

