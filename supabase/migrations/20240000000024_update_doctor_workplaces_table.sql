
-- Update doctor_workplaces table to support multiple workplaces
ALTER TABLE public.doctor_workplaces DROP CONSTRAINT IF EXISTS doctor_workplaces_pkey;
ALTER TABLE public.doctor_workplaces ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.doctor_workplaces ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.doctor_workplaces ADD UNIQUE (user_id, workplace_id);

-- Create trigger to ensure only one primary workplace per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_workplace()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_primary THEN
        UPDATE public.doctor_workplaces
        SET is_primary = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_workplace_trigger ON public.doctor_workplaces;

CREATE TRIGGER ensure_single_primary_workplace_trigger
BEFORE INSERT OR UPDATE ON public.doctor_workplaces
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_primary_workplace();

-- Add doctor_availability table a workplace_id field to link availability to specific workplaces
ALTER TABLE public.doctor_availability 
ADD COLUMN IF NOT EXISTS workplace_id UUID REFERENCES public.workplaces(id) ON DELETE SET NULL;
