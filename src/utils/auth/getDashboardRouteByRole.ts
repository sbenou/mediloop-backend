
/**
 * Returns the correct dashboard route based on the user's role
 */
export const getDashboardRouteByRole = (role?: string): string => {
  // Default to patient dashboard if no role is provided
  if (!role) {
    return '/dashboard';
  }
  
  // Convert role to lowercase and ensure 'user' is migrated to 'patient'
  const normalizedRole = role.toLowerCase() === 'user' ? 'patient' : role.toLowerCase();
  
  switch (normalizedRole) {
    case 'doctor':
      return '/dashboard?section=dashboard';
    case 'pharmacist':
      return '/dashboard?view=pharmacy&section=dashboard';
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'patient':
    default:
      return '/dashboard';
  }
};

export default getDashboardRouteByRole;
