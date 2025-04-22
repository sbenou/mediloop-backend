
import { useAuth } from "@/hooks/auth/useAuth";
import PatientSidebar from "./PatientSidebar";
import DoctorSidebar from "./DoctorSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { PERMISSIONS } from "@/config/permissions";
import UnifiedSidebar from "./UnifiedSidebar";

const Sidebar = () => {
  const { userRole, hasPermission, isLoading } = useAuth();
  
  console.log("✅ Sidebar: Rendering sidebar for role:", userRole);
  
  // Render the appropriate sidebar based on user role
  switch (userRole) {
    case "doctor":
      return (
        <UnifiedSidebar />
      );
    case "pharmacist":
      return (
        <UnifiedSidebar />
      );
    case "superadmin":
      return <SuperAdminSidebar />;
    case "patient":
    default:
      if (!userRole && !isLoading) {
        console.warn("⚠️ Sidebar: No userRole available", { userRole, isLoading });
      }
      return <PatientSidebar />;
  }
};

export default Sidebar;
