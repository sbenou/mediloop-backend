
/**
 * Returns the appropriate dashboard route based on user role
 * @param role The user's role
 * @returns The dashboard route
 */
export const getDashboardRouteByRole = (role?: string | null): string => {
  // Default to patient dashboard if no role is provided
  if (!role) {
    console.log("No role provided, defaulting to patient dashboard");
    return '/dashboard';
  }

  // Convert to lowercase to ensure consistent comparison
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';
  console.log(`Getting dashboard route for role: ${normalizedRole}`);

  switch (normalizedRole) {
    case 'doctor':
      return '/doctor/dashboard';
    case 'pharmacist':
      // For pharmacists, use universal dashboard with pharmacy view
      return '/universal-dashboard?view=pharmacy&section=dashboard';
    case 'admin':
    case 'superadmin':
      return '/admin/dashboard';
    case 'patient':
    default:
      return '/dashboard';
  }
};

export default getDashboardRouteByRole;
