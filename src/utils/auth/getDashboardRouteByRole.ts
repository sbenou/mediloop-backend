
/**
 * Returns the correct dashboard route based on the user's role
 */
export const getDashboardRouteByRole = (role?: string): string => {
  // Default to patient dashboard
  if (!role) {
    return '/dashboard';
  }
  
  switch (role.toLowerCase()) {
    case 'doctor':
      return '/dashboard?section=dashboard';
    case 'pharmacist':
      return '/dashboard?view=pharmacy&section=dashboard';
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'patient':
    case 'user':
    default:
      return '/dashboard';
  }
};

export default getDashboardRouteByRole;
