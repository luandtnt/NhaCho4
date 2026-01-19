-- Invoice Module Phase 1 Enhancements
-- Date: 2026-01-19
-- Purpose: Add missing fields for complete invoice management

-- Step 1: Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_party_id VARCHAR;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rentable_item_id VARCHAR;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS booking_id VARCHAR;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_code VARCHAR;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal_amount BIGINT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due BIGINT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS state VARCHAR DEFAULT 'DRAFT';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount BIGINT DEFAULT 0;

-- Step 2: Create invoice_line_items table (normalize from JSON)
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- RENT, SERVICE_FEE, MGMT_FEE, ELECTRICITY, WATER, PARKING, INTERNET, OTHER
  description TEXT NOT NULL,
  qty DECIMAL(10,2) DEFAULT 1,
  unit_price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_invoice_line_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_party ON invoices(tenant_party_id);
CREATE INDEX IF NOT EXISTS idx_invoices_rentable_item ON invoices(rentable_item_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_code ON invoices(invoice_code);
CREATE INDEX IF NOT EXISTS idx_invoices_state ON invoices(state);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at ON invoices(due_at);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_type ON invoice_line_items(type);

-- Step 4: Migrate existing data
-- Update state from status (ISSUED -> ISSUED, PAID -> PAID, VOID -> CANCELLED, OVERDUE -> OVERDUE)
UPDATE invoices SET state = 
  CASE 
    WHEN status = 'VOID' THEN 'CANCELLED'
    ELSE status
  END
WHERE state IS NULL OR state = 'DRAFT';

-- Set balance_due = total_amount for unpaid invoices
UPDATE invoices SET balance_due = total_amount 
WHERE status IN ('ISSUED', 'OVERDUE') AND balance_due IS NULL;

-- Set balance_due = 0 for paid invoices
UPDATE invoices SET balance_due = 0 
WHERE status = 'PAID' AND balance_due IS NULL;

-- Set subtotal_amount = total_amount (no tax initially)
UPDATE invoices SET subtotal_amount = total_amount 
WHERE subtotal_amount IS NULL;

-- Step 5: Populate tenant_party_id and rentable_item_id from agreements
UPDATE invoices i
SET 
  tenant_party_id = a.tenant_party_id,
  rentable_item_id = a.rentable_item_id
FROM agreements a
WHERE i.agreement_id = a.id
  AND (i.tenant_party_id IS NULL OR i.rentable_item_id IS NULL);

-- Step 6: Generate invoice_code for existing invoices
-- Format: INV-YYYYMM-XXXX
-- Use a simpler approach without window functions
DO $$
DECLARE
  inv RECORD;
  year_month TEXT;
  sequence INT;
  new_code TEXT;
BEGIN
  FOR inv IN SELECT id, org_id, created_at FROM invoices WHERE invoice_code IS NULL ORDER BY created_at
  LOOP
    year_month := TO_CHAR(inv.created_at, 'YYYYMM');
    
    -- Get next sequence for this org and month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_code FROM 12) AS INT)), 0) + 1
    INTO sequence
    FROM invoices
    WHERE org_id = inv.org_id
      AND invoice_code LIKE 'INV-' || year_month || '-%';
    
    new_code := 'INV-' || year_month || '-' || LPAD(sequence::text, 4, '0');
    
    UPDATE invoices SET invoice_code = new_code WHERE id = inv.id;
  END LOOP;
END $$;

-- Step 7: Add unique constraint on invoice_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_code_unique ON invoices(invoice_code);

-- Step 8: Migrate line_items from JSON to table
-- This will be done in application code to handle JSON parsing properly

-- Step 9: Add comments for documentation
COMMENT ON COLUMN invoices.state IS 'Invoice state: DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED';
COMMENT ON COLUMN invoices.status IS 'Legacy status field, use state instead';
COMMENT ON COLUMN invoices.invoice_code IS 'Human-readable invoice code: INV-YYYYMM-XXXX';
COMMENT ON COLUMN invoices.tenant_party_id IS 'Tenant party ID for isolation';
COMMENT ON COLUMN invoices.balance_due IS 'Remaining amount to be paid';
COMMENT ON COLUMN invoices.tax_enabled IS 'Whether tax/VAT is applied';
COMMENT ON COLUMN invoices.tax_rate IS 'Tax rate in percentage (e.g., 10.00 for 10%)';
COMMENT ON COLUMN invoices.tax_amount IS 'Calculated tax amount';
COMMENT ON TABLE invoice_line_items IS 'Normalized invoice line items (replaces JSON field)';

-- Step 10: Create function to auto-generate invoice_code
CREATE OR REPLACE FUNCTION generate_invoice_code(p_org_id VARCHAR, p_created_at TIMESTAMP)
RETURNS VARCHAR AS $$
DECLARE
  v_year_month VARCHAR;
  v_sequence INT;
  v_code VARCHAR;
BEGIN
  v_year_month := TO_CHAR(p_created_at, 'YYYYMM');
  
  -- Get next sequence number for this org and month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_code FROM 12) AS INT)), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE org_id = p_org_id
    AND invoice_code LIKE 'INV-' || v_year_month || '-%';
  
  v_code := 'INV-' || v_year_month || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invoice_code IS 'Auto-generate invoice code in format INV-YYYYMM-XXXX';
