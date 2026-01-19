-- Add missing Agreement fields
-- Date: 2026-01-19

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_code VARCHAR UNIQUE;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_title VARCHAR;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_number VARCHAR;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS billing_day INT DEFAULT 1;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS payment_due_days INT DEFAULT 5;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS parking_fee_motorbike DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS parking_fee_car DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS internet_fee DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS electricity_rate DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS water_rate DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS termination_clause TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS violation_penalty DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_pets BOOLEAN DEFAULT false;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_smoking BOOLEAN DEFAULT false;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT true;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_date TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_condition TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS furniture_list JSONB;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS initial_electricity DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS initial_water DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS property_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS terms_json JSONB DEFAULT '{}';

-- Create index on contract_code
CREATE INDEX IF NOT EXISTS idx_agreements_contract_code ON agreements(contract_code);

-- Comments
COMMENT ON COLUMN agreements.contract_code IS 'Auto-generated contract code: AG-YYYY-XXXXX';
COMMENT ON COLUMN agreements.billing_day IS 'Day of month to generate invoice (1-28)';
COMMENT ON COLUMN agreements.payment_due_days IS 'Number of days after billing_day for payment due';
