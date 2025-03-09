
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";

/**
 * A debugging component that logs user role information to help diagnose
 * issues with conditional rendering based on roles
 */
export const RoleDebugger = () => {
  const { userRole, isPharmacist, isAuthenticated, profile } = useAuth();
  
  useEffect(() => {
    console.log("=== ROLE DEBUGGER INFO ===");
    console.log("Is authenticated:", isAuthenticated);
    console.log("User role:", userRole);
    console.log("Is pharmacist:", isPharmacist);
    console.log("Profile data:", profile);
    console.log("========================");
  }, [isAuthenticated, userRole, isPharmacist, profile]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;
