
/**
 * Returns the dashboard route for a specific user role
 */
export function getDashboardRouteByRole(role?: string): string {
  switch (role) {
    case 'doctor':
      return '/doctor/dashboard';
    case 'pharmacist':
      return '/pharmacy/dashboard';
    case 'superadmin':
      return '/universal-dashboard';
    case 'patient':
    case 'user':
    default:
      return '/dashboard';
  }
}

export default getDashboardRouteByRole;
