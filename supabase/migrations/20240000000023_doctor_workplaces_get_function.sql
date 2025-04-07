
-- Create a function to get a doctor's current workplace
CREATE OR REPLACE FUNCTION public.get_doctor_workplace(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workplace_id UUID;
BEGIN
  SELECT workplace_id INTO v_workplace_id
  FROM public.doctor_workplaces
  WHERE user_id = p_user_id;
  
  RETURN v_workplace_id;
END;
$$;

-- Add RLS policies for the function
GRANT EXECUTE ON FUNCTION public.get_doctor_workplace TO authenticated;
