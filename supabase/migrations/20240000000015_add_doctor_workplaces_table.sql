
-- Create doctor_workplaces table for doctor workplace selection
CREATE TABLE IF NOT EXISTS public.doctor_workplaces (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workplace_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id)
);

-- Add RLS policies
ALTER TABLE public.doctor_workplaces ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_workplaces
CREATE POLICY "Users can view their own workplace selection"
    ON public.doctor_workplaces
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workplace selection"
    ON public.doctor_workplaces
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workplace selection"
    ON public.doctor_workplaces
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workplace selection"
    ON public.doctor_workplaces
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
