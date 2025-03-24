
import { UserRole } from "@/types/role";

export const roleRouteMap = {
  [UserRole.Superadmin]: { route: "/superadmin/dashboard", label: "Superadmin Dashboard" },
  [UserRole.Doctor]: { route: "/doctor", label: "Doctor Dashboard" },
  [UserRole.Pharmacist]: { route: "/pharmacy", label: "Pharmacy Dashboard" },
  [UserRole.Patient]: { route: "/patient-dashboard", label: "Patient Dashboard" },
};

export const getDashboardRouteByRole = (role?: string): string => {
  if (!role) return "/dashboard";
  return roleRouteMap[role as keyof typeof roleRouteMap]?.route || "/dashboard";
};
