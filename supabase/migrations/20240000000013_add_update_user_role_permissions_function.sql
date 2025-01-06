-- Create function to update user role and permissions in a transaction
CREATE OR REPLACE FUNCTION update_user_role_and_permissions(
  p_user_id UUID,
  p_new_role TEXT,
  p_new_permissions TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's role
  UPDATE profiles
  SET role = p_new_role
  WHERE id = p_user_id;

  -- Delete existing user permissions
  DELETE FROM user_permissions
  WHERE user_id = p_user_id;

  -- Insert new permissions
  INSERT INTO user_permissions (user_id, permission_id)
  SELECT p_user_id, unnest(p_new_permissions);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role_and_permissions TO authenticated;