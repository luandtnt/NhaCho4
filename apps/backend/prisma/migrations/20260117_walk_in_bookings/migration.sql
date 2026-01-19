-- Migration: Add Walk-in Booking Support
-- Date: 2026-01-17
-- Description: Add fields to support walk-in customers and check-in/check-out tracking

-- Add new columns to bookings table (IF NOT EXISTS to avoid errors)
DO $$ 
BEGIN
    -- Add actual_start_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='actual_start_at') THEN
        ALTER TABLE bookings ADD COLUMN actual_start_at TIMESTAMP;
    END IF;

    -- Add actual_end_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='actual_end_at') THEN
        ALTER TABLE bookings ADD COLUMN actual_end_at TIMESTAMP;
    END IF;

    -- Add is_walk_in column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='is_walk_in') THEN
        ALTER TABLE bookings ADD COLUMN is_walk_in BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add estimated_duration_hours column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='estimated_duration_hours') THEN
        ALTER TABLE bookings ADD COLUMN estimated_duration_hours INTEGER;
    END IF;

    -- Add walk_in_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='walk_in_notes') THEN
        ALTER TABLE bookings ADD COLUMN walk_in_notes TEXT;
    END IF;
END $$;

-- Add indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_bookings_actual_start_at ON bookings(actual_start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_actual_end_at ON bookings(actual_end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_is_walk_in ON bookings(is_walk_in);
CREATE INDEX IF NOT EXISTS idx_bookings_status_start_at ON bookings(status, start_at);
