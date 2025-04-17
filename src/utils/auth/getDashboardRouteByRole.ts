
import { UserRole } from "@/types/role";

export const roleRouteMap = {
  [UserRole.Superadmin]: { route: "/superadmin/dashboard", label: "Superadmin Dashboard" },
  [UserRole.Doctor]: { route: "/dashboard?section=dashboard", label: "Doctor Dashboard" },
  [UserRole.Pharmacist]: { route: "/dashboard?view=pharmacy&section=dashboard", label: "Pharmacy Dashboard" },
  [UserRole.Patient]: { route: "/dashboard", label: "Patient Dashboard" },
};

/**
 * Returns the correct dashboard route based on the user's role
 * Always normalizes 'user' role to 'patient'
 */
export const getDashboardRouteByRole = (role?: string): string => {
  // Default to patient dashboard if no role is provided
  if (!role) {
    console.log("[getDashboardRouteByRole] No role provided, defaulting to patient dashboard");
    return "/dashboard";
  }
  
  // Normalize role - always convert 'user' to 'patient'
  const normalizedRole = role.toLowerCase() === 'user' ? 'patient' : role.toLowerCase();
  
  console.log(`[getDashboardRouteByRole] Getting route for normalized role: ${normalizedRole}`);
  console.log(`[getDashboardRouteByRole] Available routes:`, roleRouteMap);
  
  const routeConfig = roleRouteMap[normalizedRole as keyof typeof roleRouteMap];
  const route = routeConfig?.route || "/dashboard";
  
  console.log(`[getDashboardRouteByRole] Determined route: ${route}`);
  
  if (!routeConfig) {
    console.warn(`[getDashboardRouteByRole] No route mapping for role: ${normalizedRole}`);
  }
  
  return route;
};

export default getDashboardRouteByRole;
