
-- Function to set a primary workplace for a doctor
CREATE OR REPLACE FUNCTION public.set_primary_workplace(p_user_id UUID, p_workplace_id UUID)
RETURNS void AS $$
BEGIN
    -- Check if the workplace association exists
    IF EXISTS (SELECT 1 FROM public.doctor_workplaces WHERE user_id = p_user_id AND workplace_id = p_workplace_id) THEN
        -- Set this workplace as primary (trigger will handle setting others to false)
        UPDATE public.doctor_workplaces
        SET is_primary = TRUE
        WHERE user_id = p_user_id AND workplace_id = p_workplace_id;
    ELSE
        -- Insert new workplace association as primary
        INSERT INTO public.doctor_workplaces (user_id, workplace_id, is_primary)
        VALUES (p_user_id, p_workplace_id, TRUE);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
