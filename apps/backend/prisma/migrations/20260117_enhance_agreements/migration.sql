-- Migration: Enhance Agreements Module
-- Date: 2026-01-17
-- Description: Add full agreement management fields

-- Add rentable_item_id (link to property)
ALTER TABLE agreements ADD COLUMN rentable_item_id TEXT;

-- Add pricing fields
ALTER TABLE agreements ADD COLUMN base_price DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN deposit_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN service_fee DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN building_mgmt_fee DECIMAL(15,2) DEFAULT 0;

-- Add utilities billing
ALTER TABLE agreements ADD COLUMN electricity_billing TEXT;
ALTER TABLE agreements ADD COLUMN water_billing TEXT;

-- Add price increase terms (for LONG_TERM)
ALTER TABLE agreements ADD COLUMN price_increase_percent DECIMAL(5,2);
ALTER TABLE agreements ADD COLUMN price_increase_frequency TEXT; -- YEARLY, NONE

-- Add payment cycle
ALTER TABLE agreements ADD COLUMN payment_cycle TEXT DEFAULT 'MONTHLY';

-- Add status tracking timestamps
ALTER TABLE agreements ADD COLUMN sent_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN confirmed_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN activated_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN terminated_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN expired_at TIMESTAMP;

-- Add termination info
ALTER TABLE agreements ADD COLUMN termination_reason TEXT;
ALTER TABLE agreements ADD COLUMN termination_type TEXT; -- EARLY, NATURAL, CANCELLED
ALTER TABLE agreements ADD COLUMN termination_penalty DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN deposit_refund_amount DECIMAL(15,2);

-- Add renewal tracking
ALTER TABLE agreements ADD COLUMN renewal_of_agreement_id TEXT;
ALTER TABLE agreements ADD COLUMN is_renewed BOOLEAN DEFAULT false;

-- Add request tracking (tenant requests)
ALTER TABLE agreements ADD COLUMN pending_request_type TEXT; -- RENEW, TERMINATE, null
ALTER TABLE agreements ADD COLUMN pending_request_data JSONB;
ALTER TABLE agreements ADD COLUMN pending_request_at TIMESTAMP;

-- Add snapshot for terms (when activated)
ALTER TABLE agreements ADD COLUMN snapshot_terms JSONB;
ALTER TABLE agreements ADD COLUMN snapshot_pricing JSONB;

-- Add notes
ALTER TABLE agreements ADD COLUMN landlord_notes TEXT;
ALTER TABLE agreements ADD COLUMN tenant_notes TEXT;

-- Add rejection info
ALTER TABLE agreements ADD COLUMN rejected_at TIMESTAMP;
ALTER TABLE agreements ADD COLUMN rejection_reason TEXT;

-- Foreign key to rentable_item
ALTER TABLE agreements ADD CONSTRAINT fk_agreements_rentable_item 
  FOREIGN KEY (rentable_item_id) REFERENCES rentable_items(id) ON DELETE SET NULL;

-- Foreign key to renewal
ALTER TABLE agreements ADD CONSTRAINT fk_agreements_renewal 
  FOREIGN KEY (renewal_of_agreement_id) REFERENCES agreements(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_agreements_rentable_item ON agreements(rentable_item_id);
CREATE INDEX idx_agreements_state ON agreements(state);
CREATE INDEX idx_agreements_dates ON agreements(start_at, end_at);
CREATE INDEX idx_agreements_tenant ON agreements(tenant_party_id);
CREATE INDEX idx_agreements_landlord ON agreements(landlord_party_id);
CREATE INDEX idx_agreements_active ON agreements(org_id, state) WHERE state = 'ACTIVE';

-- Comment
COMMENT ON COLUMN agreements.state IS 'DRAFT, SENT, PENDING_CONFIRM, ACTIVE, EXPIRED, TERMINATED, CANCELLED';
COMMENT ON COLUMN agreements.agreement_type IS 'lease (mid/long term), booking (short term)';
COMMENT ON COLUMN agreements.payment_cycle IS 'MONTHLY, QUARTERLY, YEARLY';
COMMENT ON COLUMN agreements.electricity_billing IS 'METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE, INCLUDED';
COMMENT ON COLUMN agreements.water_billing IS 'METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE, INCLUDED';
