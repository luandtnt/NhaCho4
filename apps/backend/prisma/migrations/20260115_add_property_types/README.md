# Property Types Migration

## Overview
This migration adds support for multi-property type system to the URP Platform.

## What's Added

### 1. New Columns in `rentable_items`
- `property_category` - Type of property (HOMESTAY, HOTEL, APARTMENT, etc.)
- `rental_duration_type` - Duration type (SHORT_TERM, MEDIUM_TERM, LONG_TERM)
- `min_rental_days` - Minimum rental period
- `max_rental_days` - Maximum rental period
- `pricing_unit` - How pricing is calculated (PER_NIGHT, PER_MONTH, etc.)
- `area_sqm` - Property area in square meters
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `floor_number` - Floor number
- `amenities` - JSONB array of amenity codes
- `house_rules` - JSONB array of house rules
- `instant_booking` - Whether instant booking is enabled
- `advance_booking_days` - How many days in advance booking is required
- `cancellation_policy` - Cancellation policy (FLEXIBLE, MODERATE, STRICT)

### 2. New Reference Tables

**property_categories**
- 21 predefined property categories
- Organized by duration type (SHORT_TERM, MEDIUM_TERM, LONG_TERM)
- Includes Vietnamese and English names

**amenities**
- 30 common amenities
- Categorized (BASIC, KITCHEN, BATHROOM, ENTERTAINMENT, SAFETY, etc.)
- Applicable to specific property types

### 3. Indexes
- Performance indexes on category, duration_type, amenities
- GIN index for JSONB amenities column

## Running the Migration

### Option 1: Using npm script (Recommended)
```bash
cd apps/backend
npm run migrate:property-types
```

### Option 2: Using Prisma
```bash
cd apps/backend
npx prisma migrate dev --name add_property_types
npx prisma generate
```

### Option 3: Manual SQL
```bash
cd apps/backend
psql $DATABASE_URL < prisma/migrations/20260115_add_property_types/migration.sql
```

## Rollback

If you need to rollback this migration:

```bash
cd apps/backend
npm run rollback:property-types -- --confirm
```

Or manually:
```bash
psql $DATABASE_URL < prisma/migrations/20260115_add_property_types/rollback.sql
```

## Verification

After migration, verify:

1. **Check tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('property_categories', 'amenities');
```

2. **Check data seeded:**
```sql
SELECT COUNT(*) FROM property_categories; -- Should be 21
SELECT COUNT(*) FROM amenities; -- Should be 30
```

3. **Check columns added:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rentable_items' 
AND column_name IN ('property_category', 'amenities');
```

## Backward Compatibility

✅ **This migration is backward compatible:**
- All new columns are nullable or have defaults
- Existing rentable_items are automatically migrated with default values
- Old API calls still work without new fields
- No breaking changes to existing functionality

## Data Migration

Existing `rentable_items` are automatically updated with:
- `property_category` = 'APARTMENT'
- `rental_duration_type` = 'MEDIUM_TERM'
- `pricing_unit` = 'PER_MONTH'
- `min_rental_days` = 30

You can update these values later through the API or admin panel.

## Next Steps

After running this migration:

1. ✅ Generate Prisma client: `npm run prisma:generate`
2. ⏭️ Proceed to Phase 2: Update Backend APIs
3. ⏭️ Proceed to Phase 3: Update Frontend UI

## Troubleshooting

### Error: Column already exists
If you see "column already exists" error, the migration may have been partially applied. Check which columns exist and manually complete the migration.

### Error: Permission denied
Ensure your database user has CREATE TABLE and ALTER TABLE permissions.

### Error: Cannot connect to database
Check your DATABASE_URL environment variable is correct.

## Support

For issues or questions, refer to:
- Main design doc: `docs/MULTI_PROPERTY_TYPE_SYSTEM_DESIGN.md`
- Integration plan: `docs/INTEGRATION_ANALYSIS_AND_PLAN.md`
