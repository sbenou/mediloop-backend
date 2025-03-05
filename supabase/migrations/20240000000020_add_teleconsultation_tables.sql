
-- Create enum for teleconsultation status
CREATE TYPE teleconsultation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create table for teleconsultations
CREATE TABLE public.teleconsultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status teleconsultation_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  room_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up RLS
ALTER TABLE public.teleconsultations ENABLE ROW LEVEL SECURITY;

-- Create policies for teleconsultations

-- Doctors can see their own teleconsultations
CREATE POLICY "Doctors can view their own teleconsultations" 
  ON public.teleconsultations
  FOR SELECT 
  USING (auth.uid() = doctor_id);

-- Patients can see their own teleconsultations
CREATE POLICY "Patients can view their own teleconsultations" 
  ON public.teleconsultations
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Patients can create teleconsultation requests
CREATE POLICY "Patients can create teleconsultation requests" 
  ON public.teleconsultations
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Doctors can update teleconsultations where they are the doctor
CREATE POLICY "Doctors can update their teleconsultations" 
  ON public.teleconsultations
  FOR UPDATE 
  USING (auth.uid() = doctor_id);

-- Patients can update teleconsultations where they are the patient
CREATE POLICY "Patients can update their teleconsultations" 
  ON public.teleconsultations
  FOR UPDATE 
  USING (auth.uid() = patient_id);

-- Add triggers for updated_at
CREATE TRIGGER set_teleconsultations_updated_at
BEFORE UPDATE ON public.teleconsultations
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Enable replication for realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsultations;
