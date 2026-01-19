-- Rollback Migration: Remove Multi-Property Type Support
-- Date: 2026-01-15
-- Description: Rollback all changes from the property types migration

-- Step 1: Drop reference tables
DROP TABLE IF EXISTS "amenities";
DROP TABLE IF EXISTS "property_categories";

-- Step 2: Drop indexes from rentable_items
DROP INDEX IF EXISTS "idx_rentable_items_category";
DROP INDEX IF EXISTS "idx_rentable_items_duration";
DROP INDEX IF EXISTS "idx_rentable_items_amenities";
DROP INDEX IF EXISTS "idx_rentable_items_pricing_unit";

-- Step 3: Remove columns from rentable_items
ALTER TABLE "rentable_items" 
  DROP COLUMN IF EXISTS "property_category",
  DROP COLUMN IF EXISTS "rental_duration_type",
  DROP COLUMN IF EXISTS "min_rental_days",
  DROP COLUMN IF EXISTS "max_rental_days",
  DROP COLUMN IF EXISTS "pricing_unit",
  DROP COLUMN IF EXISTS "area_sqm",
  DROP COLUMN IF EXISTS "bedrooms",
  DROP COLUMN IF EXISTS "bathrooms",
  DROP COLUMN IF EXISTS "floor_number",
  DROP COLUMN IF EXISTS "amenities",
  DROP COLUMN IF EXISTS "house_rules",
  DROP COLUMN IF EXISTS "instant_booking",
  DROP COLUMN IF EXISTS "advance_booking_days",
  DROP COLUMN IF EXISTS "cancellation_policy";

-- Rollback complete
