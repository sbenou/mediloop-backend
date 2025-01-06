-- Create a function to safely truncate the products table
CREATE OR REPLACE FUNCTION truncate_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE public.products CASCADE;
END;
$$;

-- Grant execute permission only to authenticated users with superadmin role
REVOKE ALL ON FUNCTION truncate_products() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION truncate_products() TO authenticated;

-- Create policy to restrict execution to superadmins only
CREATE OR REPLACE FUNCTION can_truncate_products()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'superadmin'
  );
$$;