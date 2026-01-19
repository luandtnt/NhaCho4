-- Enhanced Property Schema Migration
-- Version: 1.0
-- Date: 2026-01-16
-- Description: Add comprehensive property fields with ENUMs and structured metadata

-- ============================================================================
-- STEP 1: Create ENUMs
-- ============================================================================

CREATE TYPE "PriceUnit" AS ENUM ('HOUR', 'NIGHT', 'MONTH');
CREATE TYPE "Direction" AS ENUM ('EAST', 'WEST', 'SOUTH', 'NORTH', 'NORTHEAST', 'NORTHWEST', 'SOUTHEAST', 'SOUTHWEST');
CREATE TYPE "FurnishingLevel" AS ENUM ('FULL', 'PARTIAL', 'NONE');
CREATE TYPE "UtilityBilling" AS ENUM ('METER_PRIVATE', 'SHARED', 'OWNER_RATE', 'STATE_RATE');
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');
CREATE TYPE "HousekeepingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'ON_REQUEST');
CREATE TYPE "GenderPolicy" AS ENUM ('MALE', 'FEMALE', 'MIXED');

-- ============================================================================
-- STEP 2: Add Location Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN address_full TEXT;
ALTER TABLE rentable_items ADD COLUMN province VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN district VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN ward VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN geo_lat DECIMAL(10, 8);
ALTER TABLE rentable_items ADD COLUMN geo_lng DECIMAL(11, 8);

-- ============================================================================
-- STEP 3: Add Pricing & Contract Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN base_price DECIMAL(15, 2) CHECK (base_price IS NULL OR base_price > 0);
ALTER TABLE rentable_items ADD COLUMN price_unit "PriceUnit";
ALTER TABLE rentable_items ADD COLUMN currency VARCHAR(3) DEFAULT 'VND';
ALTER TABLE rentable_items ADD COLUMN min_rent_duration INT CHECK (min_rent_duration IS NULL OR min_rent_duration >= 1);
ALTER TABLE rentable_items ADD COLUMN deposit_amount DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN booking_hold_deposit DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN service_fee DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN building_mgmt_fee DECIMAL(15, 2);

-- ============================================================================
-- STEP 4: Add Physical Details Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN floors INT;
ALTER TABLE rentable_items ADD COLUMN apartment_floor INT;
ALTER TABLE rentable_items ADD COLUMN direction "Direction";
ALTER TABLE rentable_items ADD COLUMN balcony BOOLEAN;
ALTER TABLE rentable_items ADD COLUMN frontage_m DECIMAL(8, 2) CHECK (frontage_m IS NULL OR frontage_m > 0);
ALTER TABLE rentable_items ADD COLUMN parking_slots INT CHECK (parking_slots IS NULL OR parking_slots >= 0);

-- ============================================================================
-- STEP 5: Add Furnishing & Amenities Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN furnishing_level "FurnishingLevel";

-- amenities already exists as JSON, ensure it's JSONB
ALTER TABLE rentable_items ALTER COLUMN amenities TYPE JSONB USING amenities::jsonb;
ALTER TABLE rentable_items ALTER COLUMN amenities SET DEFAULT '[]'::jsonb;

-- ============================================================================
-- STEP 6: Add Short-term Booking Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN checkin_time VARCHAR(5);  -- "HH:mm" format
ALTER TABLE rentable_items ADD COLUMN checkout_time VARCHAR(5); -- "HH:mm" format
ALTER TABLE rentable_items ADD COLUMN max_occupancy INT CHECK (max_occupancy IS NULL OR max_occupancy >= 1);

-- ============================================================================
-- STEP 7: Add Utilities Billing Columns
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN electricity_billing "UtilityBilling";
ALTER TABLE rentable_items ADD COLUMN water_billing "UtilityBilling";

-- ============================================================================
-- STEP 8: Add Metadata Column
-- ============================================================================

ALTER TABLE rentable_items ADD COLUMN metadata JSONB DEFAULT '{"version": 1}'::jsonb;

