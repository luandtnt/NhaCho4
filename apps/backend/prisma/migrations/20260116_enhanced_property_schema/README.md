# Enhanced Property Schema Migration

**Version:** 1.0  
**Date:** 2026-01-16  
**Status:** Production-Ready

## Overview

This migration adds comprehensive property fields to support 21 property types with proper ENUMs, structured metadata, and full indexing for optimal query performance.

## What's Added

### 1. ENUMs (7 types)
- `PriceUnit`: HOUR, NIGHT, MONTH
- `Direction`: EAST, WEST, SOUTH, NORTH, NORTHEAST, NORTHWEST, SOUTHEAST, SOUTHWEST
- `FurnishingLevel`: FULL, PARTIAL, NONE
- `UtilityBilling`: METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE
- `CancellationPolicy`: FLEXIBLE, MODERATE, STRICT
- `HousekeepingFrequency`: DAILY, WEEKLY, ON_REQUEST
- `GenderPolicy`: MALE, FEMALE, MIXED

### 2. Core Columns (30 fields)

#### Location (6 fields)
- `address_full`, `province`, `district`, `ward`
- `geo_lat`, `geo_lng`

#### Pricing & Contract (8 fields)
- `base_price`, `price_unit`, `currency`
- `min_rent_duration`, `deposit_amount`, `booking_hold_deposit`
- `service_fee`, `building_mgmt_fee`

#### Physical Details (6 fields)
- `floors`, `apartment_floor`, `direction`, `balcony`
- `frontage_m`, `parking_slots`

#### Furnishing (1 field)
- `furnishing_level`

#### Short-term Booking (3 fields)
- `checkin_time`, `checkout_time`, `max_occupancy`

#### Utilities (2 fields)
- `electricity_billing`, `water_billing`

#### Metadata (1 field)
- `metadata` (JSONB with versioning)

### 3. Indexes (15+ indexes)
- Location indexes (province, district, ward, geo)
- Pricing indexes (base_price, price_unit)
- Physical indexes (bedrooms, bathrooms, area, furnishing)
- Composite indexes for common queries
- GIN indexes for JSONB columns (amenities, metadata)

### 4. Check Constraints
- `base_price > 0`
- `min_rent_duration >= 1`
- `frontage_m > 0`
- `parking_slots >= 0`
- `max_occupancy >= 1`

## Backward Compatibility

✅ **100% Backward Compatible**
- All new columns are nullable
- Existing data gets proper defaults
- No breaking changes to existing queries
- Legacy fields preserved

## Running the Migration

### Option 1: Using Prisma
```bash
cd apps/backend
npx prisma migrate dev --name enhanced_property_schema
```

### Option 2: Manual SQL
```bash
# Apply migration
psql -U urp -d urp_dev -f migration.sql

# Rollback if needed
psql -U urp -d urp_dev -f rollback.sql
```

### Option 3: Using Docker
```bash
# Apply migration
docker exec -i urp_postgres psql -U urp -d urp_dev < migration.sql

# Rollback if needed
docker exec -i urp_postgres psql -U urp -d urp_dev < rollback.sql
```

## Verification

After migration, verify:

```sql
-- Check ENUMs created
SELECT typname FROM pg_type WHERE typname IN ('PriceUnit', 'Direction', 'FurnishingLevel');

-- Check columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rentable_items' 
  AND column_name IN ('base_price', 'province', 'metadata');

-- Check indexes created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'rentable_items' 
  AND indexname LIKE 'idx_rentable_items_%';

-- Check data defaults
SELECT 
  COUNT(*) as total,
  COUNT(metadata) as with_metadata,
  COUNT(currency) as with_currency
FROM rentable_items;
```

## Impact Assessment

### Performance
- ✅ Improved query performance with proper indexes
- ✅ Fast filtering by location, price, amenities
- ✅ Efficient JSONB queries with GIN indexes

### Storage
- Estimated increase: ~2-5KB per record
- For 10,000 records: ~20-50MB additional storage

### Query Changes
- No breaking changes to existing queries
- New fields available for filtering/sorting
- Metadata queries use JSONB operators

## Rollback Plan

If issues occur:

1. Stop application
2. Run `rollback.sql`
3. Restart application
4. All data preserved (columns dropped, but data backed up in Prisma migrations)

## Next Steps

After migration:

1. ✅ Update seed scripts with new fields
2. ✅ Update DTOs with validation
3. ✅ Update UI forms
4. ✅ Update detail components
5. ✅ Test all property types

## Support

For issues or questions:
- Check migration logs
- Verify Prisma schema matches database
- Run `npx prisma db pull` to sync schema
