-- Rollback Enhanced Property Schema Migration
-- Version: 1.0
-- Date: 2026-01-16

-- ============================================================================
-- STEP 1: Drop Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_rentable_items_metadata_gin;
DROP INDEX IF EXISTS idx_rentable_items_amenities_gin;
DROP INDEX IF EXISTS idx_rentable_items_location_search;
DROP INDEX IF EXISTS idx_rentable_items_search;
DROP INDEX IF EXISTS idx_rentable_items_furnishing;
DROP INDEX IF EXISTS idx_rentable_items_area;
DROP INDEX IF EXISTS idx_rentable_items_bathrooms;
DROP INDEX IF EXISTS idx_rentable_items_bedrooms;
DROP INDEX IF EXISTS idx_rentable_items_price_unit;
DROP INDEX IF EXISTS idx_rentable_items_base_price;
DROP INDEX IF EXISTS idx_rentable_items_geo;
DROP INDEX IF EXISTS idx_rentable_items_ward;
DROP INDEX IF EXISTS idx_rentable_items_district;
DROP INDEX IF EXISTS idx_rentable_items_province;

-- ============================================================================
-- STEP 2: Drop Columns
-- ============================================================================

ALTER TABLE rentable_items DROP COLUMN IF EXISTS metadata;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS water_billing;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS electricity_billing;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS max_occupancy;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS checkout_time;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS checkin_time;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS furnishing_level;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS parking_slots;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS frontage_m;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS balcony;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS direction;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS apartment_floor;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS floors;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS building_mgmt_fee;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS service_fee;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS booking_hold_deposit;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS min_rent_duration;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS currency;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS price_unit;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS base_price;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS geo_lng;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS geo_lat;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS ward;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS district;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS province;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS address_full;

-- Revert amenities back to JSON if needed
ALTER TABLE rentable_items ALTER COLUMN amenities TYPE JSON USING amenities::json;

-- ============================================================================
-- STEP 3: Drop ENUMs
-- ============================================================================

DROP TYPE IF EXISTS "GenderPolicy";
DROP TYPE IF EXISTS "HousekeepingFrequency";
DROP TYPE IF EXISTS "CancellationPolicy";
DROP TYPE IF EXISTS "UtilityBilling";
DROP TYPE IF EXISTS "FurnishingLevel";
DROP TYPE IF EXISTS "Direction";
DROP TYPE IF EXISTS "PriceUnit";

-- ============================================================================
-- Rollback Complete
-- ============================================================================
