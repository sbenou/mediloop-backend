-- Weekly per-doctor availability (Neon). Replaces Supabase REST for doctor_availability.
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT,
  end_time TEXT,
  additional_time_slots JSONB,
  is_available BOOLEAN NOT NULL DEFAULT false,
  appointment_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doctor_availability_doctor_id_idx
  ON public.doctor_availability (doctor_id);

COMMENT ON TABLE public.doctor_availability IS 'Doctor weekly availability; appointment_type null/teleconsultation/in-person/both matches legacy Supabase semantics.';
