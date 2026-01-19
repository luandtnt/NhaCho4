-- Rollback: Remove Walk-in Booking Support
-- Date: 2026-01-17

-- Drop indexes
DROP INDEX IF EXISTS idx_bookings_actual_start_at;
DROP INDEX IF EXISTS idx_bookings_actual_end_at;
DROP INDEX IF EXISTS idx_bookings_is_walk_in;
DROP INDEX IF EXISTS idx_bookings_status_start_at;

-- Remove columns
ALTER TABLE bookings 
DROP COLUMN IF EXISTS actual_start_at,
DROP COLUMN IF EXISTS actual_end_at,
DROP COLUMN IF EXISTS is_walk_in,
DROP COLUMN IF EXISTS estimated_duration_hours,
DROP COLUMN IF EXISTS walk_in_notes;
