-- Migration: Add profile fields to users table
-- Date: 2026-01-17
-- Purpose: Add name, phone, emergency_contact, id_number for user profiles

-- Add profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Add comments
COMMENT ON COLUMN users.name IS 'Họ và tên người dùng';
COMMENT ON COLUMN users.phone IS 'Số điện thoại';
COMMENT ON COLUMN users.emergency_contact IS 'Liên hệ khẩn cấp';
COMMENT ON COLUMN users.id_number IS 'Số CCCD/Passport (bắt buộc cho Landlord)';
