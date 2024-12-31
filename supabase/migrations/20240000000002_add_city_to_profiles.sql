-- Add city column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update RLS policies to allow users to update their own city
CREATE POLICY "Users can update their own city"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to read city information
CREATE POLICY "Anyone can view city"
ON public.profiles
FOR SELECT
USING (true);