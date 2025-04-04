
-- Add appointment_type column to doctor_availability table if it doesn't exist
ALTER TABLE doctor_availability 
ADD COLUMN IF NOT EXISTS appointment_type TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN doctor_availability.appointment_type IS 'Type of appointment: teleconsultation, in-person, or both';

-- Update existing records to have a default value of "both"
UPDATE doctor_availability 
SET appointment_type = 'both' 
WHERE appointment_type IS NULL;