-- ============================================================================
-- STEP 9: Create Indexes
-- ============================================================================

-- Location indexes
CREATE INDEX idx_rentable_items_province ON rentable_items(province);
CREATE INDEX idx_rentable_items_district ON rentable_items(district);
CREATE INDEX idx_rentable_items_ward ON rentable_items(ward);
CREATE INDEX idx_rentable_items_geo ON rentable_items(geo_lat, geo_lng) WHERE geo_lat IS NOT NULL AND geo_lng IS NOT NULL;

-- Pricing indexes
CREATE INDEX idx_rentable_items_base_price ON rentable_items(base_price) WHERE base_price IS NOT NULL;
CREATE INDEX idx_rentable_items_price_unit ON rentable_items(price_unit) WHERE price_unit IS NOT NULL;

-- Physical indexes
CREATE INDEX idx_rentable_items_bedrooms ON rentable_items(bedrooms) WHERE bedrooms IS NOT NULL;
CREATE INDEX idx_rentable_items_bathrooms ON rentable_items(bathrooms) WHERE bathrooms IS NOT NULL;
CREATE INDEX idx_rentable_items_area ON rentable_items(area_sqm) WHERE area_sqm IS NOT NULL;
CREATE INDEX idx_rentable_items_furnishing ON rentable_items(furnishing_level) WHERE furnishing_level IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_rentable_items_search ON rentable_items(property_category, rental_duration_type, status);
CREATE INDEX idx_rentable_items_location_search ON rentable_items(province, district, property_category) WHERE province IS NOT NULL;

-- JSONB GIN indexes
CREATE INDEX idx_rentable_items_amenities_gin ON rentable_items USING GIN (amenities);
CREATE INDEX idx_rentable_items_metadata_gin ON rentable_items USING GIN (metadata);

-- ============================================================================
-- STEP 10: Update Existing Data with Defaults
-- ============================================================================

-- Set default currency and price_unit for existing records
UPDATE rentable_items 
SET 
  currency = 'VND',
  price_unit = 'MONTH',
  furnishing_level = 'PARTIAL'
WHERE currency IS NULL OR price_unit IS NULL OR furnishing_level IS NULL;

-- Initialize metadata for existing records
UPDATE rentable_items 
SET metadata = jsonb_build_object(
  'version', 1,
  'property_type', COALESCE(property_category, 'APARTMENT'),
  'lease_group', 
    CASE 
      WHEN rental_duration_type = 'SHORT_TERM' THEN 'SHORT'
      WHEN rental_duration_type = 'MEDIUM_TERM' THEN 'MID'
      WHEN rental_duration_type = 'LONG_TERM' THEN 'LONG'
      ELSE 'MID'
    END,
  'details', '{}'::jsonb
)
WHERE metadata = '{"version": 1}'::jsonb OR metadata IS NULL;

-- Ensure amenities is array for existing records
UPDATE rentable_items 
SET amenities = '[]'::jsonb
WHERE amenities IS NULL OR amenities = 'null'::jsonb;

-- ============================================================================
-- STEP 11: Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN rentable_items.metadata IS 'Structured metadata with version, property_type, lease_group, and type-specific details';
COMMENT ON COLUMN rentable_items.amenities IS 'Array of amenity codes (e.g., ["WIFI", "AC", "PARKING"])';
COMMENT ON COLUMN rentable_items.price_unit IS 'HOUR for hourly, NIGHT for nightly, MONTH for monthly rentals';
COMMENT ON COLUMN rentable_items.furnishing_level IS 'FULL = fully furnished, PARTIAL = partially furnished, NONE = unfurnished';
COMMENT ON COLUMN rentable_items.electricity_billing IS 'How electricity is billed: METER_PRIVATE, SHARED, OWNER_RATE, or STATE_RATE';
COMMENT ON COLUMN rentable_items.water_billing IS 'How water is billed: METER_PRIVATE, SHARED, OWNER_RATE, or STATE_RATE';

-- ============================================================================
-- Migration Complete
-- ============================================================================
