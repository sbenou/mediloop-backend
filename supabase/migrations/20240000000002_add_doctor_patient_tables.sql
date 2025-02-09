DROP TYPE IF EXISTS connection_status CASCADE;

-- Create an enum for connection status
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');


DROP TABLE IF EXISTS public.doctor_patient_connections CASCADE;

-- Create doctor_patient_connections table
CREATE TABLE IF NOT EXISTS public.doctor_patient_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status connection_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(doctor_id, patient_id)
);


DROP POLICY IF EXISTS "Users can view their own connections" ON public.doctor_patient_connections;

CREATE POLICY "Users can view their own connections"
    ON public.doctor_patient_connections
    FOR SELECT
    USING (
        auth.uid() = doctor_id OR 
        auth.uid() = patient_id
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE policyname = 'Patients can create connection requests'
        AND tablename = 'doctor_patient_connections'
    ) THEN
        CREATE POLICY "Patients can create connection requests"
        ON public.doctor_patient_connections
        FOR INSERT
        TO authenticated
        WITH CHECK (
            auth.uid() = doctor_patient_connections.patient_id
            AND doctor_patient_connections.status = 'pending'::connection_status
        );
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can update their own connections" ON public.doctor_patient_connections;

CREATE POLICY "Users can update their own connections"
    ON public.doctor_patient_connections
    FOR UPDATE
    USING (
        auth.uid() = doctor_id OR 
        auth.uid() = patient_id
    );

-- Add RLS policies for doctor_patient_connections
ALTER TABLE public.doctor_patient_connections ENABLE ROW LEVEL SECURITY;

-- Add cascade delete to prescriptions table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
        ALTER TABLE public.prescriptions
        DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey,
        ADD CONSTRAINT prescriptions_doctor_id_fkey 
            FOREIGN KEY (doctor_id) 
            REFERENCES public.profiles(id) 
            ON DELETE CASCADE;
            
        ALTER TABLE public.prescriptions
        DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey,
        ADD CONSTRAINT prescriptions_patient_id_fkey 
            FOREIGN KEY (patient_id) 
            REFERENCES public.profiles(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- Create function to handle connection requests
CREATE OR REPLACE FUNCTION handle_connection_request(
    doctor_id UUID,
    status connection_status
) RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Update the connection status
    UPDATE public.doctor_patient_connections
    SET 
        status = handle_connection_request.status,
        updated_at = NOW()
    WHERE 
        doctor_patient_connections.doctor_id = handle_connection_request.doctor_id
        AND doctor_patient_connections.patient_id = auth.uid()
        AND doctor_patient_connections.status = 'pending'
    RETURNING json_build_object(
        'id', doctor_patient_connections.id,
        'status', doctor_patient_connections.status,
        'updated_at', doctor_patient_connections.updated_at
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;