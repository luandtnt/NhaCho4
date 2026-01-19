-- Fix User fields
-- Add missing fields if not exist

ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR;
