
-- Create a function to seed notifications that bypasses RLS
CREATE OR REPLACE FUNCTION public.seed_user_notifications(
  p_user_id UUID,
  p_notifications JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the permissions of the creator
SET search_path = public
AS $$
DECLARE
  v_notification JSONB;
  v_result JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Delete existing notifications for the user (optional)
  DELETE FROM public.notifications 
  WHERE user_id = p_user_id;
  
  -- Insert each notification from the passed array
  FOR v_notification IN SELECT * FROM jsonb_array_elements(p_notifications)
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      read
    ) VALUES (
      p_user_id,
      v_notification->>'type',
      v_notification->>'title',
      v_notification->>'message',
      (v_notification->>'read')::boolean
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'count', v_count,
    'message', v_count || ' notifications created for user ' || p_user_id
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.seed_user_notifications TO authenticated;
