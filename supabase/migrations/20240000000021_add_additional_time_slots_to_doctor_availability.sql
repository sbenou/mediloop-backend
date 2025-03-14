
-- Add additional_time_slots column to doctor_availability table
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS additional_time_slots JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN doctor_availability.additional_time_slots IS 'JSON array of additional time slots with startTime and endTime properties';
