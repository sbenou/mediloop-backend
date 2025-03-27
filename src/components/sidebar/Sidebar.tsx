
import { useAuth } from "@/hooks/auth/useAuth";
import PatientSidebar from "./PatientSidebar";
import DoctorSidebar from "./DoctorSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { PERMISSIONS } from "@/config/permissions";

const Sidebar = () => {
  const { userRole, hasPermission, isLoading } = useAuth();
  
  console.log("✅ Sidebar: Rendering sidebar for role:", userRole);
  
  // Render the appropriate sidebar based on user role
  switch (userRole) {
    case "doctor":
      return (
        <DoctorSidebar 
          canPrescribe={hasPermission(PERMISSIONS.PRESCRIPTIONS.MANAGE)}
          canManageStaff={hasPermission(PERMISSIONS.ADMIN.MANAGE_USERS)}
          canViewPrescriptions={hasPermission(PERMISSIONS.PRESCRIPTIONS.VIEW)}
        />
      );
    case "pharmacist":
      return (
        <PharmacistSidebar 
          canViewProducts={hasPermission(PERMISSIONS.PRODUCTS.VIEW)}
          canEditProducts={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
          canManageStaff={hasPermission(PERMISSIONS.ADMIN.MANAGE_USERS)}
          canManagePrescriptions={hasPermission(PERMISSIONS.PRESCRIPTIONS.MANAGE)}
          canViewPrescriptions={hasPermission(PERMISSIONS.PRESCRIPTIONS.VIEW)}
        />
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
