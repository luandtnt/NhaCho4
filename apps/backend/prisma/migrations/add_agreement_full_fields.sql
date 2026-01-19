-- Migration: Add full Agreement fields for all 11 requirements
-- Date: 2026-01-17
-- Phase: Complete Agreement Module Enhancement

-- Yêu cầu 1: Thông tin định danh hợp đồng
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_code TEXT UNIQUE;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_title TEXT;

-- Yêu cầu 4: Thời hạn thuê & lịch thanh toán
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS payment_due_days INTEGER DEFAULT 5;

-- Yêu cầu 5: Giá thuê & các khoản phí bổ sung
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS parking_fee_motorbike DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS parking_fee_car DECIMAL(15,2) DEFAULT 0;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS internet_fee DECIMAL(15,2) DEFAULT 0;

-- Yêu cầu 6: Điện/Nước - giá cụ thể
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS electricity_rate DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS water_rate DECIMAL(10,2);

-- Yêu cầu 7: Điều khoản & nội quy
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS termination_clause TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS violation_penalty DECIMAL(15,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_pets BOOLEAN DEFAULT false;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_smoking BOOLEAN DEFAULT false;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT true;

-- Yêu cầu 8: Bàn giao & tài sản
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_date TIMESTAMP;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_condition TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS furniture_list JSONB;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS initial_electricity DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS initial_water DECIMAL(10,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS handover_document_url TEXT;

-- Yêu cầu 9: File đính kèm
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS contract_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_document_url TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS property_document_url TEXT;

-- Create index for contract_code
CREATE INDEX IF NOT EXISTS idx_agreements_contract_code ON agreements(contract_code);

-- Add comments
COMMENT ON COLUMN agreements.contract_code IS 'Mã hợp đồng tự sinh (AG-2026-00012)';
COMMENT ON COLUMN agreements.contract_title IS 'Tiêu đề hợp đồng';
COMMENT ON COLUMN agreements.billing_day IS 'Ngày chốt hóa đơn (1-28)';
COMMENT ON COLUMN agreements.payment_due_days IS 'Hạn thanh toán (số ngày)';
COMMENT ON COLUMN agreements.electricity_rate IS 'Giá điện (VND/kWh) nếu OWNER_RATE';
COMMENT ON COLUMN agreements.water_rate IS 'Giá nước (VND/m3) nếu OWNER_RATE';
COMMENT ON COLUMN agreements.house_rules IS 'Nội quy chung';
COMMENT ON COLUMN agreements.termination_clause IS 'Điều khoản chấm dứt trước hạn';
COMMENT ON COLUMN agreements.furniture_list IS 'Danh sách nội thất bàn giao (JSON)';
