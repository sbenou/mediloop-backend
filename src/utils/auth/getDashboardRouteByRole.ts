
import { UserRole } from "@/types/role";

export const roleRouteMap = {
  [UserRole.Superadmin]: { route: "/superadmin/dashboard", label: "Superadmin Dashboard" },
  [UserRole.Doctor]: { route: "/dashboard", label: "Doctor Dashboard" },
  [UserRole.Pharmacist]: { route: "/dashboard?view=pharmacy&section=dashboard", label: "Pharmacy Dashboard" },
  [UserRole.Patient]: { route: "/dashboard", label: "Patient Dashboard" },
};

export const getDashboardRouteByRole = (role?: string): string => {
  if (!role) return "/dashboard";
  console.log(`Getting dashboard route for role: ${role}`);
  const route = roleRouteMap[role as keyof typeof roleRouteMap]?.route || "/dashboard";
  console.log(`Determined route: ${route}`);
  return route;
};
