
/**
 * Get the appropriate dashboard route for a user based on their role
 * @param role The user role
 * @returns The correct dashboard route for the role
 */
export function getDashboardRouteByRole(role?: string | null): string {
  if (!role) {
    return "/dashboard";
  }

  switch (role.toLowerCase()) {
    case "pharmacist":
      return "/pharmacy/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "superadmin":
      return "/superadmin/dashboard";
    case "user":
    case "patient":
    default:
      return "/dashboard";
  }
}
