
export const getDashboardRouteByRole = (role?: string): string => {
  switch (role) {
    case "superadmin":
      return "/superadmin/dashboard";
    case "doctor":
      return "/doctor";
    case "pharmacist":
      return "/pharmacy";
    case "patient":
      return "/patient-dashboard";
    default:
      return "/dashboard"; // Fallback for unknown or future roles
  }
};
