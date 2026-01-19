-- Migration: Pricing Policy System
-- Date: 2026-01-16
-- Description: Create pricing policies, versions, and booking snapshots tables

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PRICING POLICIES TABLE
-- ============================================================================

CREATE TABLE pricing_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  updated_reason TEXT,
  
  -- Applicability
  property_category VARCHAR(100) NOT NULL,
  rental_duration_type VARCHAR(50) NOT NULL,
  
  -- Geographic Scope
  scope_province VARCHAR(100),
  scope_district VARCHAR(100),
  
  -- Pricing Mode
  pricing_mode VARCHAR(50) NOT NULL DEFAULT 'FIXED',
  
  -- Core Pricing
  base_price DECIMAL(15,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL,
  min_rent_duration INTEGER NOT NULL,
  
  -- Deposits
  deposit_amount DECIMAL(15,2),
  booking_hold_deposit DECIMAL(15,2),
  
  -- Utilities & Fees
  service_fee DECIMAL(15,2),
  building_management_fee DECIMAL(15,2),
  electricity_billing VARCHAR(50),
  water_billing VARCHAR(50),
  
  -- Type-specific pricing (JSONB)
  pricing_details JSONB NOT NULL DEFAULT '{}',
  
  -- Tiered Pricing
  tiered_pricing JSONB,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  superseded_by UUID,
  
  CONSTRAINT pricing_policies_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT pricing_policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT pricing_policies_superseded_by_fkey FOREIGN KEY (superseded_by) REFERENCES pricing_policies(id) ON DELETE SET NULL,
  CONSTRAINT pricing_policies_base_price_check CHECK (base_price > 0),
  CONSTRAINT pricing_policies_min_rent_duration_check CHECK (min_rent_duration >= 1),
  CONSTRAINT pricing_policies_version_check CHECK (version >= 1)
);

-- Indexes
CREATE INDEX idx_pricing_policies_org_id ON pricing_policies(org_id);
CREATE INDEX idx_pricing_policies_status ON pricing_policies(status);
CREATE INDEX idx_pricing_policies_property_category ON pricing_policies(property_category);
CREATE INDEX idx_pricing_policies_rental_duration_type ON pricing_policies(rental_duration_type);
CREATE INDEX idx_pricing_policies_version ON pricing_policies(version);
CREATE INDEX idx_pricing_policies_effective_dates ON pricing_policies(effective_from, effective_to);
CREATE INDEX idx_pricing_policies_scope ON pricing_policies(scope_province, scope_district);
CREATE INDEX idx_pricing_policies_superseded_by ON pricing_policies(superseded_by);

-- ============================================================================
-- 2. PRICING POLICY VERSIONS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE pricing_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL,
  version INTEGER NOT NULL,
  
  -- Snapshot
  policy_snapshot JSONB NOT NULL,
  
  -- Change tracking
  changed_by TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  change_reason TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  
  -- What changed
  changed_fields JSONB,
  
  CONSTRAINT pricing_policy_versions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES pricing_policies(id) ON DELETE CASCADE,
  CONSTRAINT pricing_policy_versions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT pricing_policy_versions_version_check CHECK (version >= 1),
  CONSTRAINT pricing_policy_versions_unique_version UNIQUE (policy_id, version)
);

-- Indexes
CREATE INDEX idx_pricing_policy_versions_policy_id ON pricing_policy_versions(policy_id);
CREATE INDEX idx_pricing_policy_versions_version ON pricing_policy_versions(policy_id, version);
CREATE INDEX idx_pricing_policy_versions_changed_at ON pricing_policy_versions(changed_at);

-- ============================================================================
-- 3. BOOKING PRICE SNAPSHOTS TABLE
-- ============================================================================

CREATE TABLE booking_price_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL UNIQUE,
  
  -- Policy reference
  pricing_policy_id UUID,
  pricing_policy_version INTEGER,
  
  -- Snapshot
  base_price DECIMAL(15,2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL,
  
  -- Calculation breakdown
  calculation_breakdown JSONB NOT NULL,
  
  -- Totals (denormalized)
  subtotal DECIMAL(15,2) NOT NULL,
  total_extras DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_discounts DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_peak_adjustments DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL,
  
  -- Deposits
  booking_hold_deposit DECIMAL(15,2),
  deposit_amount DECIMAL(15,2),
  payable_now DECIMAL(15,2) NOT NULL,
  
  -- Metadata
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  calculated_by VARCHAR(100) NOT NULL,
  
  CONSTRAINT booking_price_snapshots_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT booking_price_snapshots_pricing_policy_fkey FOREIGN KEY (pricing_policy_id) REFERENCES pricing_policies(id) ON DELETE SET NULL,
  CONSTRAINT booking_price_snapshots_grand_total_check CHECK (grand_total > 0)
);

-- Indexes
CREATE INDEX idx_booking_price_snapshots_booking_id ON booking_price_snapshots(booking_id);
CREATE INDEX idx_booking_price_snapshots_policy ON booking_price_snapshots(pricing_policy_id, pricing_policy_version);

-- ============================================================================
-- 4. UPDATE RENTABLE_ITEMS TABLE
-- ============================================================================

ALTER TABLE rentable_items 
ADD COLUMN pricing_policy_id UUID,
ADD COLUMN pricing_policy_version INTEGER,
ADD COLUMN pricing_override JSONB,
ADD COLUMN pricing_snapshot_at TIMESTAMP;

ALTER TABLE rentable_items
ADD CONSTRAINT rentable_items_pricing_policy_fkey 
FOREIGN KEY (pricing_policy_id) REFERENCES pricing_policies(id) ON DELETE SET NULL;

CREATE INDEX idx_rentable_items_pricing_policy ON rentable_items(pricing_policy_id, pricing_policy_version);

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE pricing_policies IS 'Pricing policy templates for rentable items';
COMMENT ON TABLE pricing_policy_versions IS 'Audit trail for pricing policy changes';
COMMENT ON TABLE booking_price_snapshots IS 'Immutable price snapshots for bookings';

COMMENT ON COLUMN pricing_policies.version IS 'Version number, increments on update';
COMMENT ON COLUMN pricing_policies.effective_from IS 'When this version becomes active';
COMMENT ON COLUMN pricing_policies.effective_to IS 'When this version expires (NULL = current)';
COMMENT ON COLUMN pricing_policies.superseded_by IS 'Link to newer version of this policy';
COMMENT ON COLUMN pricing_policies.pricing_mode IS 'FIXED, TIERED, or DYNAMIC';
COMMENT ON COLUMN pricing_policies.scope_province IS 'Geographic scope - province (NULL = all)';
COMMENT ON COLUMN pricing_policies.scope_district IS 'Geographic scope - district (NULL = all)';

COMMENT ON COLUMN booking_price_snapshots.calculation_breakdown IS 'Full price calculation breakdown (immutable)';
COMMENT ON COLUMN booking_price_snapshots.calculated_by IS 'System or user_id who calculated';

COMMENT ON COLUMN rentable_items.pricing_policy_id IS 'Reference to pricing policy';
COMMENT ON COLUMN rentable_items.pricing_policy_version IS 'Version of policy when assigned';
COMMENT ON COLUMN rentable_items.pricing_override IS 'Override specific pricing fields';
COMMENT ON COLUMN rentable_items.pricing_snapshot_at IS 'When pricing was last snapshotted';
