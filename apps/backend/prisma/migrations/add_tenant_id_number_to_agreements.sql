-- Migration: Add tenant_id_number to agreements table
-- Date: 2026-01-17
-- Purpose: Lưu CCCD/Passport của tenant trong hợp đồng

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS tenant_id_number TEXT;

COMMENT ON COLUMN agreements.tenant_id_number IS 'Số CCCD/Passport của tenant (nhập tay khi tạo hợp đồng)';
