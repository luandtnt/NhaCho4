-- Rollback: Enhance Agreements Module
-- Date: 2026-01-17

-- Drop indexes
DROP INDEX IF EXISTS idx_agreements_rentable_item;
DROP INDEX IF EXISTS idx_agreements_state;
DROP INDEX IF EXISTS idx_agreements_dates;
DROP INDEX IF EXISTS idx_agreements_tenant;
DROP INDEX IF EXISTS idx_agreements_landlord;
DROP INDEX IF EXISTS idx_agreements_active;

-- Drop foreign keys
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS fk_agreements_rentable_item;
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS fk_agreements_renewal;

-- Drop columns
ALTER TABLE agreements DROP COLUMN IF EXISTS rentable_item_id;
ALTER TABLE agreements DROP COLUMN IF EXISTS base_price;
ALTER TABLE agreements DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE agreements DROP COLUMN IF EXISTS service_fee;
ALTER TABLE agreements DROP COLUMN IF EXISTS building_mgmt_fee;
ALTER TABLE agreements DROP COLUMN IF EXISTS electricity_billing;
ALTER TABLE agreements DROP COLUMN IF EXISTS water_billing;
ALTER TABLE agreements DROP COLUMN IF EXISTS price_increase_percent;
ALTER TABLE agreements DROP COLUMN IF EXISTS price_increase_frequency;
ALTER TABLE agreements DROP COLUMN IF EXISTS payment_cycle;
ALTER TABLE agreements DROP COLUMN IF EXISTS sent_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS confirmed_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS activated_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS terminated_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS expired_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS termination_reason;
ALTER TABLE agreements DROP COLUMN IF EXISTS termination_type;
ALTER TABLE agreements DROP COLUMN IF EXISTS termination_penalty;
ALTER TABLE agreements DROP COLUMN IF EXISTS deposit_refund_amount;
ALTER TABLE agreements DROP COLUMN IF EXISTS renewal_of_agreement_id;
ALTER TABLE agreements DROP COLUMN IF EXISTS is_renewed;
ALTER TABLE agreements DROP COLUMN IF EXISTS pending_request_type;
ALTER TABLE agreements DROP COLUMN IF EXISTS pending_request_data;
ALTER TABLE agreements DROP COLUMN IF EXISTS pending_request_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS snapshot_terms;
ALTER TABLE agreements DROP COLUMN IF EXISTS snapshot_pricing;
ALTER TABLE agreements DROP COLUMN IF EXISTS landlord_notes;
ALTER TABLE agreements DROP COLUMN IF EXISTS tenant_notes;
ALTER TABLE agreements DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE agreements DROP COLUMN IF EXISTS rejection_reason;
