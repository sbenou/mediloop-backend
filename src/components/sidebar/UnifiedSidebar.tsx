
import { useAuth } from "@/hooks/auth/useAuth";
import PatientSidebar from "./PatientSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import DashboardSidebar from "./DashboardSidebar";

const UnifiedSidebar = () => {
  const { userRole } = useAuth();

  // Return the appropriate sidebar based on user role
  if (userRole === 'patient') {
    return <PatientSidebar />;
  } else if (userRole === 'pharmacist') {
    return <PharmacistSidebar />;
  } else if (userRole === 'superadmin') {
    return <SuperAdminSidebar />;
  }

  // Default to the dashboard sidebar for other roles or when role is not determined yet
  return <DashboardSidebar />;
};

export default UnifiedSidebar;
