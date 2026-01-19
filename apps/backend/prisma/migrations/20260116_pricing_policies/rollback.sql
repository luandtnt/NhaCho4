-- Rollback: Pricing Policy System
-- Date: 2026-01-16

-- Drop foreign key constraints first
ALTER TABLE rentable_items DROP CONSTRAINT IF EXISTS rentable_items_pricing_policy_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_rentable_items_pricing_policy;
DROP INDEX IF EXISTS idx_booking_price_snapshots_policy;
DROP INDEX IF EXISTS idx_booking_price_snapshots_booking_id;
DROP INDEX IF EXISTS idx_pricing_policy_versions_changed_at;
DROP INDEX IF EXISTS idx_pricing_policy_versions_version;
DROP INDEX IF EXISTS idx_pricing_policy_versions_policy_id;
DROP INDEX IF EXISTS idx_pricing_policies_superseded_by;
DROP INDEX IF EXISTS idx_pricing_policies_scope;
DROP INDEX IF EXISTS idx_pricing_policies_effective_dates;
DROP INDEX IF EXISTS idx_pricing_policies_version;
DROP INDEX IF EXISTS idx_pricing_policies_rental_duration_type;
DROP INDEX IF EXISTS idx_pricing_policies_property_category;
DROP INDEX IF EXISTS idx_pricing_policies_status;
DROP INDEX IF EXISTS idx_pricing_policies_org_id;

-- Remove columns from rentable_items
ALTER TABLE rentable_items DROP COLUMN IF EXISTS pricing_snapshot_at;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS pricing_override;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS pricing_policy_version;
ALTER TABLE rentable_items DROP COLUMN IF EXISTS pricing_policy_id;

-- Drop tables
DROP TABLE IF EXISTS booking_price_snapshots;
DROP TABLE IF EXISTS pricing_policy_versions;
DROP TABLE IF EXISTS pricing_policies;
