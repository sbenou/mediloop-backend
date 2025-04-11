
/**
 * Returns the correct dashboard route based on the user's role
 * Always normalizes 'user' role to 'patient'
 */
export const getDashboardRouteByRole = (role?: string): string => {
  // Default to patient dashboard if no role is provided
  if (!role) {
    console.log("[getDashboardRouteByRole] No role provided, defaulting to patient dashboard");
    return '/dashboard?view=home';
  }
  
  // Normalize role - always convert 'user' to 'patient'
  const normalizedRole = role.toLowerCase() === 'user' ? 'patient' : role.toLowerCase();
  
  console.log(`[getDashboardRouteByRole] Getting route for normalized role: ${normalizedRole}`);
  
  switch (normalizedRole) {
    case 'pharmacist':
      return '/dashboard?view=pharmacy&section=dashboard';
    case 'doctor':
      return '/dashboard?section=dashboard';
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'patient':
      return '/dashboard?view=home';
    default:
      console.log(`[getDashboardRouteByRole] Unknown role: ${normalizedRole}, using patient dashboard`);
      return '/dashboard?view=home';
  }
};

export default getDashboardRouteByRole;
