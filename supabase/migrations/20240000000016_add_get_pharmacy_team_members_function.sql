
-- Function to get pharmacy team members without infinite recursion
CREATE OR REPLACE FUNCTION public.get_pharmacy_team_members(pharmacy_id_param UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  team_member RECORD;
  profile_data RECORD;
  result json;
BEGIN
  -- Loop through team members for this pharmacy
  FOR team_member IN
    SELECT * FROM pharmacy_team_members
    WHERE pharmacy_id = pharmacy_id_param
    AND deleted_at IS NULL
  LOOP
    -- Get profile data for each member
    SELECT * INTO profile_data
    FROM profiles
    WHERE id = team_member.user_id;
    
    -- Combine data into a single JSON result
    SELECT json_build_object(
      'id', team_member.id,
      'user_id', team_member.user_id,
      'pharmacy_id', team_member.pharmacy_id,
      'role', team_member.role,
      'created_at', team_member.created_at,
      'deleted_at', team_member.deleted_at,
      -- Include profile fields
      'full_name', profile_data.full_name,
      'email', profile_data.email,
      'avatar_url', profile_data.avatar_url,
      'is_active', NOT COALESCE(profile_data.is_blocked, false),
      'is_blocked', profile_data.is_blocked,
      'role_id', profile_data.role_id,
      'date_of_birth', profile_data.date_of_birth,
      'city', profile_data.city,
      'auth_method', profile_data.auth_method,
      'doctor_stamp_url', profile_data.doctor_stamp_url,
      'doctor_signature_url', profile_data.doctor_signature_url,
      'cns_card_front', profile_data.cns_card_front,
      'cns_card_back', profile_data.cns_card_back,
      'cns_number', profile_data.cns_number,
      'updated_at', profile_data.updated_at,
      'license_number', profile_data.license_number
    ) INTO result;
    
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_pharmacy_team_members(UUID) TO authenticated;
