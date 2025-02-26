
-- Create a function to return user permissions
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE (permission_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_role AS (
        SELECT role_id, role FROM profiles
        WHERE id = auth.uid()
    )
    SELECT DISTINCT rp.permission_id
    FROM role_permissions rp
    JOIN user_role ur ON rp.role_id = ur.role_id::uuid
    UNION
    SELECT DISTINCT up.permission_id
    FROM user_permissions up
    WHERE up.user_id = auth.uid();
END;
$$;

-- Grant execute rights to authenticated users
GRANT EXECUTE ON FUNCTION get_user_permissions() TO authenticated;
